# 0x01 小米路由器
 
::: info Xiaomi BE6500 PRO
新 WiFi 7 时代，双频并发 6453Mbps 的无线速率，配合5G频段 4×4 160MHz 大频宽、双频 4K QAM 高阶调制技术，叠加 MLO 双频聚合等创新技术，带来更畅快的网络体验。单个设备可以同时连接2.4G、5G频段，实现 WiFi 信号聚合，根据网络情况灵活使用不同频段，带来更稳定更流畅的网络体验，下载提速50%。该设备配备全2.5G网口，支持双 WAN、LAN 口聚合，最高支持 5Gbps传输带宽，完美释放家用NAS传输潜能。还可自定义IPTV、电竞网口，直连游戏主机、电视、电脑，满足高品质音画需求。
:::


## 解锁 ssh 

> [!IMPORTANT]
> 重中之重, 这个大佬写的非常详细, 直接照抄作业就好
> 
> [草东日记 - 小米路由器BE6500 Pro 解锁SSH 启用科学上网](https://www.gaicas.com/xiaomi-be6500-pro.html)

> 至于城里的人想出去的部分嘛 [vivo50](https://1s.bigmeok.me/user#/register?code=9anZDD1O)


## 局域网 DHCP 配置

进入小米路由器管理后台, 设置如下

菜单路径: 常用设置 -> 局域网设置 

> [!TIP]
> 先设置局域网IP地址, 再修改 DHCP 服务的开始IP 和 结束IP

![路由器DHCP设置](/lab/assets/router-dhcp.png)

同样的, 下方有个绑定设备IP的列表, 可以进行固定的IP分配, 比如我这里 PC1 和 DS118 就是在路由器这里做的固定IP分配

## 小结

路由器的折腾到这里基本上就可以了,接下来处理比较麻烦的 [MiniPC](/lab/minipc)里面的中继路由器

