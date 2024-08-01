---
title: .3 LXC 网盘小鸡
lastUpdated: true
---

# 网盘小鸡 `192.168.6.3`

在这个容器中， 我们将会把 USB 外挂的硬盘映射为网络存储，借助 alist/sftpgo/samba 提供 SMB/FTP/WebDav 以及 WEB 管理界面

| 服务       | 端口      |
| ---------- | --------- |
| smb        | :445      |
| ftp        | :21       |
| webdav     | :8080/dav |
| webdav web | :8081     |
| alist      | :5244     |

::: tip 权限问题
可能会遇到挂载磁盘的权限问题, [我的方案](/archived/0x07pve)中通过 `777` 简单粗暴的跳过的这个麻烦的问题
:::

## /etc/pve/lxc/103.conf

```sh
arch: amd64
cmode: shell
cores: 4
hostname: titan
memory: 1024
mp0: /titan/space,mp=/space
mp1: /titan/cloud,mp=/cloud
net0: name=eth0,bridge=vmbr0,gw=192.168.6.1,hwaddr=EA:77:1D:26:AE:B8,ip=192.168.6.3/24,ip6=auto,type=veth
ostype: alpine
rootfs: local-lvm:vm-103-disk-0,size=10G
swap: 0
```

## 前置任务

### 依赖安装

```sh
# glibc 兼容, sftpgo 需要
apk add gcompat
```

### 用户创建

这几个用户是给 `smb` 用的

```sh
# smb 用户组
# 下载盘管理员
useradd -u 1001 -s /usr/sbin/nologin -M space
# 同步盘管理员
useradd -u 1002 -s /usr/sbin/nologin -M cloud
# 电视机用的
useradd -u 1003 -s /usr/sbin/nologin -M tv
```

# AList 安装与配置

