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

# 函数：判断是否可以录制视频
function can_record() {
  local CURRENT_HOUR=$(date +"%H")
  local CURRENT_MINUTE=$(date +"%M")

  # 添加时间判断，从晚上 10:00 到早上 7:00 不执行脚本
  if [ "$CURRENT_HOUR" -ge 22 ] || [ "$CURRENT_HOUR" -lt 7 ]; then
    local current_time=$(date +"%Y-%m-%d %H:%M:%S")
    echo "$current_time - 脚本在晚上 10:00 到早上 7:00 不执行"
    exit 0
  fi

  # 检查/titan/space是否已经挂载
  if ! mountpoint -q /titan/space; then
    local current_time=$(date +"%Y-%m-%d %H:%M:%S")
    echo "$current_time - ERR: /titan/space 未挂载，脚本退出" >> /root/ff.log
    exit 1
  fi
}

# 函数：判断是否可以录制视频
function can_record_video() {
  local RTSP_URL="$1"
  local MAX_RETRIES=10
  local retry=0

  while [ $retry -lt $MAX_RETRIES ]; do
    if ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$RTSP_URL" >/dev/null 2>&1; then
      echo "RTSP链接可用"
      return 0
    else
      local current_time=$(date +"%Y-%m-%d %H:%M:%S")
      echo "$current_time - RTSP链接不可用，等待3秒后重试（尝试 $((retry + 1)) / $MAX_RETRIES）" >> /root/ff.log
      sleep 3
      retry=$((retry + 1))
    fi
  done

  # 如果最终链接仍然不可用，则退出脚本
  local current_time=$(date +"%Y-%m-%d %H:%M:%S")
  echo "$current_time - ERR: RTSP链接不可用，脚本退出" >> /root/ff.log
  exit 1
}

function run_script() {
  # 调用can_record函数
  can_record

  # 获取当前日期（YYYYMMDD）
  local CURRENT_DATE=$(date +"%Y%m%d")
  # 创建当天日期的文件夹，如果不存在
  local OUTPUT_DIR="/titan/space/cctv/$CURRENT_DATE"
  if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir -p "$OUTPUT_DIR"
  fi


  # 判断是否可以录制视频
  local RTSP_URL="rtsp://admin:NSRDLG@192.168.6.113:554/h264/ch1/main/av_stream"
  can_record_video "$RTSP_URL"

  # 执行FFmpeg录制，如果出错，等待一段时间后重试
  while true; do
    # 获取当前小时和分钟
    local CURRENT_HOUR=$(date +"%H")
    local CURRENT_MINUTE=$(date +"%M")
    # 生成输出文件名，格式为/titan/space/videos/YYYYMMDD/HHMM.mp4
    local CURRENT_TIME=$(date +"%H%M")
    local OUTPUT_FILE="$OUTPUT_DIR/$CURRENT_TIME.mp4"

    # 计算剩余分钟数并转换为秒
    local REMAINING_MINUTES=$((30 - CURRENT_MINUTE % 30))
    local RECORDING_DURATION=$((REMAINING_MINUTES * 60))

    local current_time=$(date +"%Y-%m-%d %H:%M:%S")
    echo "$current_time - 即将录制: 时长 $RECORDING_DURATION 秒的视频" >> /root/ff.log

    if ffmpeg -hwaccel qsv -i "$RTSP_URL" -c:v copy -t "$RECORDING_DURATION" "$OUTPUT_FILE" >/dev/null 2>&1; then
      echo "$current_time - OK: 视频已录制至 $OUTPUT_FILE，时长 $RECORDING_DURATION 秒" >> /root/ff.log
      break
    else
      echo "$current_time - ERR: FFmpeg执行出错，等待3秒后重试" >> /root/ff.log
      sleep 3
    fi
  done
}

run_script


```
