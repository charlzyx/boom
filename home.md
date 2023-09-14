---
title: .6 宿主机
lastUpdated: true
---

# 宿主机 `192.168.6.6`

| 服务 | 端口 |
| ---- | ---- |
| -    | -    |

宿主机主要处理了重要的外挂硬盘的自动挂载与对应 LXC 的启停管理。

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
ACTION=="remove", RUN+="/root/scripts/checklxc.sh"
```

::: details `/root/titan/checklxc.sh` 外接磁盘自动挂载脚本

```bash
#!/bin/bash

set -ex


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

# 检查 /titan/space 和 /titan/cloud 是否已经挂载
if grep -qs "$SPACE_DIR" /proc/mounts && grep -qs "$CLOUD_DIR" /proc/mounts; then
    echo "Both $SPACE_DIR and $CLOUD_DIR are already mounted."
    start_cts
else
    stop_cts
    echo "One or both directories are not mounted."
fi

```

:::

## 文件权限

PVE LXC 非特权容器的访问权限有一个为了安全的 idmap 机制， 想了解的话可以看看这里

[Unprivileged LXC containers](https://pve.proxmox.com/wiki/Unprivileged_LXC_containers)
[Proxmox LXC 挂载目录及权限设置](https://www.haiyun.me/archives/1419.html)

我嫌麻烦就全部 777 了， 甚至还写了个定时脚本来狗掉这个问题

`root@pve:~/scripts # cat keep777.sh`

```sh
chmod -R 777 /titan/space
chmod -R 777 /titan/cloud
```

## 添加定时任务

`crontab -e`

```sh
# 每5分钟更新一下外挂硬盘权限
*/5 * * * * /root/scripts/keep777.sh
# 每2分钟检查一下磁盘, 因为我们已经在脚本中做了检测, 所以频率无所谓
*/2 * * * * /root/scripts/checklxc.sh
```

## 从这里往下都是看心情非必需了

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
