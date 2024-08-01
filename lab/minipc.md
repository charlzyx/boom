# 0x02 MiniPC 

> 大唐 MaxTang NX-N100

```bash
         .://:`              `://:.            root@chao
       `hMMMMMMd/          /dMMMMMMh`          ---------
        `sMMMMMMMd:      :mMMMMMMMs`           OS: Proxmox VE 8.2.2 x86_64
`-/+oo+/:`.yMMMMMMMh-  -hMMMMMMMy.`:/+oo+/-`   Host: EHL30 V1.0
`:oooooooo/`-hMMMMMMMyyMMMMMMMh-`/oooooooo:`   Kernel: 6.8.4-2-pve
  `/oooooooo:`:mMMMMMMMMMMMMm:`:oooooooo/`     Uptime: 21 hours, 24 mins
    ./ooooooo+- +NMMMMMMMMN+ -+ooooooo/.       Packages: 805 (dpkg)
      .+ooooooo+-`oNMMMMNo`-+ooooooo+.         Shell: zsh 5.9
        -+ooooooo/.`sMMs`./ooooooo+-           Terminal: /dev/pts/0
          :oooooooo/`..`/oooooooo:             CPU: Intel Celeron J6412 (4) @ 2.600GHz
          :oooooooo/`..`/oooooooo:             GPU: Intel Elkhart Lake [UHD Graphics Gen11 16EU]
        -+ooooooo/.`sMMs`./ooooooo+-           Memory: 1350MiB / 7788MiB
      .+ooooooo+-`oNMMMMNo`-+ooooooo+.
    ./ooooooo+- +NMMMMMMMMN+ -+ooooooo/.
  `/oooooooo:`:mMMMMMMMMMMMMm:`:oooooooo/`
`:oooooooo/`-hMMMMMMMyyMMMMMMMh-`/oooooooo:`
`-/+oo+/:`.yMMMMMMMh-  -hMMMMMMMy.`:/+oo+/-`
        `sMMMMMMMm:      :dMMMMMMMs`
       `hMMMMMMd/          /dMMMMMMh`
         `://:`              `://:`
```


## 安装 PVE

安装最好接上网线, 这里有个[张大妈](https://post.smzdm.com/p/agqw24zw/)的教程写的很详细
接上网线的好处就是在设置网络接口的界面, 就可以直接指定IP了, 红色是根据我的方案的设置

![pveiface](/lab/assets/pveiface.png)

老版本里面有比较啰嗦的 [更详细的指南](/archived/0x04install.md) 与 [linux 基本命令解释](/archived/0x03baselinux.md)

1. 下载 ISO 镜像文件
   > 官方: https://www.proxmox.com/en/downloads
   > 清华源: https://mirrors.tuna.tsinghua.edu.cn/proxmox/iso/
2. 制作启动盘 Ventoy
   > https://ventoy.net/cn/download.html
3. 有线安装
   > BIOS 修改 U 盘启动

手动网络配置参考 /etc/network/interface

```bash
auto vmbr0
iface vmbr0 inet static
      address 10.5.6.6/24
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
      # address 10.5.6.6/24
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

## LXC OpenWRT 安装

> [!TIP]
> 为什么不用虚拟机?
> 运行在PVE LXC CT容器中的OpenWRT优点：
> 1、资源利用率高。（老高自用的1核+512M内存足矣，具体配置自己按需设置）
> 2、直接使用宿主内核及硬件，效率高。
> 3、系统信息直接显示。（温度，机型等硬件信息）

其中 rootfs.tar.gz 可以直接下载打包好的

也可以参考油管视频 [OpenWRT常规img.gz转化为PVE LXC CT模版rootfs.tar.gz及简单LXC OP的安装与基本设置以旁路由模式为例](https://www.youtube.com/watch?v=w7_uTejLHeA)

- [openwrt 官方](https://archive.openwrt.org/releases/23.05.3/targets/x86/64/)
- [清华镜像站](https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/23.05.4/targets/x86/64/)
- [带佬的可定制](https://openwrt.ai/?target=x86%2F64&id=generic)

以清华镜像站的为例, 以下命令在宿主机的 shell 中执行

```bash
wget https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/23.05.4/targets/x86/64/openwrt-23.05.4-x86-64-rootfs.tar.gz
qm create 110 ./openwrt-23.05.4-x86-64-rootfs.tar.gz --rootfs \
   local-lvm:2 --ostype unmanaged --hostname OpenWRT \
   --arch amd64 --cores 1 --memory 512 --swap 0 \
   -net0 bridge=vmbr0,name=eth0 \
   -net1 bridge=vmbr1,name=eth1
```

大概意思是:

- 创建 ID 为 `100` 的CT , 使用刚才下载的 `openwrt...rootfs.tar.gz` 文件作为模版

- 指定虚拟磁盘为 `2`Gb(后续可以扩容不能减少), 系统类型 `unmanaged` (UI创建会因为无法推断系统类型而失败) 主机名称 `OpenWRT`

- 架构 `amd64` CPU 核心数 `1`, 内存 `512`Mb Swap `0` , 添加网口绑定 `eth0:vmbr0`, `eth1``vmbr1` (需要先管理界面添加对网口的绑定)

完成之后, 需要再次在配置文件中添加一些配置, 参考下方

/etc/pve/lxc/110.conf

```bash
arch: amd64
cores: 1
# 开启特性功能-嵌套, 不然可能因为 DNS 问题连不了网
features: nesting=1
hostname: OpenWRT
memory: 512
net0: name=eth0,bridge=vmbr0,hwaddr=BC:24:11:DF:3F:83,type=veth
net1: name=eth1,bridge=vmbr1,hwaddr=BC:24:11:67:0A:8A,type=veth
onboot: 1
ostype: unmanaged
rootfs: local-lvm:vm-110-disk-0,size=2G
swap: 0
# 如果 需要 开启 tun 模块的话, 就使用下面三行, 不然就不需要
lxc.cgroup.devices.allow: c 10:200 rwm
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir

```

`pct start 110` 启动!

## OpenWRT 中继模式配置

在 PVE 管理后台中进入 OpenWRT 命令行, 用户名 root, 密码看各自文档, 官方版没有密码, 直接回车

> [!NOTE]
> 中继模式是指: openwrt 只是将两个网口的设备链接起来, ip 的下发和管理都还是主路由来控制, 这样对于上下游的路由器和设备来说, openwrt 这里是透明的

修改 /etc/config/network 文件配置

```bash
config interface 'loopback'
        option device 'lo'
        option proto 'static'
        option ipaddr '127.0.0.1'
        option netmask '255.0.0.0'

config globals 'globals'
        # 这里默认多少就是多少, 因为我没有用 ipv6 所以没所谓
        option ula_prefix 'fd07:40c6:20ae::/48' 
        option packet_steering '1'

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

## 验证

如果配置成功的话, 这时候就能够在小米路由器的管理后台看到 网线联网设备新增了三个

![route-check](/lab/assets/router-check.png)

以及, 我们可以使用 ip 来访问对应的 pve/openwrt/群晖 管理后台

## 小结

受益于 PVE 虚拟机的能力, 其实还可以拓展很多应用出来, 包括虚拟机里的黑群晖之类, 但我这个机器比较孱弱 J6412/8Gb/256Gb; 搞点小应用还是可以的. 后续在这方便回拓展一下

接下来问题就是, 我们该如何在公网环境中访问家里的内网呢? 这就的感谢赛博菩萨 [tailscale](/lab/tailscale)