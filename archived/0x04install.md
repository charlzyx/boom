---
title: 安装与配置
lastUpdated: true
---

# 安装与配置

## Proxmox VE 8.0 安装

参考下列文章

- PVE 官网 https://enterprise.proxmox.com
- U 盘（优盘）安装 Proxmox VE 图文教程 https://www.moewah.com/archives/2497.html
- Proxmox VE（PVE）安装保姆级图文教程 https://blog.viinas.com/247
- 榨干小主机，all in one 家庭软路由方案 篇一：PVE 虚拟化环境搭建与调试入门
  https://post.smzdm.com/p/a9gvp557/
- 玩 Docker 必备：Alpine Linux 常用命令及用法整理 https://www.moewah.com/archives/2198.html

## PVE 宿主机安装后的配置

### 1.更新 apt/proxmox 源

- Debian 软件仓库镜像使用帮助 https://mirrors.tuna.tsinghua.edu.cn/help/debian/
- Proxmox 软件仓库镜像使用帮助 https://mirrors.tuna.tsinghua.edu.cn/help/proxmox/

记得加上 LXC 模版镜像加速

> CT Templates 针对 /usr/share/perl5/PVE/APLInfo.pm 文件的修改，重启后生效。

```sh
cp /usr/share/perl5/PVE/APLInfo.pm /usr/share/perl5/PVE/APLInfo.pm_back
sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
# 之后更新一下
apt update
```

### 2. 开启 ssh

> 非必须， GUI 里面的终端也可以操作

编辑 `/etc/ssh/sshd_conf`

修改 `#PermitRootLogin prohibit-password` -> `PermitRootLogin yes`

### 3. 安装常用软件

> 必装 git, curl, unzip 其他看心情

```sh

# 基础软件
apt install git curl unzip zsh gpg

# 切换zsh
chsh -s $(which zsh)
# 安装 starship
curl -sS https://starship.rs/install.sh | sh
# eval "$(starship init zsh)"
echo 'eval "$(starship init zsh)"' >> ~/.zshrc
echo 'source ~/.bashrc' >> ~/.zshrc
# 安装 nvim 最新版
wget https://github.com/neovim/neovim/releases/download/stable/nvim-linux64.tar.gz
tar -xvzf nvim-linux64.tar.gz &&  mv nvim-linux64 nvim && mv nvim /usr/local/
ln -s /usr/local/nvim/bin/nvim /usr/local/bin/nvim
ln -s /usr/local/nvim/bin/nvim /usr/local/bin/vim
ln -s /usr/local/nvim/bin/nvim /usr/local/bin/vi

```

### 4. 配置时区

```sh
timedatectl set-timezone Asia/Shanghai
```

### 5. systemd 启动加速

```sh
# 网络在线检测： 我们是个路由器嘛... 等什么网络在线
systemctl disable systemd-networkd-wait-online.service
# 邮件服务： 谁还用邮件啊
systemctl disable postfix
```

### 5. 配置虚拟网卡 Linux Bridge

有几个网口就绑定几个, 都配置为 Linux Bridge

> 关于直通: 我用 iperf 测试 LinuxBridge 大概实在 2.5G 的样子, 实际网卡是 1G 千兆的, 所以至少瓶颈不在 Linux Bridge ,我家宽带才 200M, 就不在意直通的事情了

![vmbr](/archived/assets/vmbr.png){data-zoomable}

## LXC Alpine 基础容器模版安装与配置

:::danger LXC 容器创建注意事项

1. 注意 **无特权容器** 的勾选与否； 虽然可以通过 /etc/pve/lxc/[id].conf 来修改， 但是修改之后的可能会出现权限问题；
2. 磁盘容能只能增加不能减小，所以尽量给比较小的值
3. CPU 和内存后续可以随便调整, 内存其实是动态的, 所以无所谓大小

:::
![alpinect](/archived/assets/alpinect.png){data-zoomable}

后续用到容器会都是基于 Alpine 制作的, 为此我们可以先制作一个 CT 模版, 添加一些基础配置, 方便后续直接复制使用.
可以先看一下这篇文件做一个简单的了解 [Alpine Linux 常用命令及用法](https://www.moewah.com/archives/2198.html)

> Alpine 操作系统是一个面向安全的轻型 Linux 发行版。它不同于通常 Linux 发行版，Alpine 采用了 musl libc 和 busy­box 以减小系统的体积和运行时资源消耗，但功能上比 busy­box 又完善的多，因此得到开源社区越来越多的青睐。在保持瘦身的同时，Alpine 还提供了自己的包管理工具 apk，可以通过 https://pkgs.alpinelinux.org/packages 网站上查询包信息，也可以直接通过 apk 命令直接查询和安装各种软件。

> Alpine 由非商业组织维护的，支持广泛场景的 Linux 发行版，它特别为资深 / 重度 Linux 用户而优化，关注安全，性能和资源效能。Alpine 镜像可以适用于更多常用场景，并且是一个优秀的可以适用于生产的基础系统 / 环境。

### 安装 Alpine Linux 基础依赖

参考下面命令调整好基础镜像

```sh

# 更新国内源加速
sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
apk update
# 安装常用软件
apk add neovim zsh util-linux shadow git curl
# 使用 neovim 替换 vi/vim/nvim 命令
cd /usr/bin
rm vi
ln -s nvim vim
ln -s nvim vi
# 安装 oh-my-zsh
sh -c "$(wget https://ghproxy.com/https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"

# 安装之后会有提示 zsh 作为默认 shell, 不小心错过了可以手动执行
# chsh -s /bin/zsh
# 重启生效
reboot

```

把当前 CT 转换成模版

![totpl](/archived/assets/totpl.png){data-zoomable}

使用模版创建 CT 容器

![toct](/archived/assets/toct.png){data-zoomable}

最终模版配置如下 `/etc/pve/lxc/100.conf`

```sh
arch: amd64
cmode: shell
cores: 4
hostname: alpine
memory: 1024
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=06:3D:28:31:9B:2E,ip=192.168.6.100/24,ip6=auto,type=veth
ostype: alpine
rootfs: local-lvm:base-100-disk-0,size=4G
swap: 0
template: 1
```

## 小结

下一步开始, 我们将依次进行 `6.1 iKuai` -> `6.2 clash` 路由核心的安装与配置
