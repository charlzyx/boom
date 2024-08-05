# 0x01 小米路由器

Xiaomi BE6500 PRO


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

路由器的折腾到这里基本上就可以了,接下来处理比较麻烦的 [MiniPC](/lab/0x02minipc)里面的中继路由器

