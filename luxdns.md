# 要有光! 💡 LuxDNS Server 配置

我愿称之为最强的 **LuxDNS 分流&透明代理**
![LuxDNS 分流&透明代理 ](/assets/tproxy-split-by-dns.png)

> 参考: https://songchenwen.com/tproxy-split-by-dns
>
> 参考: https://www.xukecheng.tech/use-mosdns-and-adguardhome-to-build-your-own-dns
>
> 讨论: https://www.right.com.cn/forum/thread-8295979-1-1.html

## LXC 创建与基础配置

基础镜像: debain 11

### PVE 创建 Debain 11

> 控制台模式 shell

PVEID: 111
网卡: eth0:vmbr0
静态 IpV4: 192.168.6.1/24
网关: 192.168.6.2

### 开启 ssh

编辑 `/etc/ssh/sshd_conf`

修改 `#PermitRootLogin prohibit-password` -> `PermitRootLogin yes`

### 基础配置

参考 [这里](/pve-install)

### /etc/pve/lxc/111.conf

添加以下配置, 之后重启虚拟机

```bash
# 开启特权
unprivileged: 0
# 开启 tun
lxc.cgroup.devices.allow: c 10:200 rwm
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

## LUXDNS 端口

开启 ipv4/ipv6 转发

````bash
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding" >> /etc/sysctl.conf
sysctl -p
```

默认系统 systemd-resolve 占用了 53 端口, 通过以下命令停止并禁用自启动

`systemctl stop systemd-resolved && systemctl disable systemd-resolved`

- AdguardHome DNS: 53 默认 DNS 端口
- AdguardHome WEB UI: 3000
- MOSDNS: 3053
- clash dns: 1053
- clash tun: any:53

### 安装

#### AdguardHome

```bash
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v

````

### mosdns

下载与安装

```sh
## 下载
wget https://github.com/IrineSistiana/mosdns/releases/download/v5.1.3/mosdns-linux-amd64.zip
## 解压并安装到 /opt/mosdns
unzip mosdns-linux-amd64.zip -d /etc/mosdns && rm mosdns-linux-amd64.zip
## 作为系统服务安装
/etc/mosdns/mosdns service install
## 启动服务
systemctl start mosdns
## 开机启动
systemctl enable mosdns
```

准备科学规则

```bash
# https://www.xukecheng.tech/use-mosdns-and-adguardhome-to-build-your-own-dns
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/direct-list.txt > /etc/mosdns/rule/direct-list.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/apple-cn.txt > /etc/mosdns/rule/apple-cn.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/google-cn.txt > /etc/mosdns/rule/google-cn.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/proxy-list.txt > /etc/mosdns/rule/proxy-list.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/gfw.txt > /etc/mosdns/rule/gfw.txt && \
curl https://raw.githubusercontent.com/Hackl0us/GeoIP2-CN/release/CN-ip-cidr.txt > /etc/mosdns/rule/CN-ip-cidr.txt && \
# force-cn 是强制本地解析域名
touch /etc/mosdns/force-nocn.txt && \
# force-nocn 是强制非本地解析域名
touch /etc/mosdns/force-cn.txt && \
# 跟 /etc/hosts 是反着的 localhost.com 127.0.0.1
touch /etc/mosdns/hosts.txt && \
```

配置文件 `/opt/mosdns/config.yaml`

```yaml
log:
  level: debug
  production: true

# API 入口设置
api:
  http: "0.0.0.0:9080" # 在该地址启动 api 接口。
# 从其他配置文件载入 plugins 插件设置。
# include 的插件会比本配置文件中的插件先初始化。
include: []

