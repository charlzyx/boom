# FTP 设置

## 需求分析

我的机器上外挂了一个硬盘到 `/titan` 作为家里网盘来使用
利用虚拟用户控制不同的用户访问不同的文件夹, 同时 **不能切换到上级目录**

- 虚拟用户 `tv` 文件夹 `/titan/space/media` 给电视机用
- 虚拟用户 `cloud` 文件夹 `/titan/cloud` 云盘的管理员
- 虚拟用户 `someone` 文件夹 `/titan/cloud/someone` 其他云盘 FTP 用户

# 安装与启动

```bash
apt install vsftpd
systemctl enable vsftpd
systemctl start vsftpd
journalctl -fu vsftpd # 查看日志
```

## 我的配置

- /etc/vsftpd/update.sh 更新脚本

```bash
db_load -T -t hash -f vu.txt vu.db
cp ./vsftpd.pam /etc/pam.d/vsftpd
```

- /etc/vsftpd/vsftpd.pam 虚拟用户认证文件

```bash
auth required pam_userdb.so db=/etc/vsftpd/vu
account required pam_userdb.so db=/etc/vsftpd/vu
```

- /etc/vsftpd/vu.txt 虚拟用户&密码列表

```bash
cloud  # 用户名
123456 # 密码
tv     # 用户名
123456 # 密码
```

- /etc/vsftpd/vu/cloud 虚拟用户 cloud 配置

```bash
local_root=/titan/cloud/
write_enable=YES
```

- /etc/vsftpd/vu/tv 虚拟用户 tv 配置

```bash
local_root=/titan/space/media
write_enable=YES
```

- /etc/vsftpd.conf vsftpd 配置

```bash
anonymous_enable=NO
local_enable=YES

write_enable=NO
anon_upload_enable=NO
anon_mkdir_write_enable=NO
anon_other_write_enable=NO

chroot_local_user=NO
chroot_list_enable=NO
allow_writeable_chroot=YES

guest_enable=YES
guest_username=vftp

listen=YES
listen_port=21
pasv_min_port=30000
pasv_max_port=30999
user_config_dir=/etc/vsftpd/vu
```

## 参考文档

- [vsftpd 虚拟多用户多目录配置](https://murphypei.github.io/blog/2019/02/vsftpd)
- vsftp 自带文档

::: details /usr/share/doc/vsftpd/examples/VIRTUAL_USERS

This example shows how to set up vsftpd / PAM with "virtual users".
A virtual user is a user login which does not exist as a real login on the
system. Virtual users can therefore be more secure than real users, beacuse
a compromised account can only use the FTP server.

Virtual users are often used to serve content that should be accessible to
untrusted users, but not generally accessible to the public.

Step 1) Create the virtual users database.
We are going to use pam_userdb to authenticate the virtual users. This needs
a username / password file in "db" format - a common database format.
To create a "db" format file, first create a plain text files with the
usernames and password on alternating lines.
See example file "logins.txt" - this specifies "tom" with password "foo" and
"fred" with password "bar".
Whilst logged in as root, create the actual database file like this:

db_load -T -t hash -f logins.txt /etc/vsftpd_login.db
(Requires the Berkeley db program installed).
NOTE: Many systems have multiple versions of "db" installed, so you may
need to use e.g. db3_load for correct operation. This is known to affect
some Debian systems. The core issue is that pam_userdb expects its login
database to be a specific db version (often db3, whereas db4 may be installed
on your system). You might check ahead what specific db version you'll need
by looking at the dependcies of the pam module. Some methods to do that is to
run ldd on the pam_userdb.so or look at the dependencies of the package with
the pam modules.

This will create /etc/vsftpd_login.db. Obviously, you may want to make sure
the permissions are restricted:

chmod 600 /etc/vsftpd_login.db

For more information on maintaing your login database, look around for
documentation on "Berkeley DB", e.g.
http://www.sleepycat.com/docs/utility/index.html

Step 2) Create a PAM file which uses your new database.

See the example file vsftpd.pam. It contains two lines:

auth required /lib/security/pam_userdb.so db=/etc/vsftpd_login
account required /lib/security/pam_userdb.so db=/etc/vsftpd_login

This tells PAM to authenticate users using our new database. Copy this PAM
file to the PAM directory - typically /etc/pam.d/

cp vsftpd.pam /etc/pam.d/ftp

(Note - if you set pam_service_name to e.g. vsftpd instead, you'll need to copy
to /etc/pam.d/vsftpd).

Step 3) Set up the location of the files for the virtual users.

useradd -d /home/ftpsite virtual
ls -ld /home/ftpsite
(which should give):
drwx------ 3 virtual virtual 4096 Jul 30 00:39 /home/ftpsite

