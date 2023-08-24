# 整体架构 ALL-IN-ONE

## 硬件配置:

```bash
CPU: Intel Celeron J6412 (4) @ 2.600GHz
Arch: x86_64
物理双网口: enp1s0 enp2s0
USB3.2: 16TiB 外接硬盘
```

## 需求整理

- NAS 诉求: 局域网网盘 + 电视机
- 软路由诉求: 出海海淘淘淘气

技术选型使用 Proxmox VE 虚拟机

架构如下

- PVE 宿主机
  - docker
  - LXC (界面上叫 CT)

其中涉及到的应用大概如下

- 网盘
  - alist & webdav # 宿主机安装
  - ftp/smb # 宿主机安装配置
- 电视机
  - jellyfin # docker
- 下载
  - xunlei # docker 特权模式+host 网络
  - tailscale # 宿主机安装 随时随地打开 home.com
- 管理
  - pve 管理 web 页面 #宿主机自带
  - portiner # docker docker 管理 web 页面
  - clash#yacd # LXC 海淘

整体看来偏向 NAS 需求, 软路由需求主要是一个丝滑的海淘

至于应用是装在宿主机/LXC/docker 的选择主要看

1. 是否对网速/硬盘有比较高的要求 ftp/smb/alist
2. 配置的复杂度 复杂 -> docker / lxc , 否则宿主机 jellyfin/xunlei

大概这种简单的逻辑

## 路由拓扑

局域网段使用了 `192.168.6.0/24`

物理结构:

```bash
 WWW:光猫:LAN -> WAN:PVE 软路由:LAN -> WIFI 硬路由:LAN
```

实际 DNS/流量转发主力在 LuxDNS 服务器配置, 在后续[LuxDNS](/luxdns) 展开, 先看下设计思路

### DNS 流向

```sh
局域网设备
  -> WIFI 硬路由
  -> iKuai (192.168.6.2)
  -> LuxDNS(192.168.6.1)
     -> 53: AdGuradHome (劫持 *.home.com -> 192.168.6.6)
        -> 3053: mosdns
           -> (if cn) 公共DNS
           -> (not cn) 1053 clash fake-ip dns
```

### 流量走向

```sh
局域网设置
  -> WIFI 硬路由
  -> iKuai (192.168.6.2)
  -> LuxDNS(192.168.6.1)
     -> TUN 劫持透明代理(科学部分)
  -> iKuai (192.168.6.2)
  -> 光猫

```

## 具体配置

1. 光猫:

```sh
- LAN: 192.168.1.1/24 默认的
```

2. PVE: 宿主机 **192.168.6.6/24**

```sh
# LAN
- 静态 ip: 192.168.6.6/24
- 网关: 192.168.6.1
- DNS: 192.168.6.1
- 虚拟网桥: enp2s0 -> vmbr0, enp1s0 -> vmbr1
```

3. iKuai: 虚拟机主路由 **192.168.6.2/24**

```sh
# LAN: vmbr0, vmbr1 两个都要, 一个 LAN  一个 WAN
- LAN: eth0 | lan1 静态 ip: 192.168.6.2/24
- DHCP->网关: 192.168.6.1
- DHCP->DNS 192.168.6.1,223.6.6.6
- DNS: 192.168.6.1,223.6.6.6
```

4. LuxDNS: DNS + 出海海淘 LXC 容器 **192.168.6.1/24**

```sh
# LAN: vmbr0 一个就行
- 静态 ip: 192.168.6.1/24
- 网关 192.168.6.2
- DNS 223.5.5.5 公共 DNS 即可
```

## 参考文档

- [基于 DNS 的内网透明代理分流方案](https://songchenwen.com/tproxy-split-by-dns)
