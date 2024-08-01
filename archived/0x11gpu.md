---
title: .123  RTSP 监控视频流录制
lastUpdated: true
---

# RTSP 监控视频流录制 `192.168.6.123`

这是使用 corbtab 定时跑的一个脚本, 在脚本中调用了 ffmpeg 录制视频并保存;

# /etc/pve/lxc/123.conf

```sh
arch: amd64
cmode: shell
cores: 4
hostname: gpu
memory: 1024
mp0: /titan/space,mp=/titan/space
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=36:36:1C:8E:F2:4D,ip=192.168.6.23/24,ip6=auto,type=veth
onboot: 0
ostype: alpine
rootfs: local-lvm:vm-123-disk-0,size=4G
swap: 0
lxc.cgroup2.devices.allow: c 226:0 rwm
lxc.cgroup2.devices.allow: c 226:128 rwm
lxc.mount.entry: /dev/dri/card0 dev/dri/card0 none bind,optional,create=file
lxc.mount.entry: /dev/dri/renderD128 dev/dri/renderD128 none bind,optional,create=file

```

## 基础依赖

```sh
# 显卡驱动安装
apk add intel-media-driver
# 核心库 ffmpeg
apk add ffmpeg
```

## 定时录制脚本 `/root/cctv.sh`

注意替换 `local RTSP_URL="rtsp://admin:PASSWD@192.168.6.113:554/h264/ch1/main/av_stream"` 部分为你自己的 RTSP 用户密码

同时, 需要将摄像头 IP 地址 在 iKuai 后台设置为固定, url 格式参考摄像头说明书

我这个是萤石 C6C

```sh
#!/bin/zsh

set -x
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
    echo "$current_time - ERR: /titan/space 未挂载，脚本退出" >> /root/cctv.log
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
      echo "$current_time - RTSP链接不可用，等待3秒后重试（尝试 $((retry + 1)) / $MAX_RETRIES）" >> /root/cctv.log
      sleep 3
      retry=$((retry + 1))
    fi
  done

  # 如果最终链接仍然不可用，则退出脚本
  local current_time=$(date +"%Y-%m-%d %H:%M:%S")
  echo "$current_time - ERR: RTSP链接不可用，脚本退出" >> /root/cctv.log
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
  local RTSP_URL="rtsp://admin:PASSWD@192.168.6.113:554/h264/ch1/main/av_stream"
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
    echo "$current_time - 即将录制: 时长 $RECORDING_DURATION 秒的视频" >> /root/cctv.log

    if ffmpeg -hwaccel qsv -i "$RTSP_URL" -c:v copy -t "$RECORDING_DURATION" "$OUTPUT_FILE" >/dev/null 2>&1; then
      echo "$current_time - OK: 视频已录制至 $OUTPUT_FILE，时长 $RECORDING_DURATION 秒" >> /root/cctv.log
      break
    else
      echo "$current_time - ERR: FFmpeg执行出错，等待3秒后重试" >> /root/cctv.log
      sleep 3
    fi
  done
}

run_script


```

## 添加定时脚本

`crontab -e`

```sh
# 每30分钟执行一次录制脚本
*/30  * * * * /root/cctv.sh
```
