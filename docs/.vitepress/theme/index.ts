import type { Theme } from "vitepress";
import ColorSwatches from "./components/ColorSwatches.vue";
import Demo from "./components/Demo.vue";
import Layout from "./Layout.vue";
import "./style.css";

// Fully custom theme: no VitePress default theme at all. The site is
// ordinary semantic HTML styled by Cirth's own default build — the same
// dogfooding approach Bootstrap and Pico CSS use for their docs.
export default {
	Layout,
	enhanceApp({ app }) {
		app.component("Demo", Demo);
		app.component("ColorSwatches", ColorSwatches);
	},
} satisfies Theme;
