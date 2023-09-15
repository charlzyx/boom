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
      { text: "开始吧", link: "/0x01start" },
      { text: "秀太! ShowTime", link: "/screenshots" },
    ],
    sidebar: [
      { text: "0x01 开始吧", link: "/0x01start" },
      { text: "0x02 网络基础", link: "/0x02basenet" },
      { text: "0x03 Linux 基础", link: "/0x03baselinux" },
      { text: "0x04 系统安装", link: "/0x04install" },
      { text: "0x05 爱快路由", link: "/0x05ikuai" },
      { text: "0x06 clash 科学", link: "/0x06clash" },
      { text: "0x07 宿主机", link: "/0x07pve" },
      { text: "0x08 云盘机", link: "/0x08cloud" },
      { text: "0x09 Docker机", link: "/0x09docker" },
      { text: "0x10 下载机", link: "/0x10bt" },
      { text: "0x11 视频录制", link: "/0x11gpu" },
      { text: "0x12 电视机", link: "/0x12tv" },
      { text: "0x13 网关机", link: "/0x13gateway" },
      { text: "秀太! ShowTime", link: "/screenshots" },
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
