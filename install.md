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

## Debain / PVE 宿主机安装后的配置

这块配置对于 宿主机和 Debain LXC 容器都是有效的, 宿主机 ONLY 的已经显示标明

### 1.更新 apt 源

- Debian 软件仓库镜像使用帮助 https://mirrors.tuna.tsinghua.edu.cn/help/debian/

:::tip &lt; 宿主机 ONLY &gt;

Proxmox 软件仓库镜像使用帮助 https://mirrors.tuna.tsinghua.edu.cn/help/proxmox/

记得加上 LXC 模版镜像加速

> CT Templates 针对 /usr/share/perl5/PVE/APLInfo.pm 文件的修改，重启后生效。

```sh
cp /usr/share/perl5/PVE/APLInfo.pm /usr/share/perl5/PVE/APLInfo.pm_back
sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
# 之后更新一下
apt update
```

:::

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
# 安装 nvim
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

![vmbr](/assets/vmbr.png)
