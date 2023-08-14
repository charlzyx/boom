# 宿主机配置

就是个常规的 Debain 12 啦

## docker

安装

> 手动安装 https://docs.docker.com/engine/install/debian/

```sh
# 官网全自动安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

```

我的应用, 看 yaml 自取

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

  jellyfin:
    image: nyanmisaka/jellyfin
    container_name: jellyfin
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
    devices:
      - /dev/dri/card0:/dev/dri/card0
      - /dev/dri/renderD128:/dev/dri/renderD128
    ports:
      - 8096:8096
    volumes:
      - /etc/dockerapp/jellyfin/config:/config
      - /etc/dockerapp/jellyfin/cache:/cache
      - /titan/space/media:/media
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

  nginx:
    image: nginx
    container_name: nginx
    volumes:
      - /etc/nginx:/etc/nginx
    network_mode: host
    restart: unless-stopped

  xunlei:
    image: cnk3x/xunlei:latest
    container_name: xunlei
    hostname: pve
    privileged: true
    network_mode:
      host
      # host网络，默认端口 2345
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
      - XL_WEB_PORT=2345
    volumes:
      - /etc/dockerapp/xunlei:/xunlei/data
      - /titan/space/downloads:/xunlei/downloads
    restart: unless-stopped
```

## tailscale 内网穿透

安装与启动

```bash
curl -fsSL https://tailscale.com/install.sh | sh
# 注意: 首次启动需要登录
tailscale up --accept-dns=false --accept-routes=true  --advertise-routes=192.168.6.0/24  --netfilter-mode=off --reset
```

## [ftp](/vsftp)

## [smb](/smb)
