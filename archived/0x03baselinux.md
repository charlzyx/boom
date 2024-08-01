---
title: Linux 基础
lastUpdated: true
---

# Linux 基础与常用命令

## 发行版

::: details Linux 发行版 --维基百科

Linux 发行版（英语：Linux distribution 或 distro，也被叫做 GNU/Linux 发行版），为一般用户预先集成好的 Linux 操作系统及各种应用软件。一般用户不需要重新编译，在直接安装之后，只需要小幅度更改设置就可以使用，通常以软件包管理系统来进行应用软件的管理。Linux 发行版通常包含了包括桌面环境、办公包、媒体播放器、数据库等应用软件。这些操作系统通常由 Linux 内核、以及来自 GNU 计划的大量的函式库，和基于 X Window 或者 Wayland 的图形界面。有些发行版考虑到容量大小而没有预装 X Window，而使用更加轻量级的软件，如：BusyBox、musl 或 uClibc-ng。现在有超过 300 个 Linux 发行版（Linux 发行版列表）。大部分都正处于活跃的开发中，不断地改进。

由于大多数软件包是自由软件和开源软件，所以 Linux 发行版的形式多种多样——从功能齐全的桌面系统以及服务器系统到小型系统（通常在嵌入式设备，或者启动软盘）。除了一些定制软件（如安装和配置工具），发行版通常只是将特定的应用软件安装在一堆函式库和内核上，以满足特定用户的需求。

这些发行版可以分为商业发行版，比如 Ubuntu（Canonical 公司）、Red Hat Enterprise Linux、SUSE Linux Enterpise；和社区发行版，它们由自由软件社区提供支持，如 Debian、Fedora、Arch、openSUSE 和 Gentoo。

:::

在我们的场景中: PVE 8.0 使用的是 `Debain 12` 发行版 ,而在容器中, 则使用更加精简节能的 `Alpine Linux`

## Shell

不同于 Windows/Mac, 大多时候, linux 系统要面对的都是一个文本交互的大黑框, 称之为 shell 应用,
在不同的发行版中, 默认 shell 略有不同, 比如我们要用到的

| 发行版 | SHELL |
| ------ | ----- |
| Debain | bash  |
| Alpine | ash   |

他们的区别不算太大, 但是为了方便和~~好看~~, 我们仍然在后续的文档中, 统一替换为 zsh

## 包管理

在不同的发行版中, 包管理软件不尽相同, 在文末的引用中会有详尽的解释, 在此我们仅对常用命令给出解释

| Debain (apt)       | Alpine (apk)   | 说明         |
| ------------------ | -------------- | ------------ |
| apt update         | apk update     | 更新软件源   |
| apt install 软件名 | apk add 软件名 | 安装指定软件 |
| apt remove 软件名  | apk del 软件名 | 删除指定软件 |
| apt autoremove     | -              | 清理无用依赖 |

## 源 repo

不管是哪个发行版, 在安装软件的时候, 都需要在软件仓库服务器上寻找, 这个存放软件的服务器称为为源; 在特殊的网络环境下, 很多时候我们需要替换为国内源来大大加快包的安装速度.

这里是清华大学的软件仓库, 指南写的简单明了, 我就不赘述了

- [Debian 软件仓库镜像使用帮助](https://mirrors.tuna.tsinghua.edu.cn/help/debian/)
- [Alpine 镜像使用帮助](https://mirrors.tuna.tsinghua.edu.cn/help/alpine/)

## init 系统

大多数服务, 特别是我们的应用服务, 都是希望它能够开机自启, 这个时候就把对应的软件或者脚本, 作为服务运行, 服务的管理称之为 init 系统, 同样的, 我们在这里仍然只列出来简单的常用命令, 以 `nginx` 为例

| Debain (systemd)                                | Alpine (openrc)       | 说明               |
| ----------------------------------------------- | --------------------- | ------------------ |
| /etc/systemd/sytemd/ <br/> /lib/systemd/system/ | /etc/init.d/          | 服务配置文件目录   |
| systemctl start 服务                            | rc-service 服务 start | 启动指定服务       |
| systemctl status 服务                           | rc-status             | 查看服务状态       |
| systemctl enable 服务                           | rc-update add 服务    | 设定服务为开机启动 |

## 网络相关

网络相关的文件有几个比较重要 ,这个在两个系统中是通用的

| 命令                         | 解释                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `ip addr`                    | 查看当前网络接口配置                                                                             |
| `cat /etc/network/interface` | 查看网络接口配置文件, 虽然这里也能修改, 但可能不会同步到 pve 配置文件, 还是推荐在 PVE GUI 中修改 |
| `cat /etc/sysctl.conf`       | 网络流量转发会经常用到这里的配置                                                                 |

## PVE 宿主机相关

> 虚拟机 VS CT: 虚拟机是 使用 qemu 运行的虚拟机, CT 是使用 LXC(Linux Container) 技术执行的容器

> CT 模版/CT 容器的 CT 实际就是 LXC (Linux Container), 在本指南中 LXC 等价于 PVE 中的 CT

| 目录                                     | 说明              |
| ---------------------------------------- | ----------------- |
| `/etc/pve/lxc`/id.conf                   | 所有 LXC 容器配置 |
| `/etc/pve/nodes/pve/qemu-server`/id.conf | 虚拟机配置        |

常用命令

| 命令              | 说明                     |
| ----------------- | ------------------------ |
| `pct list `       | 查看运行中的容器         |
| `pct console 102` | 命令行进入指定容器 Shell |

## 小结

有了这些基础之后, 我们应该能够开始后续的配置了

## 参考文档

- [Alpine Linux 使用](https://agou-ops.cn/myStudyNote/Linux_Tools/Alpine%20Linux%E4%BD%BF%E7%94%A8.html)
- [玩 Docker 必备：Alpine Linux 常用命令及用法整理](https://www.moewah.com/archives/2198.html)
- [Linux 的小伙伴 systemd 详解#systemctl 基本用法](https://blog.k8s.li/systemd.html#systemctl-%E5%9F%BA%E6%9C%AC%E7%94%A8%E6%B3%95)
