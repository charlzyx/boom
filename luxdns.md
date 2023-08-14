# 要有光! 💡 LuxDNS Server 配置

我愿称之为最强的 **LuxDNS 分流&透明代理**
![LuxDNS 分流&透明代理 ](/assets/tproxy-split-by-dns.png)

> 参考: https://songchenwen.com/tproxy-split-by-dns
>
> 参考: https://www.xukecheng.tech/use-mosdns-and-adguardhome-to-build-your-own-dns
>
> 讨论: https://www.right.com.cn/forum/thread-8295979-1-1.html

## DNS 流向设计

```sh
局域网设备
  -> WIFI 硬路由
  -> iKuai (192.168.6.2)
  -> LuxDNS(192.168.6.1)
     -> 53: AdGuradHome (劫持 *.home.com -> 192.168.6.6)
        -> 3053: mosdns
           -> (if cn) 公共DNS
           -> (not cn) 1053 clash fake-ip dns
```

## 分流效果与 DNS 劫持(home.com)

![google](/assets/sgoogle.png)
![baidu](/assets/sbaidu.png)
![home](/assets/shome.png)

## LXC 创建与基础配置 Debain 11

### PVE 创建 Debain 11

> 控制台模式 shell

PVEID: 111
网卡: eth0:vmbr0
静态 IpV4: 192.168.6.1/24
网关: 192.168.6.2

### 基础配置

参考 [这里](/pve-install)

### /etc/pve/lxc/[CT 容器 ID].conf

添加以下配置, 之后重启虚拟机

```bash
# 开启特权
unprivileged: 0
# 开启 tun clash 需要
lxc.cgroup.devices.allow: c 10:200 rwm
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

## 开启 ipv4/ipv6 转发

```bash
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding" >> /etc/sysctl.conf
sysctl -p
```

## DNS 设计与端口说明

默认系统 systemd-resolve 占用了 53 端口, 通过以下命令停止并禁用自启动

`systemctl stop systemd-resolved && systemctl disable systemd-resolved`

- AdguardHome DNS: 53 默认 DNS 端口
- AdguardHome WEB UI: 3000
- MOSDNS: 3053
- clash dns: 1053

### 安装 AdguardHome

```bash
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v

```

#### /opt/AdguardHome.yaml

```yaml
http:
  address: 0.0.0.0:3000
  session_ttl: 720h
users:
  - name: root
    password: $2a$10$tcAjZYmVhq6fRg.pmR3you42fJao3qrgetf9mCxGC8D/2VgHAwyLm
auth_attempts: 10
block_auth_min: 1
http_proxy: ""
language: zh-cn
theme: auto
debug_pprof: false
dns:
  bind_hosts:
    - 0.0.0.0
  port: 53
  anonymize_client_ip: false
  protection_enabled: true
  blocking_mode: default
  blocking_ipv4: ""
  blocking_ipv6: ""
  blocked_response_ttl: 10
  protection_disabled_until: null
  parental_block_host: family-block.dns.adguard.com
  safebrowsing_block_host: standard-block.dns.adguard.com
  ratelimit: 0
  ratelimit_whitelist: []
  refuse_any: true
  upstream_dns:
    - 127.0.0.1:3053
  upstream_dns_file: ""
  bootstrap_dns:
    - 223.6.6.6
    - 9.9.9.9
    - 2620:fe::10
    - 2620:fe::fe:10
  all_servers: false
  fastest_addr: false
  fastest_timeout: 1s
  allowed_clients: []
  disallowed_clients: []
  blocked_hosts:
    - version.bind
    - id.server
    - hostname.bind
  trusted_proxies:
    - 127.0.0.0/8
    - ::1/128
  cache_size: 10240000
  cache_ttl_min: 60
  cache_ttl_max: 600
  cache_optimistic: true
  bogus_nxdomain: []
  aaaa_disabled: false
  enable_dnssec: false
  edns_client_subnet:
    custom_ip: ""
    enabled: false
    use_custom: false
  max_goroutines: 300
  handle_ddr: true
  ipset: []
  ipset_file: ""
  bootstrap_prefer_ipv6: false
  filtering_enabled: true
  filters_update_interval: 24
  parental_enabled: false
  safebrowsing_enabled: false
  safebrowsing_cache_size: 1048576
  safesearch_cache_size: 1048576
  parental_cache_size: 1048576
  cache_time: 30
  safe_search:
    enabled: false
    bing: true
    duckduckgo: true
    google: true
    pixabay: true
    yandex: true
    youtube: true
  rewrites:
    - domain: "*.home.com"
      answer: 192.168.6.6
  blocked_services:
    schedule:
      time_zone: Local
    ids: []
  upstream_timeout: 10s
  private_networks: []
  use_private_ptr_resolvers: true
  local_ptr_upstreams: []
  use_dns64: false
  dns64_prefixes: []
  serve_http3: false
  use_http3_upstreams: false
tls:
  enabled: false
  server_name: ""
  force_https: false
  port_https: 443
  port_dns_over_tls: 853
  port_dns_over_quic: 853
  port_dnscrypt: 0
  dnscrypt_config_file: ""
  allow_unencrypted_doh: false
  certificate_chain: ""
  private_key: ""
  certificate_path: ""
  private_key_path: ""
  strict_sni_check: false
querylog:
  ignored: []
  interval: 2160h
  size_memory: 1000
  enabled: true
  file_enabled: true
statistics:
  ignored: []
  interval: 24h
  enabled: true
filters:
  - enabled: false
    url: https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt
    name: AdGuard DNS filter
    id: 1
  - enabled: false
    url: https://adguardteam.github.io/HostlistsRegistry/assets/filter_2.txt
    name: AdAway Default Blocklist
    id: 2
  - enabled: false
    url: https://raw.githubusercontent.com/Cats-Team/AdRules/main/hosts.txt
    name: Cats-Team/AdRules/Hosts
    id: 1691654156
  - enabled: false
    url: https://raw.githubusercontent.com/Cats-Team/AdRules/main/adblock_lite.txt
    name: AdRules AdBlock List Lite
    id: 1691654157
  - enabled: true
    url: https://cdn.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-easylist.txt
    name: anti-AD
    id: 1691829090
whitelist_filters: []
user_rules: []
dhcp:
  enabled: false
  interface_name: ""
  local_domain_name: lan
  dhcpv4:
    gateway_ip: ""
    subnet_mask: ""
    range_start: ""
    range_end: ""
    lease_duration: 86400
    icmp_timeout_msec: 1000
    options: []
  dhcpv6:
    range_start: ""
    lease_duration: 86400
    ra_slaac_only: false
    ra_allow_slaac: false
clients:
  runtime_sources:
    whois: true
    arp: true
    rdns: true
    dhcp: true
    hosts: true
  persistent: []
log:
  file: ""
  max_backups: 0
  max_size: 100
  max_age: 3
  compress: false
  local_time: false
  verbose: false
os:
  group: ""
  user: ""
  rlimit_nofile: 0
schema_version: 24
```

### 安装 mosdns v5

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

#### 准备科学分流规则

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

#### 准备配置文件 `/opt/mosdns/config.yaml`

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

### 我的配置参考

https://github.com/charlzyx/luxdns.conf
