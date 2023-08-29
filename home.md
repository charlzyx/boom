---
title: .6 宿主机
lastUpdated: true
---

# 宿主机 `192.168.6.6`

| 服务  | 端口 |
| ----- | ---- |
| nginx | :80  |

宿主机主要承载了 nginx 导航和 tailscale 两个服务, 以及重要的外挂硬盘的自动挂载与对应 LXC 的启停管理

外挂硬盘

```sh
/titan/space
/titan/cloud
```

## 磁盘的自动挂载

开机检测挂载与容器自动启动

```sh
# cat  /etc/systemd/system/titan-mount.service
[Unit]
Description=Mount and Start Titan USB HDD
After=network.target lxc-net.service remote-fs.target
Wants=lxc.service

[Service]
Type=oneshot
ExecStart=/root/titan/start.sh

[Install]
WantedBy=multi-user.target
```

监听卸载于容器自动停止

```sh
# cat /etc/udev/rules.d/99-titan-mount-start.rules
ACTION=="remove", RUN+="/root/titan/stop.sh"
```

::: details `/root/titan/mount.sh` 外接磁盘自动挂载脚本

```bash
#!/bin/bash
set -ex

MOUNT_BASE="/titan"
MOUNTED=false  # 用于记录是否发生挂载行为


# 获取所有块设备的信息
DEVICE_LIST=$(blkid -o device)

# 遍历每个设备，检查 PARTLABEL
for DEVICE in $DEVICE_LIST; do
  PARTLABEL=$(blkid -o value -s PARTLABEL $DEVICE)

  if [ "$PARTLABEL" == "cloud" ] || [ "$PARTLABEL" == "space" ]; then
    MOUNT_PATH="$MOUNT_BASE/$PARTLABEL"

    # 检查目标挂载路径是否存在，如果不存在则创建
    if [ ! -d "$MOUNT_PATH" ]; then
      mkdir -p "$MOUNT_PATH"
    fi


    if grep -qs "$MOUNT_POINT" /proc/mounts; then
      echo "The mount point $MOUNT_POINT is already mounted."
    else
      # 挂载设备到目标路径
      UUID=$(blkid -o value -s UUID $DEVICE)
      mount -U $UUID $MOUNT_PATH
      echo "mount $MOUNT_POINT successful!"
      MOUNTED=true

    fi
  fi
done


# 根据是否发生挂载行为来决定是否执行 start 脚本
if $MOUNTED; then
  /root/titan/start.sh
fi
```

:::

::: details `/root/titan/start.sh` 检测硬盘挂载并自动启动脚本

```sh
#!/bin/bash

set -ex
# tv 204 / cloud 203 / bt  208

start_cts() {
  # 检查容器是否运行，如果运行则关闭
  for CT_ID in 203 204 205 208; do
    if pct status $CT_ID | grep -q "running"; then
      pct reboot $CT_ID
      echo "Container $CT_ID restarted."
    else
      pct start $CT_ID
      echo "Container $CT_ID started."
    fi
  done
}

MOUNT_BASE="/titan"
SPACE_DIR="$MOUNT_BASE/space"
CLOUD_DIR="$MOUNT_BASE/cloud"

# 检查 /titan/space 和 /titan/cloud 是否已经挂载
if grep -qs "$SPACE_DIR" /proc/mounts && grep -qs "$CLOUD_DIR" /proc/mounts; then
    echo "Both $SPACE_DIR and $CLOUD_DIR are already mounted."
    start_cts
else
    echo "One or both directories are not mounted."
fi
```

:::

::: details `/root/titan/start.sh` 检测硬盘卸载并自动关闭虚拟机

```sh
#!/bin/bash


set -ex
# tv 204 / cloud 203 / bt  208

stop_cts() {
  # 检查容器是否运行，如果运行则关闭
  for CT_ID in 203 204 208; do
    if pct status $CT_ID | grep -q "running"; then
      pct stop $CT_ID
      echo "Container $CT_ID stopped."
    else
      echo "Container $CT_ID not runing, do nothing."
    fi
  done
}

MOUNT_BASE="/titan"
SPACE_DIR="$MOUNT_BASE/space"
CLOUD_DIR="$MOUNT_BASE/cloud"

# 检查 /titan/space 和 /titan/cloud 是否已经挂载
if grep -qs "$SPACE_DIR" /proc/mounts && grep -qs "$CLOUD_DIR" /proc/mounts; then
    echo "Both $SPACE_DIR and $CLOUD_DIR are already mounted. do nothings."
else
    echo "One or both directories are not mounted."
    stop_cts
fi
```

:::

## 文件权限

PVE LXC 非特权容器的访问权限有一个为了安全的 idmap 机制， 想了解的话可以看看这里

