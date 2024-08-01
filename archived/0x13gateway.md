---
title: .216 网关机
lastUpdated: true
---

# 网关机 `192.168.6.216`

| 服务        | 端口          |
| ----------- | ------------- |
| nginx       | :80,:12345... |
| tailscale   | :random       |
| ddns-go     | :9876         |
| AdGuardHome | :53           |

## /etc/pve/lxc/216.conf

```sh
arch: amd64
cmode: shell
cores: 4
hostname: gateway
memory: 1024
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=CA:1F:2E:FC:7A:99,ip=192.168.6.216/24,ip6=auto,type=veth
onboot: 1
ostype: alpine
rootfs: local-lvm:vm-216-disk-0,size=4G
swap: 0
lxc.cgroup.devices.allow: c 10:200 rwm
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

## ddns-go

由于我将光猫改为了桥接开启了公网 IPv6, 所以使用 ddns-go 将自动配置域名解析

```sh
mkdir -p /opt/ddns-go/ && cd /opt/ddns-go
wget https://github.com/jeessy2/ddns-go/releases/download/v5.6.2/ddns-go_5.6.2_linux_x86_64.tar.gz
tar -zxvf ./ddns-go_5.6.2_linux_x86_64.tar.gz
./ddns-go install
```

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

![导出子路由1](/archived/assets/gateway/sroute1.png)
![导出子路由2](/archived/assets/gateway/sroute2.png)
![DNS](/archived/assets/gateway/dns.png)

## AdGuardHome

[安装参考](/archived/0x06clash)

宿主机中的 AdGuardHome 唯一作用就是使用 DNS 劫持 `*.home.com` （也就是在上方 tailscale 劫持的域名）配合 nginx
将我们的服务映射到域名上， 来方便使用

![adns](/archived/assets/gateway/adns.png)

## nginx

安装

```sh
apk add nginx openssl
# 设置开机自启
rc-update add nginx
```

配置按需自取

:::details /etc/nginx/ipv6.conf

```nginx
# This is a default site configuration which will simply return 404, preventing
# chance access to any other virtualhost.

server {
  listen 23456;
  listen [::]:23456;
  server_name chaocloud.top;
  location / {
    proxy_pass http://192.168.6.234:23456;
  }
}

server {
  listen 28080;
  listen [::]:28080;
  server_name chaocloud.top;

  location / {
    proxy_set_header Host $http_host;
    proxy_pass http://192.168.6.234:8080;
  }
}

server {
  listen 20080;
  listen [::]:20080;
  server_name chaocloud.top;

  location / {
    proxy_pass http://192.168.6.1;
  }
}

server {
  listen 12345;
  listen [::]:12345;
  server_name chaocloud.top;

  location / {
    proxy_pass http://192.168.6.5:3000;
  }
}

server {
  listen 25244;
  listen [::]:25244;
  server_name chaocloud.top;

  location / {
    proxy_pass http://192.168.6.3:5244;
  }
}


```

:::

:::details /etc/nginx/http.d/pve.conf

```nginx
# PVE 管理后台 GUI
server {
  # https://bbs.xmbillion.com/thread-47.htm
  listen 443 ssl;

  server_name pve.home.com;
  # ssl证书地址, 生成见下方
  ssl_certificate /etc/nginx/ssl/srv.crt;
  ssl_certificate_key /etc/nginx/ssl/srv.key;
  location / {
    proxy_pass https://192.168.6.6:8006;
    proxy_redirect off;
    client_max_body_size 5g;
    send_timeout 300s;
    client_body_buffer_size 128k;
    proxy_connect_timeout 90s;
    proxy_send_timeout 90s;
    proxy_read_timeout 90s;
    proxy_buffering off;
    proxy_buffer_size 32k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
    proxy_temp_file_write_size 64k;
    proxy_ignore_client_abort on;
    proxy_next_upstream error timeout invalid_header http_500 http_503 http_404;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Host $server_name;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Ssl on;
  }
}

```

:::

:::details /etc/nginx/http.d/host.conf

```nginx
# bt at 192.168.6.208

server {
  listen 80;
  server_name xl.home.com;
  location / {
    proxy_pass http://192.168.6.234:23456;
  }
}

server {
  listen 80;
  server_name qbit.home.com;
  location / {
    proxy_set_header Host $http_host;
    proxy_pass http://192.168.6.234:8080;
  }
}


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
# docker at 192.168.6.5

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


server {
  listen 80;
  server_name ql.home.com;
  location / {
    proxy_pass http://192.168.6.5:5700;
  }
}
server {
  listen 80;
  server_name ikuai.home.com;
  location / {
    proxy_pass http://192.168.6.1;
  }
}

server {
  listen 80;
  server_name yacd.home.com;
  location / {
    proxy_pass http://192.168.6.2:9999;
  }
}

server {
  listen 80;
  server_name adg.home.com;
  location / {
    proxy_pass http://192.168.6.2:3000;
  }
}

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

### https 自签名证书

> pve 管理后台反向代理想用 https 的话， 如果不需要的话不用搞

```sh
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl
# 非对称加密 rsa 算法生成2048 比特位的私钥
openssl genrsa -out srv.key 2048
# 指定私钥 srv.key 生成新的 srv.csr 文件, 随便填写就行
openssl req -new -key srv.key -out srv.csr
# 生成 crt 文件
openssl x509 -req -in srv.csr -out srv.crt -signkey srv.key -days 3650
```

### 重启 nginx

```sh
nginx -s reload
```
