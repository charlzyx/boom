# 宿主机配置

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

  resync:
    image: linuxserver/resilio-sync:latest
    container_name: resync
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
    volumes:
      - /etc/dockerapp/resync:/config
      - /titan/cloud/resync/downloads:/downloads
      - /titan/cloud/resync/sync:/sync

    network_mode: host
    #ports:
    #  - 8888:8888
    #  - 55555:55555
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

## Samba 服务

安装与启动

```bash
apt install samba
systemctl enable smbd
systemctl start smbd
```

配置文件, 我这里是有 root 和 tv 两个用户

全局配置 `/etc/smb.conf`

```bash
#======================= Global Settings =======================
[global]
   include = /etc/samba/%U.smb.conf
   workgroup = WORKGROUP

   log file = /var/log/samba/log.%m
   max log size = 1000
   logging = file

   panic action = /usr/share/samba/panic-action %d

   server string = Titan

   security = user
   server role = standalone server

   obey pam restrictions = yes
   unix password sync = yes

   passwd program = /usr/bin/passwd %u
   passwd chat = *Enter\snew\s*\spassword:* %n\n *Retype\snew\s*\spassword:* %n\n *password\supdated\ssuccessfully* .
   pam password change = yes

   map to guest = bad user
   usershare allow guests = yes

```

root 用户配置 `root.smb.conf`

```bash
[root]
  path = /titan
  writeable = yes
  valid users = @root
  create mask = 0755
  directory mask = 0755
```

tv 用户配置 `tv.smb.conf`

```bash
[tv]
  path = /titan/space/media
  writeable = yes
  valid users = @tv
  create mask = 0755
  directory mask = 0755
```

## tailscale 内网穿透

安装与启动

```bash
curl -fsSL https://tailscale.com/install.sh | sh
# --accept-routes, --accept-routes=false
#   accept routes advertised by other Tailscale nodes
# --advertise-routes string
#   routes to advertise to other nodes (comma-separated, e.g. "10.0.0.0/8,192.168.0.0/24") or empty string to not advertise routes
# --netfilter-mode=off
#   关闭 tailscale 防火墙
# 注意: 首次启动需要登录
tailscale up --accept-routes=true  --advertise-routes=119.119.119.120/24  --netfilter-mode=off --reset
```