[Unprivileged LXC containers](https://pve.proxmox.com/wiki/Unprivileged_LXC_containers)
[Proxmox LXC 挂载目录及权限设置](https://www.haiyun.me/archives/1419.html)

我嫌麻烦就全部 777 了， 狗掉了这个问题

`chmod -R 777 /titan`

## 割割割割割割割割割割割割割割割割割割割割

从这里往下都是看心情非必需了

## tailscale

提供了公网访问家里内网的 VPN 服务, 配合 AdGuardHome + nginx 反向代理， 纵向丝滑~

### [安装](https://tailscale.com/download/linux)

```sh
curl -fsSL https://tailscale.com/install.sh | sh
```

### 启动（默认就是开机自启）

- accept-dns=false 不接受 DNS 覆盖
- accept-routes=true 接受路由
- advertise-routes=192.168.6.0/24 导出当前子路由
- netfilter-mode=off 不需要防火墙
- reset 完全重置

```sh
tailscale up --accept-dns=false --accept-routes=true  --advertise-routes=192.168.6.0/24 --reset --netfilter-mode=off
```

### [tailscale 控制台](https://login.tailscale.com/admin) 配置子路由导出

这个配置可以在其他客户端开启 tailscale 情况下， 通过 `192.168.6.6` 这样像局域网的 IP 来访问 pve,
非必需

![导出子路由1](/assets/home/sroute1.png)
![导出子路由2](/assets/home/sroute2.png)
![DNS](/assets/home/dns.png)

## AdGuardHome

[安装参考](/clash)

宿主机中的 AdGuardHome 唯一作用就是使用 DNS 劫持 `*.home.com` （也就是在上方 tailscale 劫持的域名）配合 nginx
将我们的服务映射到域名上， 来方便使用

![adns](/assets/home/adns.png)

## nginx

安装

```sh
apt install nginx
# 设置开机自启
systemctl enable nginx
systemctl start nginx
```

配置按需自取

:::details /etc/nginx/nginx.conf

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
include /etc/nginx/modules-enabled/*.conf;
events {
	worker_connections 768;
}
http {
	sendfile on;
	tcp_nopush on;
	types_hash_max_size 2048;
	include /etc/nginx/mime.types;
	default_type application/octet-stream;
  proxy_redirect off;
  client_max_body_size 5g;
  client_body_buffer_size 128k;
  proxy_connect_timeout 90;
  proxy_send_timeout 90;
  proxy_read_timeout 90;
  proxy_buffer_size 32k;
  proxy_buffers 4 32k;
  proxy_busy_buffers_size 64k;
  proxy_temp_file_write_size 64k;
  proxy_ignore_client_abort on;
  proxy_next_upstream error timeout invalid_header http_500 http_503 http_404;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Host $server_name;
	ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
	ssl_prefer_server_ciphers on;
  gzip on;
	include /etc/nginx/conf.d/*.conf;
}

```

:::

:::details /etc/nginx/conf.d/main.conf

```nginx
# PVE 管理后台 GUI
server {
  listen 443 ssl;
  server_name pve.home.com;
  ssl_certificate     /etc/nginx/ssl/srv.crt;
  ssl_certificate_key  /etc/nginx/ssl/srv.key;
  location / {
    proxy_pass https://192.168.6.6:8006;
    proxy_buffering off;
    proxy_buffer_size 4k;
    client_max_body_size 5g;
    proxy_connect_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    send_timeout 300s;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Host $server_name;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Ssl on;
  }
}

# home-page 导航
server {
	listen 80 default_server;
	listen [::]:80 default_server;
  location / {
    proxy_pass http://192.168.6.5:3000;
  }
  # clash 配置文件夹， 非必需
  location /clash {
    alias /etc/nginx/clash/;
    autoindex on;
  }
}

# ikuai 管理后台
server {
  listen 80;
  server_name ikuai.home.com;
  location / {
    proxy_pass http://192.168.6.1;
  }
}

# clash yacd 面板
server {
  listen 80;
  server_name yacd.home.com;
  location / {
    proxy_pass http://192.168.6.2:9999;
  }
}

# clash AdGuardHome 面板
server {
  listen 80;
  server_name adg.home.com;
  location / {
    proxy_pass http://192.168.6.2:5233;
  }
}
```

:::

:::details /etc/nginx/conf.d/cloud.conf

```nginx
# cloud at 192.168.6.3

server {
  listen 80;
  server_name sftpgo.home.com;

  location / {
    proxy_pass http://192.168.6.3:8081;
  }
}

server {
  listen 80;
  server_name dav.home.com;

  location / {
    proxy_pass http://192.168.6.3:8080;
  }
}

server {
  listen 80;
  server_name ftp.home.com;

  location / {
    proxy_pass http://192.168.6.3:21;
  }
}

server {
  listen 80;
  server_name alist.home.com;

  location / {
    proxy_pass http://192.168.6.3:5244;
  }
}
```

:::

:::details /etc/nginx/conf.d/tv.conf

```nginx
# tv at 192.168.6.4

server {
  listen 80;
  server_name tv.home.com;
  location / {
    proxy_pass http://192.168.6.4:8096;
  }
}
```

:::

:::details /etc/nginx/conf.d/docker.conf

```nginx
# docker at 192.168.6.5
server {
  listen 80;
  server_name sp.home.com;
  location / {
    proxy_pass http://192.168.6.5:12345;
  }
}

server {
  listen 80;
  server_name go.home.com;
  location / {
    proxy_pass http://192.168.6.5:3000;
  }
}

server {
  listen 80;
  server_name pl.home.com;
  location / {
    proxy_pass http://192.168.6.5:9696;
  }
}

server {
  listen 80;
  server_name docker.home.com;
  location / {
    proxy_pass https://192.168.6.5:9443;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

:::

:::details /etc/nginx/conf.d/bt.conf

```nginx
# bt at 192.168.6.208

server {
  listen 80;
  server_name xl.home.com;
  location / {
    proxy_pass http://192.168.6.208:2345;
  }
}

server {
  listen 80;
  server_name qbit.home.com;
  location / {
    proxy_pass http://192.168.6.208:8080;
  }
}
```

:::

### https 自签名证书

pve 管理后台反向代理只能 https ， 如果不需要的话不用搞

```sh
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl
# 非对称加密 rsa 算法生成2048 比特位的私钥
openssl genrsa -out srv.key 2048
# 指定私钥 srv.key 生成新的 srv.csr 文件, 随便填写就行
openssl req -new -key srv.key -out srv.csr
```

### 重启 nginx

```sh
nginx -s reload
```