自动安装脚本不支持 Alpine, 选择[手动安装方式](https://alist.nn.ci/zh/guide/install/manual.html#%E6%89%8B%E5%8A%A8%E8%BF%90%E8%A1%8C)

```sh
mkdir -p /opt/alist && cd /opt/alist
wget https://ghproxy.com/https://github.com/alist-org/alist/releases/download/v3.27.0/alist-linux-musl-amd64.tar.gz
tar -zxvf ./alist-linux-musl-amd64.tar.gz

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
command=/opt/alist/alist
command_args="--data /opt/alist/data server"
name=$(basename $(readlink -f $command))
supervise_daemon_args="--stdout /var/log/${name}.log --stderr /var/log/${name}.err"


depend() {
	After=syslog.target network-online.target
}
```

# SFTPGO 安装与配置

同样是手动安装, 安装方法类似

```sh
mkdir -p /opt/sftpgo && cd /opt/sftpgo
wget https://ghproxy.com/https://github.com/drakkan/sftpgo/releases/download/v2.5.4/sftpgo_v2.5.4_linux_x86_64.tar.xz
tar -xf ./sftpgo_v2.5.4_linux_x86_64.tar.xz
```

服务文件 `/etc/init.d/sftpgo`

```sh
#!/sbin/openrc-run
supervisor=supervise-daemon
USER=root
GROUP=root
name="sftpgo service"
description="Sftpgo: ftp Server"
command=/opt/sftpgo/sftpgo
command_args=" serve -c /opt/sftpgo/ "
name=$(basename $(readlink -f $command))
supervise_daemon_args="--stdout /var/log/${name}.log --stderr /var/log/${name}.err"


depend() {
	After=syslog.target network.target
}
```

配置文件在 `/opt/sftpgo/sftpgo.json`

:::details 我的配置

```json
{
  "common": {
    "idle_timeout": 15,
    "upload_mode": 0,
    "actions": {
      "execute_on": [],
      "execute_sync": [],
      "hook": ""
    },
    "setstat_mode": 0,
    "rename_mode": 0,
    "temp_path": "",
    "proxy_protocol": 0,
    "proxy_allowed": [],
    "proxy_skipped": [],
    "startup_hook": "",
    "post_connect_hook": "",
    "post_disconnect_hook": "",
    "data_retention_hook": "",
    "max_total_connections": 0,
    "max_per_host_connections": 20,
    "allowlist_status": 0,
    "allow_self_connections": 0,
    "defender": {
      "enabled": false,
      "driver": "memory",
      "ban_time": 30,
      "ban_time_increment": 50,
      "threshold": 15,
      "score_invalid": 2,
      "score_valid": 1,
      "score_limit_exceeded": 3,
      "score_no_auth": 0,
      "observation_time": 30,
      "entries_soft_limit": 100,
      "entries_hard_limit": 150
    },
    "rate_limiters": [
      {
        "average": 0,
        "period": 1000,
        "burst": 1,
        "type": 2,
        "protocols": ["SSH", "FTP", "DAV", "HTTP"],
        "generate_defender_events": false,
        "entries_soft_limit": 100,
        "entries_hard_limit": 150
      }
    ]
  },
  "acme": {
    "domains": [],
    "email": "",
    "key_type": "4096",
    "certs_path": "/var/lib/sftpgo/certs",
    "ca_endpoint": "https://acme-v02.api.letsencrypt.org/directory",
    "renew_days": 30,
    "http01_challenge": {
      "port": 80,
      "proxy_header": "",
      "webroot": ""
    },
    "tls_alpn01_challenge": {
      "port": 0
    }
  },
  "sftpd": {
    "bindings": [
      {
        "port": 2022,
        "address": "",
        "apply_proxy_config": true
      }
    ],
    "max_auth_tries": 0,
    "banner": "",
    "host_keys": [],
    "host_certificates": [],
    "host_key_algorithms": [],
    "moduli": [],
    "kex_algorithms": [],
    "ciphers": [],
    "macs": [],
    "trusted_user_ca_keys": [],
    "revoked_user_certs_file": "",
    "login_banner_file": "",
    "enabled_ssh_commands": [
      "md5sum",
      "sha1sum",
      "sha256sum",
      "cd",
      "pwd",
      "scp"
    ],
    "keyboard_interactive_authentication": true,
    "keyboard_interactive_auth_hook": "",
    "password_authentication": true,
    "folder_prefix": ""
  },
  "ftpd": {
    "bindings": [
      {
        "port": 21,
        "address": "",
        "apply_proxy_config": true,
        "tls_mode": 0,
        "certificate_file": "",
        "certificate_key_file": "",
        "min_tls_version": 12,
        "force_passive_ip": "",
        "passive_ip_overrides": [],
        "passive_host": "",
        "client_auth_type": 0,
        "tls_cipher_suites": [],
        "passive_connections_security": 0,
        "active_connections_security": 0,
        "debug": false
      }
    ],
    "banner": "",
    "banner_file": "",
    "active_transfers_port_non_20": true,
    "passive_port_range": {
      "start": 50000,
      "end": 50100
    },
    "disable_active_mode": false,
    "enable_site": false,
    "hash_support": 0,
    "combine_support": 0,
    "certificate_file": "",
    "certificate_key_file": "",
    "ca_certificates": [],
    "ca_revocation_lists": []
  },
  "webdavd": {
    "bindings": [
      {
        "port": 8080,
        "address": "",
        "enable_https": false,
        "certificate_file": "",
        "certificate_key_file": "",
        "min_tls_version": 12,
        "client_auth_type": 0,
        "tls_cipher_suites": [],
        "prefix": "/dav",
        "proxy_allowed": [],
        "client_ip_proxy_header": "",
        "client_ip_header_depth": 0,
        "disable_www_auth_header": false
      }
    ],
    "certificate_file": "",
    "certificate_key_file": "",
    "ca_certificates": [],
    "ca_revocation_lists": [],
    "cors": {
      "enabled": false,
      "allowed_origins": [],
      "allowed_methods": [],
      "allowed_headers": [],
      "exposed_headers": [],
      "allow_credentials": false,
      "max_age": 0,
      "options_passthrough": false,
      "options_success_status": 0,
      "allow_private_network": false
    },
    "cache": {
      "users": {
        "expiration_time": 0,
        "max_size": 50
      },
      "mime_types": {
        "enabled": true,
        "max_size": 1000,
        "custom_mappings": []
      }
    }
  },
  "data_provider": {
    "driver": "sqlite",
    "name": "/var/lib/sftpgo/sftpgo.db",
    "host": "",
    "port": 0,
    "username": "",
    "password": "",
    "sslmode": 0,
    "disable_sni": false,
    "target_session_attrs": "",
    "root_cert": "",
    "client_cert": "",
    "client_key": "",
    "connection_string": "",
    "sql_tables_prefix": "",
    "track_quota": 2,
    "delayed_quota_update": 0,
    "pool_size": 0,
    "users_base_dir": "/srv/sftpgo/data",
    "actions": {
      "execute_on": [],
      "execute_for": [],
      "hook": ""
    },
    "external_auth_hook": "",
    "external_auth_scope": 0,
    "pre_login_hook": "",
    "post_login_hook": "",
    "post_login_scope": 0,
    "check_password_hook": "",
    "check_password_scope": 0,
    "password_hashing": {
      "bcrypt_options": {
        "cost": 10
      },
      "argon2_options": {
        "memory": 65536,
        "iterations": 1,
        "parallelism": 2
      },
      "algo": "bcrypt"
    },
    "password_validation": {
      "admins": {
        "min_entropy": 0
      },
      "users": {
        "min_entropy": 0
      }
    },
    "password_caching": true,
    "update_mode": 0,
    "create_default_admin": false,
    "naming_rules": 5,
    "is_shared": 0,
    "node": {
      "host": "",
      "port": 0,
      "proto": "http"
    },
    "backups_path": "/srv/sftpgo/backups"
  },
  "httpd": {
    "bindings": [
      {
        "port": 8081,
        "address": "",
        "enable_web_admin": true,
        "enable_web_client": true,
        "enable_rest_api": true,
        "enabled_login_methods": 0,
        "enable_https": false,
        "certificate_file": "",
        "certificate_key_file": "",
        "min_tls_version": 12,
        "client_auth_type": 0,
        "tls_cipher_suites": [],
        "proxy_allowed": [],
        "client_ip_proxy_header": "",
        "client_ip_header_depth": 0,
        "hide_login_url": 0,
        "render_openapi": true,
        "web_client_integrations": [],
        "oidc": {
          "client_id": "",
          "client_secret": "",
          "config_url": "",
          "redirect_base_url": "",
          "scopes": ["openid", "profile", "email"],
          "username_field": "",
          "role_field": "",
          "implicit_roles": false,
          "custom_fields": [],
          "insecure_skip_signature_check": false,
          "debug": false
        },
        "security": {
          "enabled": false,
          "allowed_hosts": [],
          "allowed_hosts_are_regex": false,
          "hosts_proxy_headers": [],
          "https_redirect": false,
          "https_host": "",
          "https_proxy_headers": [],
          "sts_seconds": 0,
          "sts_include_subdomains": false,
          "sts_preload": false,
          "content_type_nosniff": false,
          "content_security_policy": "",
          "permissions_policy": "",
          "cross_origin_opener_policy": "",
          "expect_ct_header": ""
        },
        "branding": {
          "web_admin": {
            "name": "",
            "short_name": "",
            "favicon_path": "",
            "logo_path": "",
            "login_image_path": "",
            "disclaimer_name": "",
            "disclaimer_path": "",
            "default_css": "",
            "extra_css": []
          },
          "web_client": {
            "name": "",
            "short_name": "",
            "favicon_path": "",
            "logo_path": "",
            "login_image_path": "",
            "disclaimer_name": "",
            "disclaimer_path": "",
            "default_css": "",
            "extra_css": []
          }
        }
      }
    ],
    "templates_path": "templates",
    "static_files_path": "static",
    "openapi_path": "openapi",
    "web_root": "",
    "certificate_file": "",
    "certificate_key_file": "",
    "ca_certificates": [],
    "ca_revocation_lists": [],
    "signing_passphrase": "",
    "token_validation": 0,
    "max_upload_file_size": 0,
    "cors": {
      "enabled": false,
      "allowed_origins": [],
      "allowed_methods": [],
      "allowed_headers": [],
      "exposed_headers": [],
      "allow_credentials": false,
      "max_age": 0,
      "options_passthrough": false,
      "options_success_status": 0,
      "allow_private_network": false
    },
    "setup": {
      "installation_code": "",
      "installation_code_hint": "Installation code"
    },
    "hide_support_link": false
  },
  "telemetry": {
    "bind_port": 0,
    "bind_address": "127.0.0.1",
    "enable_profiler": false,
    "auth_user_file": "",
    "certificate_file": "",
    "certificate_key_file": "",
    "min_tls_version": 12,
    "tls_cipher_suites": []
  },
  "http": {
    "timeout": 20,
    "retry_wait_min": 2,
    "retry_wait_max": 30,
    "retry_max": 3,
    "ca_certificates": [],
    "certificates": [],
    "skip_tls_verify": false,
    "headers": []
  },
  "command": {
    "timeout": 30,
    "env": [],
    "commands": []
  },
  "kms": {
    "secrets": {
      "url": "",
      "master_key": "",
      "master_key_path": ""
    }
  },
  "mfa": {
    "totp": [
      {
        "name": "Default",
        "issuer": "SFTPGo",
        "algo": "sha1"
      }
    ]
  },
  "smtp": {
    "host": "",
    "port": 25,
    "from": "",
    "user": "",
    "password": "",
    "auth_type": 0,
    "encryption": 0,
    "domain": "",
    "templates_path": "templates",
    "debug": 0,
    "oauth2": {
      "provider": 0,
      "tenant": "",
      "client_id": "",
      "client_secret": "",
      "refresh_token": ""
    }
  },
  "plugins": []
}
```

:::

# SAMBA 安装与配置

apt 安装即可, 安装之后设置开机自启动

```sh
apk add sambda
```

添加用户（上面系统中添加的用户）, 根据提示设置用户名密码

```sh
smbpasswd space
smbpasswd cloud
smbpasswd tv
```

配置文件们

::: details /etc/samba/smb.conf

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

::: details /etc/samba/space.smb.conf

```sh
[space]
  path = /space
  writeable = yes
  valid users = space
  create mask = 0777
  directory mask = 0777
  fource user = space
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
  path = /space/media
  writeable = yes
  valid users = tv
  create mask = 0777
  directory mask = 0777
  fource user = tv
```

:::

## 添加服务开机自启

```sh
rc-update add alist
rc-update add sftpgo
rc-update add samba
```
