# Samba 服务

## 需求分析

我的机器上外挂了一个硬盘到 `/titan` 作为家里网盘来使用, `/titan/, root 作为管理员可以访问所有目录
tv 只能看 `titan/space/media` **不能切换到其他目录**

## 安装与启动

```bash
apt install samba
systemctl enable smbd
systemctl start smbd
journalctl -fu smbd # 查看日志
```

## 我的配置

全局配置 `/etc/smb.conf`

```bash
#======================= Global Settings =======================
[global]
   include = /etc/samba/%U.smb.conf
   workgroup = WORKGROUP

   log file = /var/log/samba/log.%m
   max log size = 1000
   logging = file

   panic action = /usr/share/samba/panic-action %d

   server string = Titan

   security = user
   server role = standalone server

   obey pam restrictions = yes
   unix password sync = yes

   passwd program = /usr/bin/passwd %u
   passwd chat = *Enter\snew\s*\spassword:* %n\n *Retype\snew\s*\spassword:* %n\n *password\supdated\ssuccessfully* .
   pam password change = yes

   map to guest = bad user
   usershare allow guests = yes

```

root 用户配置 `root.smb.conf`

```bash
[root]
  path = /titan
  writeable = yes
  valid users = @root
  create mask = 0755
  directory mask = 0755
```

tv 用户配置 `tv.smb.conf`

```bash
[tv]
  path = /titan/space/media
  writeable = yes
  valid users = @tv
  create mask = 0755
  directory mask = 0755
```