plugins:
  - tag: "geosite-cn"
    type: domain_set
    args:
      files:
        - "./rule/direct-list.txt"
        - "./rule/apple-cn.txt"
        - "./rule/google-cn.txt"

  - tag: "geosite-nocn"
    type: domain_set
    args:
      files:
        - "./rule/proxy-list.txt"
        - "./rule/gfw.txt"

  - tag: "geoip-cn"
    type: ip_set
    args:
      files: "./rule/CN-ip-cidr.txt"

  - tag: "force-cn"
    type: domain_set
    args:
      files: "./rule/force-cn.txt"

  - tag: "force-nocn"
    type: domain_set
    args:
      files: "./rule/force-nocn.txt"

  - tag: "hosts"
    type: hosts
    args:
      files: "./rule/hosts.txt"

  - tag: "cache"
    type: "cache"
    args:
      size: 1024
      lazy_cache_ttl: 0
      dump_file: ./cache.dump
      dump_interval: 600

  # 转发至本地服务器的插件
  - tag: forward_local
    type: forward
    args:
      concurrent: 3
      upstreams:
        - addr: "https://dns.alidns.com/dns-query"
        - addr: "tls://dns.alidns.com"
        - addr: "https://1.12.12.12/dns-query"
        - addr: "https://120.53.53.53/dns-query"

  # 转发至远程服务器的插件
  - tag: forward_remote
    type: forward
    args:
      concurrent: 3
      upstreams:
        - addr: "https://cloudflare-dns.com/dns-query"
        - addr: "tls://1dot1dot1dot1.cloudflare-dns.com"
        - addr: "https://dns.google/dns-query"
        - addr: "tls://dns.google"

  - tag: "primary_forward"
    type: sequence
    args:
      - exec: $forward_local
      - exec: ttl 60-3600
      - matches:
          - "!resp_ip $geoip-cn"
          - "has_resp"
        exec: drop_resp

  - tag: "secondary_forward"
    type: sequence
    args:
      - exec: prefer_ipv4
      - exec: $forward_remote
      - matches:
          - rcode 2
        exec: $forward_local
      - exec: ttl 300-3600

  - tag: "final_forward"
    type: fallback
    args:
      primary: primary_forward
      secondary: secondary_forward
      threshold: 150
      always_standby: true

  - tag: main_sequence
    type: sequence
    args:
      - exec: $hosts
      - exec: query_summary hosts
      - matches: has_wanted_ans
        exec: accept

      - exec: $cache
      - exec: query_summary cache
      - matches: has_wanted_ans
        exec: accept

      - exec: query_summary qtype65
      - matches:
          - qtype 65
        #         exec: black_hole 127.0.0.1 ::1 0.0.0.0
        exec: reject 0

      - matches:
          - qname $geosite-cn
        exec: $forward_local
      - exec: query_summary geosite-cn
      - matches: has_wanted_ans
        exec: accept

      - matches:
          - qname $force-cn
        exec: $forward_local
      - exec: query_summary force-cn
      - matches: has_wanted_ans
        exec: accept

      - matches:
          - qname $geosite-nocn
        exec: $forward_remote
      - exec: query_summary geosite-nocn
      - matches: has_wanted_ans
        exec: accept

      - matches:
          - qname $force-nocn
        exec: $forward_remote
      - exec: query_summary force-nocn
      - matches: has_wanted_ans
        exec: accept

      - exec: $final_forward

  - tag: "udp_server"
    type: "udp_server"
    args:
      entry: main_sequence
      listen: 0.0.0.0:3053

  - tag: "tcp_server"
    type: "tcp_server"
    args:
      entry: main_sequence
      listen: 0.0.0.0:3053
```

### 安装 autoclash

这是一个整合了 clash-for-linx 和 tcclash 的脚本
能够自动下载订阅文件, 并下载(如果不存在)启动 tpclash

```bash
git clone https://github.com/charlzyx/autoclash.git /etc/autoclash
chmod +x /etc/autoclash/autoclash.sh
cd /etc/autoclash && ./autoclash.sh 你的订阅地址
```

## 我的配置

https://github.com/charlzyx/luxdns.conf
