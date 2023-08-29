---
title: .2 LXC Clash 的安装与配置
lastUpdated: true
---

# clash 路由 DNS `192.168.6.2`

clash 旁路由使用了 Debain 12 容器作为基础， 通过 AdGuardHome/mosdns/ShellClash 搭配使用， 改造为一个机智的科学路由

| 服务        | 端口     | 说明                                                                |
| ----------- | -------- | ------------------------------------------------------------------- |
| AdGuardHome | :53      | 虽然他时常用来做广告拦截用， 但是作为一个带 GUI 的 DNS 服务器也不错 |
| mosdns      | :3053    | 丝滑~ 区分域名的归属地， 来智能判断去查询哪个公共服务器             |
| clash       | :1053    | 科学核心                                                            |
| yacd        | :9999    | 看板 api                                                            |
| yacd        | :9999/ui | 看板 UI                                                             |

DNS 查询流程

```sh
  -> clash(192.168.6.2)
     -> 53: AdGuradHome
        -> 3053: mosdns
           -> (if cn) 公共DNS
           -> (not cn) 1053 clash fake-ip dns
```

![td](/assets/clash/tproxy-split-by-dns.png){data-zoomable}

## /etc/pve/lxc/102.conf

```sh
arch: amd64
cmode: shell
cores: 4
features: nesting=1
hostname: clash
memory: 1024
nameserver: 223.6.6.6
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=82:6B:88:1C:F0:E9,ip=192.168.6.2/24,ip6=auto,type=veth
onboot: 1
ostype: debian
rootfs: local-lvm:vm-202-disk-0,size=8G
swap: 0
# 开启特权与 tun 权限，clash tun 模式会需要
unprivileged: 0
lxc.cgroup.devices.allow: c 10:200 rwm
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

## 准备模版

数据中心 - pve -> local - CT 模板 -> 模板 -> Debain 12 -> 下载

![dltpl](/assets/clash/dltpl.png){data-zoomable}

## 创建 CT

> 记得去掉无特权容器勾选框

模板选择刚才下载的 Debain 12, 推荐配置

- 磁盘 2G
- CPU 2 CORE
- 内存 512/0

**重要： 网络按照图示设置 IP: 192.168.6.2/24 网关: 192.168.6.1, 防火墙不要**

![c1](/assets/clash/c1.png){data-zoomable}
![c2](/assets/clash/c2.png){data-zoomable}

需要注意的点就这些, 安装完成之后启动

### 基础配置

参考 [安装与配置](/install) 中的安装后配置, 完成基础软件安装

## 开启 ipv4/ipv6 流量转发

这是 Debain 系统成为路由器的核心， 还有一些其他调优参数， 后续再讲， 暂时不用关心

```bash
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding" >> /etc/sysctl.conf
# 使修改生效
sysctl -p
```

## 科学核心 ShellClash

一键安装脚本

```
export url='https://fastly.jsdelivr.net/gh/juewuy/ShellClash@master' && wget -q --no-check-certificate -O /tmp/install.sh $url/install.sh  && bash /tmp/install.sh && source /etc/profile &> /dev/null
```

成功之后输入 `clash` 命令按照菜单指示操作就行, 先设置为本机代理，安装好后面两个软件， 结尾会有一个修正 dns 配置

## 广告拦截 AdGuardHome

一键安装脚本

```sh
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v
```

安装成功后可以通过 `192.168.6.2:3000` （默认） 打开浏览器进行配置， 也可以直接编辑 `/opt/AdGuardHome/AdGuardHome.yaml` 编辑配置

## mosdns

这里我使用的是 V5 版本，使用手动安装的方式

1. 下载二进制文件

```sh
# 创建 /etc/mosdns 工作目录
mkdir -p /etc/mosdns && cd /etc/mosdns
# https://github.com/IrineSistiana/mosdns/releases
wget https://github.com/IrineSistiana/mosdns/releases/download/v5.1.3/mosdns-linux-amd64.zip
unzip mosdns-linux-amd64.zip
```

2. 准备科学规则

```sh
mkdir -p /etc/mosdns/rule

curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/direct-list.txt > /etc/mosdns/rule/direct-list.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/apple-cn.txt > /etc/mosdns/rule/apple-cn.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/google-cn.txt > /etc/mosdns/rule/google-cn.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/proxy-list.txt > /etc/mosdns/rule/proxy-list.txt && \
curl https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/gfw.txt > /etc/mosdns/rule/gfw.txt && \
curl https://raw.githubusercontent.com/Hackl0us/GeoIP2-CN/release/CN-ip-cidr.txt > /etc/mosdns/rule/CN-ip-cidr.txt && \
touch /etc/mosdns/rule/force-nocn.txt && \
touch /etc/mosdns/rule/hosts.txt && \
touch /etc/mosdns/rule/fake-ip-cidr.txt && \
touch /etc/mosdns/rule/force-cn.txt

```

3. mosdns 配置

:::details /etc/mosdns/config.yaml

```sh
log:
  level: error # debug
  #file: "./log/mosdns.log"      # 记录日志到文件。
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

  - tag: "fake-ip-clash"
    type: ip_set
    args:
      files: "./rule/fake-ip-cidr.txt"

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
      concurrent: 2
      upstreams:
        - addr: "https://dns.alidns.com/dns-query"
        - addr: "tls://dns.alidns.com"
        #- addr: "https://1.12.12.12/dns-query"
        #- addr: "https://120.53.53.53/dns-query"

  # 转发至远程服务器的插件
  - tag: forward_remote
    type: forward
    args:
      concurrent: 2
      upstreams:
        - addr: 127.0.0.1:1053
        # - addr: "https://cloudflare-dns.com/dns-query"
        # - addr: "tls://1dot1dot1dot1.cloudflare-dns.com"
        # - addr: "https://dns.google/dns-query"
        # - addr: "tls://dns.google"

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

:::

4. 将 mosdns 设置为系统服务并开机启动

创建文件 `/etc/systemd/system/mosdns.service` 内容如下

```sh
[Unit]
Description=A DNS forwarder
ConditionFileIsExecutable=/etc/mosdns/mosdns

[Service]
StartLimitInterval=5
StartLimitBurst=10
ExecStart=/etc/mosdns/mosdns "start" "--as-service" "-d" "/etc/mosdns"
Restart=always
RestartSec=120
EnvironmentFile=-/etc/sysconfig/mosdns

[Install]
WantedBy=multi-user.target
```

之后执行以下命令

```sh
# 加载新增配置
systemctl daemon-reload
# 设置 mosdns 开机启动
systemctl enable mosdns
# 启动 mosdns 服务
systemctl start mosdns
```

## 最终配置

### clash 一级菜单

```sh
-----------------------------------------------
 1 启动/重启clash服务
 2 clash功能设置
 3 停止clash服务
 4 clash启动设置
 5 设置定时任务
 6 导入配置文件
 7 clash进阶设置
 8 其他工具
 9 更新/卸载
```

### `clash 2` clash 功能设置

```sh
DNS运行模式：	fake-ip
 3 跳过本地证书验证：	已开启   ————解决节点证书验证错误
 4 只代理常用端口： 	未开启   ————用于过滤P2P流量
 5 过滤局域网设备：	未开启   ————使用黑/白名单进行过滤
 6 设置本机代理服务:	未开启   ————使本机流量经过clash内核
 7 屏蔽QUIC流量:	未开启   ————优化视频性能
```

### `clash 7` clash 进阶设置

```sh
欢迎使用进阶模式菜单：
如您并不了解clash的运行机制，请勿更改本页面功能！
-----------------------------------------------
 1 ipv6相关
 3 配置公网及局域网防火墙
 4 启用域名嗅探:	已启用	————用于流媒体及防DNS污染
 5 启用节点绕过:	已启用	————用于防止多设备多重流量
 6 配置内置DNS服务	已禁用
```

其他保持默认即可

## 恭喜 🎉

这时候可以将我们刚才 iKuai 的 DNS 修改为 `192.168.6.2` 来验证科学是否成功.

当然，也可以通过再次创建一个 CT 容器， 手动设置网关为 `192.168.6.2` 来单独验证.

`dig` 命令来查看分流和 fake-ip 效果

![dd](/assets/clash/sbaidu.png){data-zoomable}
![dg](/assets/clash/sgoogle.png){data-zoomable}
