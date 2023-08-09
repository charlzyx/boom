import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/boom/",
  title: "Chao's HomeLab",
  description: "A HomeLab NAS & Router Setup Record.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Arch", link: "/arch" },
    ],

    sidebar: [
      { text: "Arch", link: "/arch" },
      { text: "Proxmox VE 安装", link: "/pve-install" },
      { text: "宿主机配置", link: "/pve" },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/charlzyx/boom" },
    ],
  },
});
