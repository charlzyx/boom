---
title: .87 LXC 下载鸡
lastUpdated: true
---

# 下载鸡 `192.168.6.87`

| 服务        | 端口  |
| ----------- | ----- |
| NAS 迅雷    | :2345 |
| qBittorrent | :8080 |

## /etc/pve/lxc/204.conf

```sh
arch: amd64
cmode: shell
cores: 2
features: nesting=1
hostname: bt
memory: 1024
mp0: /titan/space/downloads,mp=/downloads
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=EA:38:53:6D:54:B8,ip=192.168.6.87/24,type=veth
ostype: debian
rootfs: local-lvm:vm-208-disk-0,size=4G
swap: 0
unprivileged: 1
```

## 迅雷安装脚本

[cnk3x/xunlei](https://github.com/cnk3x/xunlei)

激活码： 迅雷牛通

```sh
docker run -d --name=xunlei --hostname=mynas --net=host -v /mnt/sdb1/xunlei:/xunlei/data -v /downloads:/xunlei/downloads --restart=unless-stopped --privileged cnk3x/xunlei:latest
```

## qBittorrent

[opensuse](https://software.opensuse.org//download.html?project=home%3Anikoneko%3Atest&package=qbittorrent-enhanced-nox)

```sh
echo 'deb http://download.opensuse.org/repositories/home:/nikoneko:/test/Debian_12/ /' | tee /etc/apt/sources.list.d/home:nikoneko:test.list
curl -fsSL https://download.opensuse.org/repositories/home:nikoneko:test/Debian_12/Release.key | gpg --dearmor | tee /etc/apt/trusted.gpg.d/home_nikoneko_test.gpg > /dev/null
apt update
apt install qbittorrent-enhanced-nox
```
