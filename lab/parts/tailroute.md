::: details 如果要安装在小米路由器上的话, 略微有亿点点困难

##  如何安装到小米路由器上 

官方给的安装脚本并不能直接运行, 因为小米路由器就算破解了 ssh, 但不能像常规的 openwrt 一样自由的安装软件与配置;

以我手上的 6499PRO 为例, /etc/ 目录是会在每次重启之后清空的, 只有 /data/other 留有100M左右空间; 

不提废话, 开搞!

### -1. ssh 登录

通过 ssh 链接小米路由器 `ssh root@9.5.6.1` , 执行官方安装命令会有如下报错, 有用的信息是
这个链接 https://pkgs.tailscale.com/stable/#static 和 `LEDE_ARCH="aarch63_cortex-a53_neon-vfpv4"`

curl -fsSL https://tailscale.com/install.sh | sh 输出结果
```bash
root@XiaoQiang:~# curl -fsSL https://tailscale.com/install.sh | sh
Couldn't determine what kind of Linux is running.
You could try the static binaries at:
https://pkgs.tailscale.com/stable/#static

If you'd like us to support your system better, please email support@tailscale.com
and tell us what OS you're running.

Please include the following information we gathered from your system:

OS=other-linux
VERSION=
PACKAGETYPE=
UNAME=Linux XiaoQiang 4.4.213 #0 SMP PREEMPT Mon Mar 11 03:38:30 2024 aarch64 GNU/Linux

NAME="OpenWrt"
VERSION="17.06-SNAPSHOT"
ID="openwrt"
ID_LIKE="lede openwrt"
PRETTY_NAME="OpenWrt 17.06-SNAPSHOT"
VERSION_ID="17.06-snapshot"
HOME_URL="http://openwrt.org/"
BUG_URL="http://bugs.openwrt.org/"
SUPPORT_URL="http://forum.lede-project.org/"
BUILD_ID="unknown"
LEDE_BOARD="ipq52xx/generic"
LEDE_ARCH="aarch63_cortex-a53_neon-vfpv4"
LEDE_TAINTS="no-all busybox override"
LEDE_DEVICE_MANUFACTURER="OpenWrt"
LEDE_DEVICE_MANUFACTURER_URL="http://openwrt.org/"
LEDE_DEVICE_PRODUCT="Generic"
LEDE_DEVICE_REVISION="v-1"
LEDE_RELEASE="OpenWrt 17.06-SNAPSHOT unknown"

```

### - 0. 手动下载二进制文件

```bash
cd /data/other
wget https://pkgs.tailscale.com/stable/tailscale_0.70.0_arm64.tgz
tar -xvf ./tailscale_0.70.0_arm64.tgz
mv tailscale_0.70.0_arm64 tailscale
```

### - 1. 编写启动脚本 /data/other/tailscale.procd

添加可执行权限 `chmod 776 /data/other/tailscale.procd`

```bash
#!/bin/sh /etc/rc.common

START=98
SERVICE_DAEMONIZE=0
SERVICE_WRITE_PID=0
PIDFILE=/var/run/tailscaled.pid

TAIL="/data/other/tailscale"
TAILD="/data/other/tailscale/tailscaled"

start(){
    $TAIL/tailscaled --cleanup
    start-stop-daemon -S -b -m -p $PIDFILE \
      -x $TAILD -- \
      --port=41640 \
      --state=$TAIL/tailscaled.state
  echo "tailscaled running..."
  ps | grep tailscaled
}

stop(){
  $TAILD  --cleanup
  start-stop-daemon -K -p "$PIDFILE"
  echo "killed tailscaled"
}

restart(){
  # 这里两个 advertise 参数就是能够让我们内网访问的重要参数
  ${TAIL}/tailscale up --advertise-exit-node --advertise-routes=9.5.6.0/24
}
```

### -4. 编写自启动命令 /data/other/autorun.sh

添加可执行权限 `chmod 776 /data/other/autorun.sh`

```bash
#!/bin/sh

cp ./tailscale.procd /etc/init.d/tailscale
rm -rf /etc/rc.d/S98tailscale
ln -s /etc/init.d/tailscale /etc/rc.d/S98tailscale
echo 'alias tailscale=/data/other/tailscale/tailscale' >> /etc/profile
source /etc/profile
/etc/init.d/tailscale start
```

### -5. 执行命令

```bash
/data/other/autorun.sh
service tailscale start
```

没有报错信息的话, 就可以正常使用 `tailscale` 命令了, 其中 子路由和 exit-node 功能 需要在 tailscale Admin console 开启

![tailconsole](/lab/assets/tailconsole.png)


### -6. 软固化

> 理论上可行, 还没验证


路由器重启会删除除了 /data/ 路径下的所有其他文件
比方说我们添加的 /etc/init.d/tailscale 文件, 所以利用一下 ShellCarsh 的软固化功能, 把我们的启动脚本放到 ShellCarsh 的软固化脚本里面执行一下

首先找到 ShellCrash 安装目录, 我的是 /data/ShellCrash, 修改 misnap_init.sh 这个文件, 在大概这个位置

```diff
	#软固化功能
	autoSSH
	#设置init.d服务
	cp -f $CRASHDIR/shellcrash.procd /etc/init.d/shellcrash
	chmod 754 /etc/init.d/shellcrash
	#启动服务
	if [ ! -f $CRASHDIR/.dis_startup ]; then
        ...
    fi
+   source /data/other/autorun.sh
```

:::

