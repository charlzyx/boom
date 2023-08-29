---
title: .4 LXC 电视鸡
lastUpdated: true
---

# 电视鸡 `192.168.6.4`

| 服务     | 端口  |
| -------- | ----- |
| Jellyfin | :8096 |

主要是 jellyfin 的安装,使用外挂硬盘, 我的显卡是 Intel 核显

## ## /etc/pve/lxc/204.conf

```sh
arch: amd64
cmode: shell
cores: 4
features: nesting=1
hostname: tv
memory: 2048
mp0: /titan/space/media,mp=/media
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=7A:82:AC:72:7E:DA,ip=192.168.6.4/24,type=veth
ostype: debian
rootfs: local-lvm:vm-204-disk-1,size=10G
swap: 0
# 开启特权和下面的配置是为了显卡直通
unprivileged: 0
lxc.cgroup.devices.allow: a
lxc.cgroup2.devices.allow: c 226:0 rwm
lxc.cgroup2.devices.allow: c 226:128 rwm
lxc.mount.entry: /dev/dri/card0 dev/dri/card0 none bind,optional,create=file
lxc.mount.entry: /dev/dri/renderD128 dev/dri/renderD128 none bind,optional,create=file
```

## 安装脚本

> [官方文档](https://jellyfin.org/docs/general/installation/linux#debian)

```sh
curl https://repo.jellyfin.org/install-debuntu.sh |  bash
```

## 检查硬解支持

查看显卡是否存在

```sh
# ls -alh /dev/dri
total 0
drwxr-xr-x 2 root root        80 Aug 28 09:09 .
drwxr-xr-x 8 root root       520 Aug 28 09:09 ..
crw-rw---- 1 root video 226,   0 Aug 27 07:31 card0
crw-rw---- 1 root kvm   226, 128 Aug 27 07:31 renderD128
```

查看 vainfo

```sh
# /usr/lib/jellyfin-ffmpeg/vainfo
Trying display: drm
libva info: VA-API version 1.19.0
libva info: Trying to open /usr/lib/jellyfin-ffmpeg/lib/dri/iHD_drv_video.so
libva info: Found init function __vaDriverInit_1_19
libva info: va_openDriver() returns 0
vainfo: VA-API version: 1.19 (libva 2.19.0)
vainfo: Driver version: Intel iHD driver for Intel(R) Gen Graphics - 23.3.0 (919d398)
vainfo: Supported profile and entrypoints
      VAProfileNone                   :	VAEntrypointVideoProc
      VAProfileNone                   :	VAEntrypointStats
      VAProfileMPEG2Simple            :	VAEntrypointVLD
      VAProfileMPEG2Main              :	VAEntrypointVLD
      VAProfileH264Main               :	VAEntrypointVLD
      VAProfileH264Main               :	VAEntrypointEncSliceLP
      VAProfileH264High               :	VAEntrypointVLD
      VAProfileH264High               :	VAEntrypointEncSliceLP
      VAProfileVC1Simple              :	VAEntrypointVLD
      VAProfileVC1Main                :	VAEntrypointVLD
      VAProfileVC1Advanced            :	VAEntrypointVLD
      VAProfileJPEGBaseline           :	VAEntrypointVLD
      VAProfileJPEGBaseline           :	VAEntrypointEncPicture
      VAProfileH264ConstrainedBaseline:	VAEntrypointVLD
      VAProfileH264ConstrainedBaseline:	VAEntrypointEncSliceLP
      VAProfileVP8Version0_3          :	VAEntrypointVLD
      VAProfileHEVCMain               :	VAEntrypointVLD
      VAProfileHEVCMain               :	VAEntrypointEncSliceLP
      VAProfileHEVCMain10             :	VAEntrypointVLD
      VAProfileHEVCMain10             :	VAEntrypointEncSliceLP
      VAProfileVP9Profile0            :	VAEntrypointVLD
      VAProfileVP9Profile1            :	VAEntrypointVLD
      VAProfileVP9Profile2            :	VAEntrypointVLD
      VAProfileVP9Profile3            :	VAEntrypointVLD
      VAProfileHEVCMain422_10         :	VAEntrypointVLD
      VAProfileHEVCMain444            :	VAEntrypointVLD
      VAProfileHEVCMain444            :	VAEntrypointEncSliceLP
      VAProfileHEVCMain444_10         :	VAEntrypointVLD
      VAProfileHEVCMain444_10         :	VAEntrypointEncSliceLP
```

## 安装中文字体

> 不然生成媒体库缩略图有方块

```sh
apt install fonts-noto-cjk-extra
```

## 配置硬解与中文字幕字体

![硬件解码](/assets/tv/hdcode.png)
![配置中文字体](/assets/tv/jf.png)
