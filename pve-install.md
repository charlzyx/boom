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

```sh
# /scripts/pve/sources.list
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware

deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware

deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware

deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware
```

自动脚本

```sh
# 备份
cp /etc/apt/sources.list /etc/apt/sources.list.bak
# 写入
cat /scripts/pve/sources.list > /etc/apt/sources.list
# pve 软件源
touch /etc/apt/sources.list.d/pve-no-subscription.list
echo "deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve bullseye pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list
# CT Templates 针对 /usr/share/perl5/PVE/APLInfo.pm 文件的修改，重启后生效。
cp /usr/share/perl5/PVE/APLInfo.pm /usr/share/perl5/PVE/APLInfo.pm_back
sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
# 之后更新一下
apt update

```

### 安装基础软件

```sh
apt install git curl vim unzip
```

### 配置时区

```sh
timedatectl set-timezone Asia/Shanghai
```
