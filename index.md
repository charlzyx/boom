# PVE BoomLab

BoomLab 专注于与家庭媒体相关的一切，提供一系列基于 PVE CT/VM 的应用程序，如 AdGuardHome/iKuai/Clash/XunLei/Jellyfin 等。

## 截图

![showtime](/assets/home.png)

## 硬件

| 名称    | 入口   | 出口   | 路由模式 |
| ------- | ------ | ------ | -------- |
| 光猫    | 光纤   | `LAN1` | 桥接     |
| 主机    | `ETH1` | `ETH0` | 路由     |
| TP-Link | `LAN1` | `WIFI` | 桥接     |

光猫: LAN1 -> ETH1 :主机: ETH0 —> LAN1: TP-Link : WIFI

## PVE 网桥配置

> 参考 [ahuacate/pve-host](https://github.com/ahuacate/pve-host#22-pve-host---dual-nic-pfsense-support)

| Linux Bridge   |                                  |                                  |
| -------------- | -------------------------------- | -------------------------------- |
| Name           | `vmbr0`                          | `vmbr2`                          |
| IPv4/CIDR      | `192.168.6.6/24`                 | Leave blank                      |
| Gateway (IPv4) | `192.168.6.1`                    | Leave blank                      |
| IPv6/CIDR      | Leave blank                      | Leave blank                      |
| Gateway (IPv6) | Leave blank                      | Leave blank                      |
| Autostart      | `☑`                              | `☑`                              |
| VLAN aware     | `☑`                              | `☑`                              |
| Bridge ports   | Input your NIC name (i.e enp1s0) | Input your NIC name (i.e enp2s1) |
| Comment        | `ETH0 as LAN`                    | `ETH1 as WAN`                    |
| MTU            | 1500                             | 1500                             |

## 路由表概览

> 参考 [ahuacate/pve-homelab](https://github.com/ahuacate/pve-homelab#prerequisites)

| 名称      | 类型 | 网卡 Linux Bridge | IPv4/CIDR      | 网关                 | DNS         | 备注          |
| --------- | ---- | ----------------- | -------------- | -------------------- | ----------- | ------------- |
| pve       | Host | `LAN`             | 192.168.6.6/24 | 192.168.6.1          | 223.6.6.6   | 母鸡          |
| pve       | Host | `WAN`             | DHCP           | DHCP                 | 223.6.6.6   | 母鸡          |
| clash     | CT   | `LAN`             | 192.168.6.2/24 | **192.168.6.1**      | 127.0.0.1   | 小鸡:科学路由 |
| **iKuai** | VM   | `LAN & WAN`       | 192.168.6.1/24 | **192.168.6.2** 分流 | 192.168.6.2 | 小鸡:主路由   |

## 应用网络配置:小鸡们

| 名称   | 类型 | 网卡 Linux Bridge | IPv4/CIDR       | 网关        | IPv6       | DNS       | 备注              |
| ------ | ---- | ----------------- | --------------- | ----------- | ---------- | --------- | ----------------- |
| cloud  | CT   | `LAN`             | 192.168.6.3/24  | 192.168.6.1 | DHCP/SLAAC | 223.6.6.6 | smb/sftpgo/alist  |
| tv     | CT   | `LAN`             | 192.168.6.4/24  | 192.168.6.1 | DHCP/SLAAC | 223.6.6.6 | 电视鸡            |
| docker | CT   | `LAN`             | 192.168.6.5/24  | 192.168.6.1 | DHCP/SLAAC | 223.6.6.6 | CT 套娃 docker 鸡 |
| bt     | CT   | `LAN`             | 192.168.6.87/24 | 192.168.6.1 | DHCP/SLAAC | 223.6.6.6 | 下载鸡 xunlei/bt  |
