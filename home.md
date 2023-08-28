---
title: .6 宿主机
lastUpdated: true
---

# 宿主机 `192.168.6.6`

| 服务  | 端口 |
| ----- | ---- |
| nginx | :80  |

宿主机主要承载了 nginx 导航和 tailscale 两个服务, 以及重要的外挂硬盘的自动挂载与对应 LXC 的启停管理

外挂硬盘

```sh
/titan/space
/titan/cloud
```

## 磁盘的自动挂载

开机检测挂载与容器自动启动

```sh
# cat  /etc/systemd/system/titan-mount.service
[Unit]
Description=Mount and Start Titan USB HDD
After=network.target lxc-net.service remote-fs.target
Wants=lxc.service

[Service]
Type=oneshot
ExecStart=/root/titan/start.sh

[Install]
WantedBy=multi-user.target
```

监听卸载于容器自动停止

```sh
# cat /etc/udev/rules.d/99-titan-mount-start.rules
ACTION=="remove", RUN+="/root/titan/stop.sh"
```

::: details `/root/titan/mount.sh` 外接磁盘自动挂载脚本

```bash
#!/bin/bash
set -ex

MOUNT_BASE="/titan"
MOUNTED=false  # 用于记录是否发生挂载行为


# 获取所有块设备的信息
DEVICE_LIST=$(blkid -o device)

# 遍历每个设备，检查 PARTLABEL
for DEVICE in $DEVICE_LIST; do
  PARTLABEL=$(blkid -o value -s PARTLABEL $DEVICE)

  if [ "$PARTLABEL" == "cloud" ] || [ "$PARTLABEL" == "space" ]; then
    MOUNT_PATH="$MOUNT_BASE/$PARTLABEL"

    # 检查目标挂载路径是否存在，如果不存在则创建
    if [ ! -d "$MOUNT_PATH" ]; then
      mkdir -p "$MOUNT_PATH"
    fi


    if grep -qs "$MOUNT_POINT" /proc/mounts; then
      echo "The mount point $MOUNT_POINT is already mounted."
    else
      # 挂载设备到目标路径
      UUID=$(blkid -o value -s UUID $DEVICE)
      mount -U $UUID $MOUNT_PATH
      echo "mount $MOUNT_POINT successful!"
      MOUNTED=true

    fi
  fi
done


# 根据是否发生挂载行为来决定是否执行 start 脚本
if $MOUNTED; then
  /root/titan/start.sh
fi
```

:::

::: details `/root/titan/start.sh` 检测硬盘挂载并自动启动脚本

```sh
#!/bin/bash

set -ex
# tv 204 / cloud 203 / bt  208

start_cts() {
  # 检查容器是否运行，如果运行则关闭
  for CT_ID in 203 204 205 208; do
    if pct status $CT_ID | grep -q "running"; then
      pct reboot $CT_ID
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

# 检查 /titan/space 和 /titan/cloud 是否已经挂载
if grep -qs "$SPACE_DIR" /proc/mounts && grep -qs "$CLOUD_DIR" /proc/mounts; then
    echo "Both $SPACE_DIR and $CLOUD_DIR are already mounted."
    start_cts
else
    echo "One or both directories are not mounted."
fi
```

:::

::: details `/root/titan/start.sh` 检测硬盘卸载并自动关闭虚拟机

```sh
#!/bin/bash


set -ex
# tv 204 / cloud 203 / bt  208

stop_cts() {
  # 检查容器是否运行，如果运行则关闭
  for CT_ID in 203 204 208; do
    if pct status $CT_ID | grep -q "running"; then
      pct stop $CT_ID
      echo "Container $CT_ID stopped."
    else
      echo "Container $CT_ID not runing, do nothing."
    fi
  done
}

MOUNT_BASE="/titan"
SPACE_DIR="$MOUNT_BASE/space"
CLOUD_DIR="$MOUNT_BASE/cloud"

# 检查 /titan/space 和 /titan/cloud 是否已经挂载
if grep -qs "$SPACE_DIR" /proc/mounts && grep -qs "$CLOUD_DIR" /proc/mounts; then
    echo "Both $SPACE_DIR and $CLOUD_DIR are already mounted. do nothings."
else
    echo "One or both directories are not mounted."
    stop_cts
fi
```

:::

## 文件权限

PVE LXC 非特权容器的访问权限有一个为了安全的 idmap 机制， 想了解的话可以看看这里

[Unprivileged LXC containers](https://pve.proxmox.com/wiki/Unprivileged_LXC_containers)
[Proxmox LXC 挂载目录及权限设置](https://www.haiyun.me/archives/1419.html)

我嫌麻烦就全部 777 了， 狗掉了这个问题

`chmod -R 777 /titan`
