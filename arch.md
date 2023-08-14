# 整体架构 ALL-IN-ONE

我的诉求相对简单用一个双网口 X86 做一个 NAS × 软路由; ALL BOOM! ONE

- 其中 NAS 通过 USB 外置硬盘来实现存储, 系统主要靠 docker 软件做服务
- 软路由的诉求相对简单, 只有一个出国留学, 但要求自然丝滑~~

## 硬件

CPU: Intel Celeron J6412 (4) @ 2.600GHz

Arch: x86_64

物理双网口: enp1s0 enp2s0

USB3.2: 16TiB 外接硬盘

## 路由拓扑

局域网段使用了 `192.168.6.0/24`

0. 物理结构: WWW:光猫:LAN -> WAN:PVE 软路由:LAN -> WIFI 硬路由:LAN

1. 光猫:

```sh
- LAN: 192.168.1.1/24 默认的
```

2. PVE: 宿主机 **192.168.6.6/24**

```sh
# LAN
- 静态 ip: 192.168.6.6/24
- 网关: 192.168.6.1
- DNS: 223.5.5.5 公共 DNS 即可
- 虚拟网口: enp2s0 -> vmbr0, enp1s0 -> vmbr1
```

3. iKuai: 虚拟机主路由 **192.168.6.2/24**

```sh
# LAN: vmbr0, vmbr1 两个都要, 一个 LAN  一个 WAN
- LAN: eth0 | lan1 静态 ip: 192.168.6.2/24
- DHCP->网关: 192.168.6.1
- DHCP->DNS 192.168.6.1,223.5.5.5
- DNS: 192.168.6.1,223.5.5.5
```

4. LuxDNS: DNS + 出海海淘 LXC 容器 **192.168.6.1/24**

```sh
# LAN: vmbr0 或 vmbr1 随意, 有一个就行
- 静态 ip: 192.168.6.1/24
- 网关 192.168.6.2
```

## DNS 流向

```sh
局域网设备
  -> WIFI 硬路由
  -> iKuai (192.168.6.2)
  -> LuxDNS(192.168.6.1)
     -> 53: AdGuradHome (劫持 *.home.com -> 192.168.6.6)
        -> 3053: mosdns
           -> (if cn) 公共DNS
           -> (not cn) 1053 clash
```

## 流量走向

```sh
局域网设置
  -> WIFI 硬路由
  -> iKuai (192.168.6.2)
  -> LuxDNS(192.168.6.1)
     -> TUN 劫持透明代理(科学部分)
  -> iKuai (192.168.6.2)
  -> 光猫

```

## 参考文档

- [基于 DNS 的内网透明代理分流方案](https://songchenwen.com/tproxy-split-by-dns) 图就是从这个大佬这里接的
