# 0x03 LXC 容器


## 模版准备

先准备一个比较全能的模版, 基础镜像使用 alpine-3.19 在 CT模版 -> 模版 菜单中可以找到


## 安装基础依赖

::: danger 创建CT: 119
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
sh -c "$(wget https://ghproxy.com/https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"

# 安装之后会有提示 zsh 作为默认 shell, 不小心错过了可以手动执行
# chsh -s /bin/zsh
# 重启生效
reboot
```

之后关闭虚拟机, 在宿主机里面继续操作

`cd /etc/pve/lxc` 编辑 119.conf, 添加这些内容

```bash
+ features: fuse=1,mknod=1,mount=nfs;cifs,nesting=1
# 移除容器安全配置
+lxc.apparmor.profile: unconfined
+lxc.cap.drop:
+lxc.cgroup.devices.allow: a
# 开放 tun 给容器 10:200 来自 ls -l /dev/net
+lxc.cgroup2.devices.allow: c 10:200 rwm
+lxc.mount.entry: /dev/net dev/net none bind,create=dir
# 开放显卡给容器 226:0 和 226:128 来自 ls -l /dev/dri
+lxc.cgroup2.devices.allow: c 226:0 rwm
+lxc.cgroup2.devices.allow: c 226:128 rwm
```

之后就可以把119转换为模版了


## 小结
这是一个权限很高的容器模版, 后续我们就可以基于这个模版去配置一系列功能了

