# 0x03 Alpine in LXC 容器


## 模版准备

先准备一个比较全能的模版, 基础镜像使用 alpine-3.19 在 CT模版 -> 模版 菜单中可以找到


## 创建容器

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


## 提权配置, 需要哪个配哪个

> 不要配置到模版中去，先克隆，再进行配置

```bash
# 移除容器安全配置 docker 需要
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


## 小结

后续我们就可以基于这个模版去配置一系列功能了

