// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import Theme from "vitepress/theme";
import "./style.css";
import { onMounted } from "vue";
import mediumZoom from "medium-zoom";

export default {
  extends: Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  setup() {
    onMounted(() => {
      mediumZoom("[data-zoomable]", { background: "var(--vp-c-bg)" });
    });
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  },
};
