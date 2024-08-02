# cloud 云盘

## 硬盘分配

之前有提到我单独留了一块硬盘分区 挂在到了 `/home/cloud` , 可以回去 [MiniPC](/lab/minipc.md) 部分查看
需要修改对应的配置文件挂载到 lxc 中

并且, 宿主机中, 记得 `chmod -R 777 /home/cloud` 给够权限

```diff
arch: amd64
cmode: shell
cores: 4
features: nesting=1
hostname: docker
memory: 1024
+mp0: /home/cloud,mp=/cloud
net0: name=eth0,bridge=vmbr0,gw=10.5.6.1,hwaddr=BC:24:11:6D:1C:56,ip=10.5.6.12/24,type=veth
ostype: alpine
rootfs: local-lvm:vm-111-disk-0,size=8G
swap: 0
unprivileged: 1
```


## smb 共享

添加用户, 根据提示设置用户名密码

```sh
# 添加系统用户
useradd -u 1001 -s /usr/sbin/nologin -M cloud
useradd -u 1002 -s /usr/sbin/nologin -M tv
# 添加smb用户
smbpasswd -a cloud
smbpasswd -a tv
```

配置文件

::: details /etc/samba/openwrt.smb.con
```sh
[global]
        netbios name = OpenWRT 
        interfaces = br-lan 
        server string = Samba on OpenWRT
        unix charset = UTF-8
        workgroup = WORKGROUP

        ## This global parameter allows the Samba admin to limit what interfaces on a machine will serve SMB requests.
        bind interfaces only = yes

        ## time for inactive connections to-be closed in minutes
        deadtime = 15

        ## disable core dumps
        enable core files = no

        ## set security (auto, user, domain, ads)
        security = user

        ## This parameter controls whether a remote client is allowed or required to use SMB encryption.
        ## It has different effects depending on whether the connection uses SMB1 or SMB2 and newer:
    ## If the connection uses SMB1, then this option controls the use of a Samba-specific extension to the SMB protocol introduced in Samba 3.2 that makes use of the Unix extensions.
        ## If the connection uses SMB2 or newer, then this option controls the use of the SMB-level encryption that is supported in SMB version 3.0 and above and available in Windows 8 and newer. 
        ## (default/auto,desired,required,off)
        #smb encrypt = default

        ## set invalid users
        invalid users = root

        ## map unknow users to guest
        map to guest = Bad User

        ## allow client access to accounts that have null passwords. 
        null passwords = yes

        ## The old plaintext passdb backend. Some Samba features will not work if this passdb backend is used. (NOTE: enabled for size reasons)
        ## (tdbsam,smbpasswd,ldapsam)
        passdb backend = smbpasswd

        ## Set location of smbpasswd ('smbd -b' will show default compiled location)
        #smb passwd file = /etc/samba/smbpasswd 

        ## LAN (IPTOS_LOWDELAY TCP_NODELAY) WAN (IPTOS_THROUGHPUT) WiFi (SO_KEEPALIVE) try&error for buffer sizes (SO_RCVBUF=65536 SO_SNDBUF=65536)
        socket options = IPTOS_LOWDELAY TCP_NODELAY

        ## If this integer parameter is set to a non-zero value, Samba will read from files asynchronously when the request size is bigger than this value.
        ## Note that it happens only for non-chained and non-chaining reads and when not using write cache.
        ## The only reasonable values for this parameter are 0 (no async I/O) and 1 (always do async I/O).
        ## (1/0)
        #aio read size = 0
        #aio write size = 0

        ## If Samba has been built with asynchronous I/O support, Samba will not wait until write requests are finished before returning the result to the client for files listed in this parameter.
        ## Instead, Samba will immediately return that the write request has been finished successfully, no matter if the operation will succeed or not.
        ## This might speed up clients without aio support, but is really dangerous, because data could be lost and files could be damaged. 
        #aio write behind = /*.tmp/

        ## lower CPU useage if supported and aio is disabled (aio read size = 0 ; aio write size = 0)
        ## is this still broken? issue is from 2019 (NOTE: see https://bugzilla.samba.org/show_bug.cgi?id=14095 )
        ## (no, yes)
        #use sendfile = yes

        ## samba will behave as previous versions of Samba would and will fail the lock request immediately if the lock range cannot be obtained.
        #blocking locks = No

        ## disable loading of all printcap printers by default (iprint, cups, lpstat)
        load printers = No
        printcap name = /dev/null

        ## Enabling this parameter will disable Samba's support for the SPOOLSS set of MS-RPC's.
        disable spoolss = yes

        ## This parameters controls how printer status information is interpreted on your system.
        ## (BSD, AIX, LPRNG, PLP, SYSV, HPUX, QNX, SOFTQ)
        printing = bsd

        ## Disable that nmbd is acting as a WINS server for unknow netbios names
        #dns proxy = No

        ## win/unix user mapping backend
        #idmap config * : backend = tdb

        ## Allows the server name that is advertised through MDNS to be set to the hostname rather than the Samba NETBIOS name.
        ## This allows an administrator to make Samba registered MDNS records match the case of the hostname rather than being in all capitals.
        ## (netbios, mdns)
        mdns name = mdns

        ## Clients that only support netbios won't be able to see your samba server when netbios support is disabled.
        #disable netbios = Yes

        ## Setting this value to no will cause nmbd never to become a local master browser.
        #local master = no

        ## (auto, yes) If this is set to yes, on startup, nmbd will force an election, and it will have a slight advantage in winning the election. It is recommended that this parameter is used in conjunction with domain master = yes, so that nmbd can guarantee becoming a domain master. 
        #preferred master = yes

        ## (445 139) Specifies which ports the server should listen on for SMB traffic.
        ## 139 is netbios/nmbd
        #smb ports = 445 139

        ## This is a list of files and directories that are neither visible nor accessible.
        ## Each entry in the list must be separated by a '/', which allows spaces to be included in the entry. '*' and '?' can be used to specify multiple files or directories as in DOS wildcards.
        veto files = /Thumbs.db/.DS_Store/._.DS_Store/.apdisk/

        ## If a directory that is to be deleted contains nothing but veto files this deletion will fail unless you also set the delete veto files parameter to yes.
        delete veto files = yes

################ Filesystem and creation rules ################
        ## reported filesystem type (NTFS,Samba,FAT)
        #fstype = FAT

        ## Allows a user who has write access to the file (by whatever means, including an ACL permission) to modify the permissions (including ACL) on it.
        #dos filemode = Yes

        ## file/dir creating rules
        #create mask = 0666
        #directory mask = 0777
        #force group = root
        #force user = root
        #inherit owner = windows and unix
################################################################

######### Dynamic written config options #########
```
:::
::: details /etc/samba/cloud.smb.conf
/etc/samba/smb.conf
```sh
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
  passwd chat = _Enter\snew\s_\spassword:* %n\n *Retype\snew\s*\spassword:* %n\n _password\supdated\ssuccessfully_ .
  pam password change = yes
  map to guest = bad user

```
:::

