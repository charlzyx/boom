---
title: .1 iKuai 安装与配置
lastUpdated: true
---

# iKuai 虚拟机 `192.168.6.1`

| 服务     | 端口 |
| -------- | ---- |
| 管理后台 | :80  |

呃...， 从官网下载 iso 文件， 然后 GUI 安装就好了，记得给两张网卡, 其他没什么要注意的地方

[爱快路由系统下载](https://www.ikuai8.com/component/download)

虚拟机配置如下， 主要注意一下两张网卡绑定的对应网口

![ikvm](/assets/ikuai/ikvm.png){data-zoomable}

## /etc/pve/nodes/pve/qemu-server/101.conf

```sh
balloon: 512
boot: order=scsi0;net0
cores: 2
cpu: x86-64-v2-AES
memory: 2048
meta: creation-qemu=8.0.2,ctime=1692712820
name: iKuai
net0: virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0
net1: virtio=BB:CC:DD:EE:FF:01,bridge=vmbr1
numa: 0
onboot: 1
ostype: l26
scsi0: local-lvm:vm-101-disk-0,iothread=1,size=2G
scsihw: virtio-scsi-single
smbios1: uuid=df78ec88-779a-4690-91b8-4fbdc817345a
sockets: 1
vmgenid: ac0e3b98-95bf-495d-93b1-ac1f513ab503
```

## iKuai 路由配置

从 PVE 管理后台进入 iKuai 控制台， 绑定 LAN 口 ip `192.168.6.1` 之后使用该 ip 从浏览起进入 iKuai 管理后台配置

## LAN IP 绑定

依次输入命令

```sh
1 设置网卡绑定
set lan1 eth0
2 设置 LAN/WAN 地址
0 绑定 LAN 口
192.168.6.1
# WAN 口先不用绑定，回车退出完成设置
```

![ikshell](/assets/ikuai/ikshell.png){data-zoomable}

## 基础配置

浏览器打开 `192.168.6.1`, 首次需要初始化 `admin` 管理员密码

进入 `网络设置-内外网设置`，确认两张网卡绑定正确
![iknets](/assets/ikuai/iknets.png){data-zoomable}

### WAN 口配置

根据个人需求选择配置接入方式

![ikwan](/assets/ikuai/ikwan.png){data-zoomable}

### LAN 口配置

![iklan](/assets/ikuai/iklan.png){data-zoomable}

### DNS 与 DHCP

> 注意：这两个地方的 192.168.6.2 是最终配置， 可以先写成 192.168.6.1 先测试 iKuai 配置是否能够联网

![ikdns](/assets/ikuai/ikdns.png){data-zoomable}
![ikdhcp](/assets/ikuai/ikdhcp.png){data-zoomable}

### 流控分流

:::tip 关于网关和 DNS
DNS 是一个把域名 `www.baidu.com` 翻译为 `39.23.112.233` 的服务器

网关是你的流量要从哪里出去，每一个流量请求都是直接走到 ip 的
:::
联网的科学与否主要依赖设备最终指向的真实网关来确定，有两种方案

1. 在 DHCP 配置中， 指定 DHCP 网关 -> `192.168.6.2` & DNS `192.168.6.2`
2. `流控分流>分流设置>端口分流` 指定 ip 或 ip 段来的 `下一跳网关` 来实现

在这里， 我使用的方案 2, 配置如下, 其中 ip 段划分参考架构篇， 理由嘛

1. 是为了让终端的网关看起来还是路由管理后台， 符合直觉
2. 是 LXC 容器是一些静态 IP 不在 DHCP 网段， 不能通过 DHCP 改变指向， 虽然手动指定也可以， 但我更习惯都指向主网关， 即 `192.168.6.1`

![ikflow](/assets/ikuai/ikflow.png){data-zoomable}

网关和 DNS 这两个配置并没有强关联性，之所以我们要在 `192.168.6.2` 的机器上配置 `AdGuardHome->mosdns -> clash dns`3 层 DNS 服务

1. 是为了解决 DNS 污染问题
2. 是为了做缓存, 让我们的 DNS 响应尽可能快

### IPv6 推荐设置

非必要， 不开也行

![IPv6](/assets/ikuai/ipv6.png)

### 完结撒花

iKuai 的配置基本上到这里就结束了， 这个时候把上面图中的 `192.168.6.2` 这个还不存在的 IP 替换为 iKuai 路由即`192.168.6.1`的话， 已经可以通过 LAN 口链接到互联网了， 可以通过接入物理网线或者创建虚拟机来验证
