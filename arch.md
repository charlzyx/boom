# 整体架构 ALL-IN-ONE

我的诉求是希望用小主机做一个 NAS + 软路由 ALL-BOOM-ONE

- 其中 NAS 通过 USB 外置硬盘来实现存储, 系统主要靠 docker 软件做服务
- 软路由的诉求相对简单, 只有一个出国留学

## 硬件

CPU: Intel Celeron J6412 (4) @ 2.600GHz

Arch: x86_64

物理双网口: enp1s0 enp2s0

USB3.2: 16TiB 外接硬盘

## 路由拓扑

局域网段使用了 `119.119.119.0/24`, 并提供了 `.home.com` -> 宿主机的 局域网 DNS 劫持

0. 物理结构: WWW:光猫:LAN -> WAN:PVE 软路由:LAN -> WIFI 硬路由:LAN

1. 光猫:

```sh
- LAN: 192.168.1.1/24 默认的
```

2. PVE: 宿主机 **119.119.119.120/24**

```sh
- 静态 ip: 119.119.119.120/24
- 网关: 119.119.119.119
- DNS: 223.5.5.5 公共 DNS 即可
- 虚拟网口: enp2s0 -> vmbr0, enp1s0 -> vmbr1
- DNS Server: 宿主机通过 dnsmasq 提供 dns 服务
```

3. iKuai: 虚拟机主路由 **119.119.119.119/24**

```sh
- WAN: eth1 | wan1 光猫 DHCP 下发 192.168.1.xxx
- LAN: eth0 | lan1 静态 ip: 119.119.119.119/24
- DHCP->网关: 119.119.119.123
- DHCP->DNS 223.5.5.5 公共 DNS 即可
- DNS: 223.5.5.5 公共 DNS 即可
```

4. Clash: LXC 留学用 **119.119.119.123/24**

```sh
- 静态 ip: 119.119.119.123/24
- 网关 119.119.119.119
```

## 说明

举个栗子:

```bash
手机访问 https://xx.xxx -> LAN: WIFI 硬路由 -> LAN:PVE 软路由 -> vmbr0:iKuai:网关 -> Clash:分流
```

然后分流会有三种情况

```sh
# 1. home.com 添加到 fake-ip-filter 被宿主机提供的 dns 域名劫持
xxx.home.com -> fake-ip-filter: true -> 119.119.119.120:53 (PVE DNS) -> 119.119.119.120
# 2. 国内流量
www.baidu.com ->  fake-ip-filter: false -> 119.119.119.120:53 (PVE DNS) -> 223.5.5.5 -> 真正的百度
# 3.1 出国留学
www.google.com -> fake-ip-filter: false -> 198.18.0.xxx (fake ip)
# 3.2 fakeip的请求
198.18.0.xxx -> LAN -> tpclash tun -> proxy -> 真正的谷歌
```

## 其他

为什么不使用 Clash 做 DNS 服务器?

1. 因为我使用了 tailscale 做内网穿透, 并安装到了 PVE 宿主机上, 如果想要 tailscale 子网内域名访问主机的话, 需要 PVE 宿主机提供 DNS 服务
   来拦截 xxx.home.com 的请求
2. Clash 是使用 LXC 容器安装, 无法安装 tailscale