::: details /etc/samba/cloud.smb.conf

```sh
[cloud]
  path = /cloud
  writeable = yes
  valid users = cloud
  create mask = 0777
  directory mask = 0777
  fource user = cloud
```

:::

::: details /etc/samba/tv.smb.conf

```sh
[tv]
  path = /cloud/tv
  writeable = yes
  valid users = tv
  create mask = 0777
  directory mask = 0777
  fource user = tv
```

## 迅雷下载

来源: [cnk3x/xunlei](https://github.com/cnk3x/xunlei)

alpine 运行这个有 glibc 的问题, 下面是修复脚本

```bash
# 第一步: fix alpine glibc
# https://github.com/sgerrand/alpine-pkg-glibc/issues/210#issuecomment-1841801227
echo 'https://storage.sev.monster/alpine/edge/testing' | tee -a /etc/apk/repositories
wget https://storage.sev.monster/alpine/edge/testing/x86_64/sevmonster-keys-1-r0.apk
sh -c '
  apk add --allow-untrusted ./sevmonster-keys-1-r0.apk
  apk update \
    && apk add gcompat \
    && rm -rf /lib/ld-linux-x86-64.so.2 \
    && apk add --force-overwrite glibc \
    && apk add glibc-bin'

rm -rf ./sevmonster-keys-1-r0.apk

# 第二步: fix libstdc++ (迅雷需要)
# https://stackoverflow.com/questions/11471722/libstdc-so-6-cannot-open-shared-object-file-no-such-file-or-directory
# https://github.com/kohlschutter/junixsocket/issues/33
apk add libstdc++

```

迅雷安装脚本, 注意版本号有更新需要替换

```bash

mkdir /etc/xunlei && cd /etc/xunlei

wget https://github.com/cnk3x/xunlei/releases/download/v3.20.1/xlp-amd64.tar.gz
tar -zxvf xlp-amd64.tar.gz && rm -rf ./xlp-amd64.tar.gz
chmod +x ./xlp
```

自启动脚本

/etc/init.d/xunlei

```bash

#!/sbin/openrc-run

```sh
#!/sbin/openrc-run
supervisor=supervise-daemon
USER=root
GROUP=root
name="xunlei"
description="Xunlei Downlaod Server"
command=/etc/xunlei/xlp
command_args="--dir_download=/cloud/xunlei/download --dir_data=/cloud/xunlei/data"
name=$(basename $(readlink -f $command))
supervise_daemon_args="--stdout /var/log/${name}.log --stderr /var/log/${name}.err"

depend() {
	After=syslog.target network-online
}
```

```
添加完文件之后

```bash
# 给一下可执行权限
chmod 755 /etc/init.d/xunlei
# 添加开机自启
rc-update add xunlei
# 立即启动
rc-service xunlei start
```

## alist

[可以用来挂在WebDav的软件](https://alist.nn.ci/zh/guide/webdav.html#%E5%8F%AF%E4%BB%A5%E7%94%A8%E6%9D%A5%E6%8C%82%E8%BD%BDwebdav%E7%9A%84%E8%BD%AF%E4%BB%B6)


```sh
mkdir -p /etc/alist && cd /etc/alist
wget https://github.com/alist-org/alist/releases/download/v3.36.0/alist-linux-amd64.tar.gz
tar -zxvf ./alist-linux-amd64.tar.gz && rm -rf  ./alist-linux-amd64.tar.gz
chmod +x ./alist

# 设置管理员密码
./alist admin set NEW_PASSWORD

```

服务文件 `/etc/init.d/alist`

```sh
#!/sbin/openrc-run
supervisor=supervise-daemon
USER=root
GROUP=root
name="Alist service"
description="Alist: Pan Server"
command=/etc/alist/alist
command_args="--data /etc/alist/data server"
name=$(basename $(readlink -f $command))
supervise_daemon_args="--stdout /var/log/${name}.log --stderr /var/log/${name}.err"


depend() {
	After=syslog.target network-online
}
```

```
添加完文件之后

```bash
# 给一下可执行权限
chmod 755 /etc/init.d/alist
# 添加开机自启
rc-update add alist
# 立即启动
rc-service alist start
```