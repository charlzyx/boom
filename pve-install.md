# Proxmox VE

## 安装 PVE8.0

参考下列文章

- PVE 官网 https://enterprise.proxmox.com
- U 盘（优盘）安装 Proxmox VE 图文教程 https://www.moewah.com/archives/2497.html
- Proxmox VE（PVE）安装保姆级图文教程 https://blog.viinas.com/247

## 基础环境配置

因为 PVE8.0 底层是使用的 Debain 12 , 所以有一些基本配置做一下记录

### 更新 apt / pve 源

- Debian 软件仓库镜像使用帮助 https://mirrors.tuna.tsinghua.edu.cn/help/debian/
- Proxmox 软件仓库镜像使用帮助 https://mirrors.tuna.tsinghua.edu.cn/help/proxmox/

#### 1. PVE Host: Debain 12

```sh
cp /etc/apt/sources.list /etc/apt/sources.list.bak
# Debain
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware" >> /etc/apt/sources.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list
# pve 软件源
touch /etc/apt/sources.list.d/pve-no-subscription.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list
# CT Templates 针对 /usr/share/perl5/PVE/APLInfo.pm 文件的修改，重启后生效。
cp /usr/share/perl5/PVE/APLInfo.pm /usr/share/perl5/PVE/APLInfo.pm_back
sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
# 之后更新一下
apt update

```

#### 2. LXC: Debain 11

```sh
cp /etc/apt/sources.list /etc/apt/sources.list.bak
# Debain
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye main contrib non-free non-free-firmware" >> /etc/apt/sources.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bullseye-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list
apt update
```

### 配置时区

```sh
timedatectl set-timezone Asia/Shanghai
```

### 开启 ssh

编辑 `/etc/ssh/sshd_conf`

修改 `#PermitRootLogin prohibit-password` -> `PermitRootLogin yes`

### 安装基础软件

> 除了 git, curl, unzip 其他看心情

```sh

# 基础软件
apt install git curl unzip zsh

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

## 我的配置参考

https://github.com/charlzyx/pve.conf
