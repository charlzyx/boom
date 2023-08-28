---
title: .5 LXC Docker 鸡
lastUpdated: true
---

# Docker 鸡 `192.168.6.5`

| 服务      | 端口          |
| --------- | ------------- |
| home-page | :3000         |
| portainer | https://:9000 |
| prowlarr  | 9696          |

这里主要跑个 docker 套娃用

## ## /etc/pve/lxc/205.conf

```sh
arch: amd64
cmode: shell
cores: 4
features: nesting=1
hostname: tv
memory: 2048
mp0: /titan/space/media,mp=/media
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=9A:69:C4:D4:12:0B,ip=192.168.6.5/24,type=veth
ostype: debian
rootfs: local-lvm:vm-204-disk-0,size=4G
swap: 0
unprivileged: 1
```

## 安装脚本

> 手动安装 https://docs.docker.com/engine/install/debian/

```sh
# 官网全自动安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

```

## docker-compose

```yaml
version: "3.1"

services:
  portainer:
    image: portainer/portainer:latest
    container_name: portainer
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - /etc/dockerapp/portainer/data:/data
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - 8000:8000
      - 9443:9443
    restart: unless-stopped

  prowlarr:
    image: linuxserver/prowlarr:latest
    container_name: prowlarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
    volumes:
      - /etc/dockerapp/prowlarr:/config
    ports:
      - 9696:9696
    restart: unless-stopped
```

## home-page

这是我 fork 大佬改自用的
[charlzyx/home-page](https://github.com/charlzyx/home-page)