We have created a user called "virtual" with a home directory "/home/ftpsite".
Let's add some content to this download area:

cp /etc/hosts /home/ftpsite
chown virtual.virtual /home/ftpsite/hosts

Step 4) Create your vsftpd.conf config file.

See the example in this directory. Let's go through it line by line:

anonymous_enable=NO
local_enable=YES

This disables anonymous FTP for security, and enables non-anonymous FTP (which
is what virtual users use).

write_enable=NO
anon_upload_enable=NO
anon_mkdir_write_enable=NO
anon_other_write_enable=NO

These ensure that for security purposes, no write commands are allowed.

chroot_local_user=YES

This makes sure that the virtual user is restricted to the virtual FTP area
/home/ftpsite we set up above.

guest_enable=YES
guest_username=virtual

The guest_enable is very important - it activates virtual users! And
guest_username says that all virtual users are mapped to the real user
"virtual" that we set up above. This will also determine where on the
filesystem the virtual users end up - the home directory of the user
"virtual", /home/ftpsite.

listen=YES
listen_port=10021

This puts vsftpd in "standalone" mode - i.e. not running from an inetd. This
means you just run the vsftpd executable and it will start up. This also
makes vsftpd listen for FTP requests on the non-standard port of 10021 (FTP
is usually 21).

pasv_min_port=30000
pasv_max_port=30999

These put a port range on passive FTP incoming requests - very useful if
you are configuring a firewall.

Copy the example vsftpd.conf file to /etc:

cp vsftpd.conf /etc/

Step 5) Start up vsftpd.

Go to the directory with the vsftpd binary in it, and:

./vsftpd

If all is well, the command will sit there. If all is not well, you will
likely see some error message.

Step 6) Test.

Launch another shell session (or background vsftpd with CTRL-Z and then "bg").
Here is an example of an FTP session:

ftp localhost 10021
Connected to localhost (127.0.0.1).
220 ready, dude (vsFTPd 1.1.0: beat me, break me)
Name (localhost:chris): tom
331 Please specify the password.
Password:
230 Login successful. Have fun.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> pwd
257 "/"
ftp> ls
227 Entering Passive Mode (127,0,0,1,117,135)
150 Here comes the directory listing.
226 Transfer done (but failed to open directory).
ftp> size hosts
213 147
ftp>

Comments:
The password we gave was "foo".
Do not be alarmed by the "failed to open directory". That is because the
directory /home/ftpsite is not world readable (we could change this
behaviour if we wanted using anon_world_readable_only=NO but maybe we want
it this way for security.
We can see that we have access to the "hosts" file we copied into the virtual
FTP area, via the size command.

:::

::: details /usr/share/doc/vsftpd/examples/VIRTUAL_USERS2

```md
This example shows how to extend the "VIRTUAL_USERS" example to reflect
a slightly more complex setup.

Let's assume that we want two types of virtual user - one that can only browse
and download content, and another that can upload new content as well as
download existing content.

To achieve this setup, we can use use of vsftpd's powerful per-user
configurability (new in v1.1.0).ååå

In the previous virtual user example, we created two users - tom and fred.
Let's say that we want fred to have write access to upload new files whilst
tom can only download.

Step 1) Activate per-user configurability.

To activate this powerful vsftpd feature, add the following to
/etc/vsftpd.conf:
user_config_dir=/etc/vsftpd_user_conf

And, create this directory:

mkdir /etc/vsftpd_user_conf

Step 2) Give tom the ability to read all files / directories.

At the end of the last example, we noted that the virtual users can only
see world-readable files and directories. We could make the /home/ftpsite
directory world readable, and upload files with world-read permission. But
another way of doing this is giving tom the ability to download files which
are not world-readable.

For the tom user, supply a config setting override for
anon_world_readable_only:

echo "anon_world_readable_only=NO" > /etc/vsftpd_user_conf/tom

Check it out - login as tom and now "ls" will return a directory listing!
Log in as fred and it won't.
NOTE - restart vsftpd to pick up the config setting changes to
/etc/vsftpd.conf. (Advanced users can send SIGHUP to the vsftpd listener
process).

Step 3) Give fred the ability to read all files / directories and create
new ones but not interfere with existing files.

echo "anon_world_readable_only=NO" > /etc/vsftpd_user_conf/fred
echo "write_enable=YES" >> /etc/vsftpd_user_conf/fred
echo "anon_upload_enable=YES" >> /etc/vsftpd_user_conf/fred

Check it out - login as tom and you can't upload. Log in as fred and you can!
Try and delete a file as both tom and fred - you can't.
```

:::
