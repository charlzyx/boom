# 宿主机配置

## docker 应用们

自动脚本或者手动安装 https://docs.docker.com/engine/install/debian/

```sh
# 官网全自动安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## DNS 服务: dnsmaq

systemd-resolved

## Samba 服务

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
