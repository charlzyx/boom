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
      { text: "架构", link: "/arch" },
      { text: "安装与配置", link: "/install" },
      { text: ".1 VM iKuai 安装与配置", link: "/ikuai" },
      { text: ".2 LXC clash 安装与配置", link: "/clash" },
      { text: ".3 LXC 网盘小鸡", link: "/cloud" },
    ],

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
