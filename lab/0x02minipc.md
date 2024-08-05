# 0x02 MiniPC.Air

> 大唐 MaxTang NX-N100

![neofetch](/lab/assets/neofetch.png)

## 安装 PVE

安装最好接上网线, 这里有个[张大妈](https://post.smzdm.com/p/agqw24zw/)的教程写的很详细
接上网线的好处就是在设置网络接口的界面, 就可以直接指定IP了, 红色是根据我的方案的设置

![pveiface](/lab/assets/pveiface.png)

老版本里面有比较啰嗦的 [更详细的指南](/archived/0x04install.md) 与 [linux 基本命令解释](/archived/0x03baselinux.md)

1. 下载 ISO 镜像文件
   - 官方: https://www.proxmox.com/en/downloads
   - 清华源: https://mirrors.tuna.tsinghua.edu.cn/proxmox/iso/
2. 制作启动盘 Ventoy
   - https://ventoy.net/cn/download.html
3. 有线安装
   - BIOS 修改 U 盘启动

手动网络配置参考 /etc/network/interface

```bash
auto vmbr0
iface vmbr0 inet static
      address 10.5.6.8/24
      gateway 10.5.6.1
      bridge-ports en0sp1
      bridge-stp off
      bridge-fd 0
```

::: details WiFi 连接 (无法桥接, 非常不推荐) 

```bash
apt install wpasupplicant -y
```

/etc/network/interface

```bash
auto wlp3s0
iface wlp3s0 inet dhcp
      # address 10.5.6.8/24
      gateway 10.5.6.1
      wpa_conf /etc/network/wifi.conf
```

/etc/network/wifi.conf

```bash
ctrl_interface=/var/run/wpa/supplicant #运行位置
update_config=1 #允许在运行中由进程自动修改配置

network={
  ssid="WiFi"
  psk="XXXXXX"
  priority=1 #优先连接
}
```


:::

## 硬盘分区 (不需要可跳过)


```bash
fdisk /dev/sda
Command (m for help): n
Partition number (4-128, default 4): 
First sector ($START-$END, default $START): 
Last sector, +/-sectors or +/-size{K,M,G,T,P} ($START-$END, default $END): 
> w

mkfs.ext4 /dev/sda4
mkdir /home/cloud && chmod -R 755 /home/cloud 

```

/etc/fstab

```bash
/dev/sda4 /home/cloud ext4 defaults 0 0
# mount -a && systemctl daemon-reload
```

## LXC OpenWRT  安装

> 使用官方 OpenWRT 镜像, 承担了三个重要的功能

- 路由器中继
- SMB 服务器
- tailscale 中心客户端

::: info LXC CT容器的优点：
- 资源利用率高
- 直接使用宿主内核及硬件，效率高
- 温度，机型等硬件等系统信息直接显示
:::

其中 rootfs.tar.gz 可以直接下载打包好的,也可以参考油管视频 [OpenWRT常规img.gz转化为PVE LXC CT模版rootfs.tar.gz及简单LXC OP的安装与基本设置以旁路由模式为例](https://www.youtube.com/watch?v=w7_uTejLHeA)

- [openwrt 官方](https://archive.openwrt.org/releases/23.05.3/targets/x86/64/)
- [清华镜像站](https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/23.05.4/targets/x86/64/)
- [带佬的可定制](https://openwrt.ai/?target=x86%2F64&id=generic)

以清华镜像站的为例, 以下命令在宿主机的 shell 中执行

```bash
wget https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/23.05.4/targets/x86/64/openwrt-23.05.4-x86-64-rootfs.tar.gz
pct create 110 ./openwrt-23.05.4-x86-64-rootfs.tar.gz --rootfs \
   local-lvm:2 --ostype unmanaged --hostname OpenWRT \
   --arch amd64 --cores 1 --memory 512 --swap 0 \
   -net0 bridge=vmbr0,name=eth0 \
   -net1 bridge=vmbr1,name=eth1
```

完整配置如下, 先不用管太多细节, 下一章节有一点点解释

::: details /etc/pve/lxc/110.conf

```bash
arch: amd64
cmode: shell
cores: 1
features: fuse=1,mknod=1,mount=nfs;cifs,nesting=1
hostname: Air
memory: 512
mp0: /home/cloud,mp=/cloud
net0: name=eth0,bridge=vmbr0,gw=10.5.6.1,hwaddr=BC:24:11:E7:9B:81,ip=10.5.6.10/24,type=veth
net1: name=eth1,bridge=vmbr1,hwaddr=BC:24:11:8E:6F:7E,type=veth
ostype: unmanaged
rootfs: local-lvm:vm-110-disk-0,size=2G
swap: 0
lxc.apparmor.profile: unconfined
lxc.cap.drop:
lxc.cgroup.devices.allow: a
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
lxc.cgroup2.devices.allow: c 226:0 rwm
lxc.cgroup2.devices.allow: c 226:128 rwm

```

:::

`pct start 110` 启动!

### LXC OpenWRT 中继模式配置

在 PVE 管理后台中进入 OpenWRT 命令行, 用户名 root, 密码看各自文档, 官方版没有密码, 直接回车

> [!NOTE]
> 中继模式是指: openwrt 只是将两个网口的设备链接起来, ip 的下发和管理都还是主路由来控制, 这样对于上下游的路由器和设备来说, openwrt 这里是透明的

修改 /etc/config/network 文件配置

```bash
config interface 'lan'
        option proto 'static'
        option ipaddr '10.5.6.10'
        option dns '10.5.6.1'
        option gateway '10.5.6.1'
        option netmask '255.255.255.0'
        option device 'br-lan'

config device
        option name 'br-lan'
        # 下面三行是两个网口中继的配置
        option type 'bridge'
        list ports 'eth0'
        list ports 'eth1'
```

修改保存之后, `service network restart` 或者 直接 `reboot` 重启就好了

如果配置成功的话, 这时候就能够在小米路由器的管理后台看到 网线联网设备新增了三个

![route-check](/lab/assets/router-check.png)

重启之后， `ip addr` 查看下ip信息， 之后就可以通过浏览器来访问 OpenWRT LuCI 界面了.

```bash
# 更新软件源
sed -i 's_downloads.openwrt.org_mirrors.tuna.tsinghua.edu.cn/openwrt_' /etc/opkg/distfeeds.conf

```

## SMB 服务器 

可以方便的在局域网共享文件

```bash
# 安装工具包
opkg install samba4-server luci-app-samba4 wsdd2 shadow

# 需要先添加系统用户， 才能加入到 smb 用户
useradd -u 1001 -s /usr/sbin/nologin -M cloud
useradd -u 1002 -s /usr/sbin/nologin -M tv
smbapasswd -a cloud # 根据提示输入用户名密码
smbapasswd -a tv # 根据提示输入用户名密码
#  smb 服务设置为开机自启
service samba4 enable
#  smb 服务 立即启动 
service samba4 start
#  windows 网络服务发现服务设置为开机自启
service wsdd2 enable
#  smb 服务 立即启动 
service wsdd2 start
```

可视化的 smb 配置要友好的多了
![smb](/lab/assets/lucismb.png)



## tailscale

简单来说, tailscale 是一个基于 WireGuard® 的 VPN 服务, 可以在公网设备和家里局域网之间打洞.
了解更多可以查看官网 [https://tailscale.com](https://tailscale.com)

```bash
opkg install tailscale
tailscale update
service tailscale enable
service tailscale start

# 首次需要打开链接登录， 后续就不用了
tailscale up --advertise-exit-node  --advertise-routes=10.5.6.0/24 --reset

```
有问题的话, 可以通过手动运行 tailscaled 命令查看 log 来排查

之后再 tailscale 的 Admin console WEB 页面开启 子路由和退出节点
![tailconsole](/lab/assets/tailconsole.png)

成功的话, 就可以在安装 tailscale 客户端, 并开启 VPN 链接的情况下, 在公网使用局域网ip网段 `10.5.6.0/24` 进行访问了, 就像这样

![showtime](/lab/assets/showtime.png)

当然 tailscale 其实提供了多种访问方式, 另外还有 tailscale serve / tailscale funnel 将本地映射到公网之类的高级功能, 可以自由探索一番

<!--@include: ./parts/tailroute.md-->

## 小结

这样一个连接万物的 Air 服务器就配置好了
