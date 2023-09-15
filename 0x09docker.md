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

:::danger LXC Docker 容器创建注意事项
必须是 **无特权容器**!! ,因此不能使用我们之前创建好的模版, 需要重新基于 Alpine 模版重新创建, 主要有一下两个功能需要开启

- 勾选 **无特权容器**
- 功能添加 **嵌套**

:::

## /etc/pve/lxc/105.conf

```sh
arch: amd64
cmode: shell
cores: 4
features: keyctl=1,nesting=1
hostname: docker
memory: 2048
mp0: /titan/space,mp=/titan/space
mp1: /titan/cloud,mp=/titan/cloud
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=BE:86:80:E0:A5:A2,ip=192.168.6.5/24,type=veth
ostype: alpine
rootfs: local-lvm:vm-105-disk-0,size=20G
swap: 0
unprivileged: 1
```

## 安装与自启动配置

```sh
apk add docker docker-compose

# 添加开机启动
rc-update add docker

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
      - NEXT_PUBLIC_HOME_HEADER_TITLE="Chao's"
      - NEXT_PUBLIC_HOME_TITLE=BoomLab
    volumes:
      - ./services.json:/app/services.json
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
