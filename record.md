---
title: .33  RTSP 监控视频流录制
lastUpdated: true
---

# RTSP 监控视频流录制 `192.168.6.33`

这是使用 corbtab 定时跑的一个脚本, 在脚本中调用了 ffmpeg 录制视频并保存;
使用 Debain 系统， 开启特权和显卡权限

# /etc/pve/lxc/233.conf

```sh
arch: amd64
cmode: shell
cores: 2
features: nesting=1
hostname: ffmpeg
memory: 256
mp0: /titan/space,mp=/titan/space
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=A6:20:99:78:77:40,ip=192.168.6.33/24,type=veth
onboot: 1
ostype: debian
rootfs: local-lvm:vm-233-disk-0,size=4G
swap: 0
unprivileged: 0
lxc.cgroup2.devices.allow: c 226:0 rwm
lxc.cgroup2.devices.allow: c 226:128 rwm
lxc.mount.entry: /dev/dri/card0 dev/dri/card0 none bind,optional,create=file
lxc.mount.entry: /dev/dri/renderD128 dev/dri/renderD128 none bind,optional,create=file

```

## 基础依赖

```sh
# 闭源显卡驱动安装
apt install intel-media-va-driver-non-free
# 核心库 ffmpeg
apt install ffmpeg
```

## 定时录制脚本

```sh
#!/bin/bash

# 获取当前小时和分钟
CURRENT_HOUR=$(date +\%H)
CURRENT_MINUTE=$(date +\%M)

# 检查是否在22:00到07:00之间，如果是则不录制
if [ "$CURRENT_HOUR" -ge 22 ] || [ "$CURRENT_HOUR" -lt 7 ]; then
  echo "现在是休息时间，不进行录制"
  exit 0
fi

# 获取当前日期（YYYYMMDD）
CURRENT_DATE=$(date +\%Y\%m\%d)
# 生成输出文件名，格式为/titan/space/videos/YYYYMMDD/HHMM.mp4
CURRENT_TIME=$(date +\%H\%M)

# 创建当天日期的文件夹，如果不存在
OUTPUT_DIR="/titan/space/cctv/$CURRENT_DATE"
if [ ! -d "$OUTPUT_DIR" ]; then
  mkdir -p "$OUTPUT_DIR"
fi

OUTPUT_FILE="$OUTPUT_DIR/$CURRENT_TIME.mp4"

# 检查/titan/space是否已经挂载
if ! mountpoint -q /titan/space; then
  echo "ERR: $OUTPUT_DIR/$CURRENT_TIME /titan/space 未挂载，脚本退出" >> /root/record_video.log
  exit 1
fi

# 这是萤石 C6C 的格式 测试RTSP链接的连通性，最多尝试10次
RTSP_URL="rtsp://用户名:密码@IP:554/h265/ch1/main/av_stream"
MAX_RETRIES=10
retry=0
while [ $retry -lt $MAX_RETRIES ]; do
  if ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$RTSP_URL" >/dev/null 2>&1; then
    echo "RTSP链接可用"
    break
  else
    echo "RTSP链接不可用，等待3秒后重试（尝试 $((retry + 1)) / $MAX_RETRIES）" >> /root/record_video.log
    sleep 2
    retry=$((retry + 1))
  fi
done

# 如果最终链接仍然不可用，则退出脚本
if [ $retry -eq $MAX_RETRIES ]; then
  echo "ERR: $OUTPUT_DIR/$CURRENT_TIME RTSP链接不可用，脚本退出" >> /root/record_video.log
  exit 1
fi

# 使用ffmpeg录制视频
ffmpeg -i "$RTSP_URL" -c:v copy -t 1800 "$OUTPUT_FILE"

echo "OK: 视频已录制至 $OUTPUT_FILE" >> /root/record_video.log

# 使用crontab每30分钟执行一次脚本
# 编辑crontab：crontab -e
# 添加以下行（注意替换脚本路径为实际路径）
# */30 * * * * /bin/bash /root/record_video.sh

# 退出脚本
exit 0

```
