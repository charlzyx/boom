---
title: .5 LXC Docker 鸡
lastUpdated: true
---

# Docker 鸡 `192.168.6.5`

| 服务      | 端口          |
| --------- | ------------- |
| home-page | :3000         |
| portainer | https://:9000 |
| prowlarr  | :9696         |

跑个 docker 套娃

## /etc/pve/lxc/205.conf

```sh
arch: amd64
cmode: shell
cores: 2
features: nesting=1
hostname: docker
memory: 2048
# mp0, mp1 挂载盘不是必须的， 我是在 home-page 中展示磁盘空间需要
mp0: /titan/space,mp=/titan/space
mp1: /titan/cloud,mp=/titan/cloud
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=16:7D:17:7F:B1:CE,ip=192.168.6.5/24,type=veth
ostype: debian
rootfs: local-lvm:vm-205-disk-0,size=20G
swap: 0
unprivileged: 0
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
  homepage:
    image: charlzgg/home-page:latest
    container_name: homepage
    environment:
      - TZ=Asia/Shanghai
      - NEXT_PUBLIC_HOME_HEADER_TITLE=HOME
      - NEXT_PUBLIC_HOME_TITLE=六六の家
    volumes:
      - /etc/home-page/services.json:/app/services.json
      - /titan/cloud:/titan/cloud
      - /titan/space:/titan/space
    ports:
      - 3000:3000
    restart: unless-stopped

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
