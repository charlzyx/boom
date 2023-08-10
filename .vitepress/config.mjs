import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/boom/",
  title: "Chao's BoomLab",
  srcExclude: ["**/README.md", "**/TODO.md"],
  description: "NAS × 软路由配置指北, 由 Proxmox VE 强力驱动.",
  assetsDir: "assets",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Arch", link: "/arch" },
      { text: "截图们", link: "/screenshots" },
    ],

    sidebar: [
      { text: "Arch", link: "/arch" },
      { text: "Proxmox VE 安装", link: "/pve-install" },
      { text: "PVE 宿主机配置", link: "/pve" },
      { text: "LuxDNS 配置", link: "/luxdns" },
      { text: "截图们", link: "/screenshots" },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/charlzyx/boom" }],
  },
});
