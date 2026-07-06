<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useCirthTheme } from "../composables/theme";

const props = withDefaults(
	defineProps<{
		src: string;
		/** "default" previews under the site-wide default build; "classless"
		 * previews under the scoped classless build so its landmark/container
		 * behavior renders accurately. */
		variant?: "default" | "classless";
	}>(),
	{ variant: "default" },
);

const { isDark } = useCirthTheme();

const modules = import.meta.glob("../demos/*.html", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

const html = computed(() => {
	const key = `../demos/${props.src}.html`;
	const source = modules[key];
	if (!source) {
		console.warn(`[Demo] missing snippet: ${props.src}.html`);
		return "";
	}
	return source.trim();
});

// The scoped classless build reads data-theme from its own root element, so
// mirror the site theme onto the wrapper. Applied after mount only, to keep
// server-rendered and first client render identical.
const mounted = ref(false);
onMounted(() => {
	mounted.value = true;
});
const classlessTheme = computed(() => {
	if (props.variant !== "classless" || !mounted.value) return undefined;
	return isDark.value ? "dark" : "light";
});
</script>

<template>
	<div class="docs-demo">
		<div
			class="docs-demo-preview"
			:class="variant === 'classless' ? 'cirth-classless' : undefined"
			:data-theme="classlessTheme"
			v-html="html"
		/>
		<details class="docs-demo-source">
			<summary>Show HTML</summary>
			<pre><code v-text="html" /></pre>
		</details>
	</div>
</template>
