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
      { text: "start", link: "/index" },
      { text: "归档", link: "/archive" },
    ],

    sidebar: [{ text: "起步", link: "/index" }],

    socialLinks: [{ icon: "github", link: "https://github.com/charlzyx/boom" }],
  },
});
