---
title: .? Home Assistant
lastUpdated: true
---

# Home Assistant `192.168.6.?`

| 服务           | 端口  |
| -------------- | ----- |
| Home Assistant | :8123 |

智能家居助手 Home Assistant

## 安装

一键安装 VM 虚拟机版本

```sh

bash -c "$(wget -qLO - https://github.com/tteck/Proxmox/raw/main/vm/haos-vm.sh)"
```

## 须知

1. VM 版本 ip 不能确定是因为他走的 DHCP， 还没找到设置静态 ip 的方法

> 静态 ip 教程 https://www.bilibili.com/read/cv17123823/

2. 安装后 PVE 管理后台会看到 内存占用在 90+% 不用慌， 看这个[大佬的解释](https://bbs.hassbian.com/forum.php?mod=redirect&goto=findpost&ptid=16631&pid=457583)
   > 正常，PVE 里的 HAOS 你给它多少内存它就会吃多少，永远会保证在 90%的占用。这个是虚拟机的占用，不是 ha 的占用。pve 里的虚拟机并不能 lxc 容器一样动态分配内存。
