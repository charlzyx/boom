---
title: .6 宿主机
lastUpdated: true
---

# 宿主机 `192.168.6.6`

因为我是使用了一个 USB 外置硬盘来做为数据存储盘, 而后续的 NAS 应用, 基本都依赖这个硬盘, 所以需要添加一下重要的外挂硬盘的自动挂载与对应 LXC 的启停管理。

> 如果你没有外挂硬盘的话, 不用考虑

外挂硬盘

```sh
/titan/space
/titan/cloud
```

## 磁盘的自动挂载

监听 USB 卸载容器自动停止

```sh
# cat /etc/udev/rules.d/99-checklxc.rules
# lsusb
# Bus 002 Device 002: ID 1233:5566 ASMedia Technology Inc. ASM1051E SATA 6Gb/s bridge, ASM1053E SATA 6Gb/s bridge, ASM1153 SATA 3Gb/s bridge, ASM1153E SATA 6Gb/s bridge
# - Bus 002 Device 002: 这是 USB 控制器的编号以及设备的编号。在此情况下，它表示第二个 USB 控制器上的第二个设备。
# - ID 1233:5566: 这是设备的厂商ID和产品ID。在此情况下，厂商ID是 1233，产品ID是 5566。
# - ASMedia Technology Inc. ASM1051E SATA 6Gb/s bridge, ASM1053E SATA 6Gb/s bridge, ASM1153 SATA 3Gb/s bridge, ASM1153E SATA 6Gb/s bridge：这是设备的描述，它说明了这是一个由 ASMedia Technology Inc. 制造的桥接器，用于连接 SATA 设备。
SUBSYSTEM=="usb", ATTRS{idVendor}=="1233", ATTRS{idProduct}=="5566", ACTION=="add", RUN+="/root/scripts/checklxc.sh add"
SUBSYSTEM=="usb", ATTRS{idVendor}=="1233", ATTRS{idProduct}=="5566", ACTION=="remove", RUN+="/root/scripts/checklxc.sh remove"
```

::: details `/root/titan/checklxc.sh` 外接磁盘自动挂载脚本

```bash
#!/bin/bash

set -ex

# /etv/udev/rules.d/99-checklxc.rule
#
ACTION=$1

mount() {
  # Check if /titan/cloud is already mounted
  if grep -qs '/titan/cloud' /proc/mounts; then
      echo "/titan/cloud is already mounted."
  else
      mount -U ea310bac-108b-4f59-9ba6-cf36d8bea004 /titan/cloud
  fi

  # Check if /titan/space is already mounted
  if grep -qs '/titan/space' /proc/mounts; then
      echo "/titan/space is already mounted."
  else
      mount -U 5db0c2bf-dc6d-4e82-a0d6-ac05f6633dee /titan/space
  fi
}

unmount() {

  # Check if /titan/cloud is mounted
  if grep -qs '/titan/cloud' /proc/mounts; then
      umount /titan/cloud
      echo "/titan/cloud has been unmounted."
  else
      echo "/titan/cloud is not mounted."
  fi

  # Check if /titan/space is mounted
  if grep -qs '/titan/space' /proc/mounts; then
      umount /titan/space
      echo "/titan/space has been unmounted."
  else
      echo "/titan/space is not mounted."
  fi
}

stop_cts() {
  # 检查容器是否运行，如果运行则关闭
  for CT_ID in 103 104 105 123; do
    if pct status $CT_ID | grep -q "running"; then
      pct stop $CT_ID
      echo "Container $CT_ID stopped."
    else
      echo "Container $CT_ID not runing, do nothing."
    fi
  done
}

start_cts() {
  # 检查容器是否运行，如果运行则关闭
  for CT_ID in 103 104 105 123; do
    if pct status $CT_ID | grep -q "running"; then
      echo "Container $CT_ID restarted."
    else
      pct start $CT_ID
      echo "Container $CT_ID started."
    fi
  done
}

MOUNT_BASE="/titan"
SPACE_DIR="$MOUNT_BASE/space"
CLOUD_DIR="$MOUNT_BASE/cloud"


if [ "$ACTION" = "add" ]; then
  mount
  sleep 3
  # 在设备插入时执行的操作
  if grep -qs "$SPACE_DIR" /proc/mounts && grep -qs "$CLOUD_DIR" /proc/mounts; then
    echo "Both $SPACE_DIR and $CLOUD_DIR are already mounted."
    start_cts
  fi

fi

if [ "$ACTION" = "remove" ]; then
  stop_cts
  unmount
fi

```

:::

## 文件权限

PVE LXC 非特权容器的访问权限有一个为了安全的 idmap 机制， 想了解的话可以看看这里

[Unprivileged LXC containers](https://pve.proxmox.com/wiki/Unprivileged_LXC_containers)
[Proxmox LXC 挂载目录及权限设置](https://www.haiyun.me/archives/1419.html)

我嫌麻烦就 LXC 容器没有特殊说明全是特权, USB 文件全部 777 ，甚至还写了个检测脚本来狗掉这个问题

安装依赖 `apt install inotify-tools -y`

`root@pve:~/scripts # cat /root/scripts/watchtitan.sh`

```sh
#!/bin/sh


# apt install inotify-tools -y
# /etc/systemd/system/watchtitan.service
#
# 监听目录变化
inotifywait -m -r -e create,delete,modify,move /titan/space /titan/cloud |
while read path action file; do
  if [ -d "$path$file" ]; then
    # 检查目录权限
    permissions=$(stat -c "%a" "$path$file")
    echo "$path$file"
    if [ "$permissions" != "777" ]; then
      # 修改权限
      chmod -R 777 "$path$file"
      echo "已修正权限为777: $path$file"
    fi
  fi
done
```

## 写入启动脚本

```sh
# root@pve:~/scripts # cat /etc/systemd/system/watchtitan.service
[Unit]
Description=Watch Titan Dir, Keep 777

[Service]
Type=simple
ExecStart=/bin/bash -c "/root/scripts/watchtitan.sh &"

[Install]
WantedBy=multi-user.target
```

设置自启

`systemctl enable watchtitan`

## IPv6

宿主机需要配置 `/etc/sysctl.conf`, 注意 这会在所有 LXC 中开启 IPv6

```sh
net.ipv6.conf.all.accept_ra=2
net.ipv6.conf.default.accept_ra=2
net.ipv6.conf.vmbr0.accept_ra=2
net.ipv6.conf.all.autoconf=1
net.ipv6.conf.default.autoconf=1
net.ipv6.conf.vmbr0.autoconf=1
```

`sysctl -p` 使变更生效

::: tip 单独关闭 LXC 的 IPv6

比方说我的 jellyfin 小鸡， 在开启 IPv6 的情况下， 就无法拉取 插件目录
进入到小鸡的 shell
编辑 `/etc/sysctl.conf`

```sh
net.ipv6.conf.all.disable_ipv6 = 1
```

`sysctl -p` 使变更生效
:::

## 小结

至此热拔插配置处理完毕, 可以开始安心的开始一个个的处理我们的应用小鸡, 按需查看
