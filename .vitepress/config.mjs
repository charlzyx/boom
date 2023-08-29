import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  base: "/boom/",
  title: "Chao's BoomLab",
  srcExclude: ["**/README.md", "**/TODO.md"],
  description: "NAS × 软路由配置指北, 由 Proxmox VE 强力驱动.",
  assetsDir: "assets",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "架构", link: "/arch" },
      { text: "归档", link: "/archive" },
    ],

    sidebar: [
      { text: "整体架构", link: "/arch" },
      { text: "基础概念与Tips", link: "/help" },
      { text: "PVE 安装与配置", link: "/install" },
      { text: "6.6 宿主机", link: "/home" },
      { text: "6.1 VM iKuai 安装与配置", link: "/ikuai" },
      { text: "6.2 LXC clash 安装与配置", link: "/clash" },
      { text: "6.3 LXC 网盘小鸡", link: "/cloud" },
      { text: "6.4 LXC 电视鸡", link: "/tv" },
      { text: "6.5 LXC Docker 鸡", link: "/docker" },
      { text: "6.208 LXC 下载鸡", link: "/bt" },
      { text: "6.? Home Assistant", link: "/ha" },
      { text: "秀太 ShowTime", link: "/screenshots" },
    ],
    footer: {
      message: "Powered by VitePress & PVE 8.0.",
      copyright: "Copyright © 2019-present charlzyx",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/charlzyx/boom" }],
  },
  mermaid: {
    // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
  },
  // optionally set additional config for plugin itself with MermaidPluginConfig
  mermaidPlugin: {
    class: "mermaid my-class", // set additional css classes for parent container
  },
});
