# 0x03 LXC 容器应用


## 准备 CT 通用模版 

先准备一个比较全能的模版, 基础镜像使用 alpine-4.19 在 CT模版 -> 模版 菜单中可以找到

::: danger  注意事项
- 去掉非特权容器勾选框 
- 硬盘小一点
:::

其他后面都可以调整, 随便填

```bash
# 更新国内源加速
sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
apk update
# 安装常用软件
apk add neovim zsh util-linux shadow git curl
# 使用 neovim 替换 vi/vim/nvim 命令
cd /usr/bin
rm vi && ln -s nvim vim && ln -s nvim vi
# 安装 oh-my-zsh
sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"

# 安装之后会有提示 zsh 作为默认 shell, 不小心错过了可以手动执行
# chsh -s /bin/zsh
# 重启生效
reboot
```

之后关闭容器, 就可以把119转换 CT 模板了， 下次就可以直接从这个模版克隆出来

## 从模版克隆创建

WEB 管理界面操作就可以啦, 这里添加一行硬盘挂载

```diff
arch: amd64
cmode: shell
cores: 4
features: fuse=1,mknod=1,mount=nfs;cifs,nesting=1
hostname: cloud
memory: 512
+mp0: /home/cloud,mp=/cloud
net0: name=eth0,bridge=vmbr0,gw=10.5.6.1,hwaddr=BC:24:11:23:DB:42,ip=10.5.6.11/24,type=veth
onboot: 1
ostype: alpine
rootfs: local-lvm:vm-112-disk-0,size=2G
swap: 512
lxc.apparmor.profile: unconfined
lxc.cap.drop:
lxc.cgroup.devices.allow: a
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
lxc.cgroup2.devices.allow: c 226:0 rwm
lxc.cgroup2.devices.allow: c 226:128 rwm
```


## 迅雷下载

来源: [cnk3x/xunlei](https://github.com/cnk3x/xunlei)

alpine 运行这个有 glibc 的问题, 下面是修复脚本

```bash
# 第一步: fix alpine glibc
# https://github.com/sgerrand/alpine-pkg-glibc/issues/210#issuecomment-1841801227
echo 'https://storage.sev.monster/alpine/edge/testing' | tee -a /etc/apk/repositories
wget https://storage.sev.monster/alpine/edge/testing/x86_64/sevmonster-keys-1-r0.apk
mv ./sevmonster-keys-1-r0.apk ./glibc.apk # 2.39 在 2024年08月06日13:22:55

apk add --allow-untrusted ./glibc.apk
apk add gcompat 
rm -rf /lib/ld-linux-x86-64.so.2 
apk add --force-overwrite glibc 
apk add glibc-bin
rm -rf ./glibc.apk

# 第二步: fix libstdc++ (迅雷需要)
# https://stackoverflow.com/questions/11471722/libstdc-so-6-cannot-open-shared-object-file-no-such-file-or-directory
# https://github.com/kohlschutter/junixsocket/issues/33
apk add libstdc++

```

迅雷安装脚本, 注意版本号有更新需要替换

```bash

mkdir /opt/xunlei && cd /opt/xunlei

wget https://github.com/cnk3x/xunlei/releases/download/v3.20.1/xlp-amd64.tar.gz
tar -zxvf xlp-amd64.tar.gz && rm -rf ./xlp-amd64.tar.gz
chmod +x ./xlp
```

自启动脚本

/etc/init.d/xunlei

```sh
#!/sbin/openrc-run
supervisor=supervise-daemon
USER=root
GROUP=root
name="xunlei"
description="Xunlei Downlaod Server"
command=/opt/xunlei/xlp
command_args="--dir_download=/cloud/xunlei/download --dir_data=/cloud/xunlei/data"
name=$(basename $(readlink -f $command))
supervise_daemon_args="--stdout /var/log/${name}.log --stderr /var/log/${name}.err"

depend() {
	After=syslog.target
}
```

添加完文件之后

```bash
# 给一下可执行权限
chmod 755 /etc/init.d/xunlei
# 添加开机自启
rc-update add xunlei
# 立即启动
rc-service xunlei start
```

## alist

阿里云盘限速了, 聊胜于无吧

```sh
mkdir -p /opt/alist && cd /opt/alist
wget https://github.com/alist-org/alist/releases/download/v3.36.0/alist-linux-amd64.tar.gz
tar -zxvf ./alist-linux-amd64.tar.gz && rm -rf  ./alist-linux-amd64.tar.gz
chmod +x ./alist

# 设置管理员密码
./alist admin set NEW_PASSWORD

```

服务文件 `/etc/init.d/alist`

```sh
#!/sbin/openrc-run
supervisor=supervise-daemon
USER=root
GROUP=root
name="Alist service"
description="Alist: Pan Server"
command=/opt/alist/alist
command_args="--data /opt/alist/data server"
name=$(basename $(readlink -f $command))
supervise_daemon_args="--stdout /var/log/${name}.log --stderr /var/log/${name}.err"


depend() {
	After=syslog.target 
}
```

添加完文件之后

```bash
# 给一下可执行权限
chmod 755 /etc/init.d/alist
# 添加开机自启
rc-update add alist
# 立即启动
rc-service alist start
```

## 结语（暂时

其他应用添加方式类似, 举一反三