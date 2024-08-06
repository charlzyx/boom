import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  base: "/boom/",
  title: "Chao's BoomLab",
  srcExclude: ["**/README.md", "**/TODO.md"],
  description: "家庭路由器/网络的折腾笔记..",
  assetsDir: "assets",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "让我们开始吧", link: "/lab/index" },
      { text: "之前的版本", link: "/archived" },
    ],
    sidebar: [
      { text: "0x00.写在前面", link: "/lab/index" },
      { text: "0x01.小米路由器", link: "/lab/0x01router" },
      { text: "0x02.MiniPC.AirLAN", link: "/lab/0x02minipc" },
      { text: "0x03.LXC 容器应用", link: "/lab/0x03app" }
    ],
    footer: {
      message: "Powered by VitePress",
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
