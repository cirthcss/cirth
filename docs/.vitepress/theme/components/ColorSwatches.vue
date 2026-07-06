<script setup lang="ts">
// Light-mode `--cirth-primary` value for each build's $theme-color, resolved
// from src/colors/_index.scss and src/themes/default/_theme-colors.scss.
// Swatches only — building the actual per-color stylesheet is left to
// `npm run build`, see scripts/build-themes.js.
const colors = [
	{ name: "azure", hex: "#0172ad", note: "default" },
	{ name: "amber", hex: "#876400" },
	{ name: "blue", hex: "#2060df" },
	{ name: "cyan", hex: "#047878" },
	{ name: "fuchsia", hex: "#c1208b" },
	{ name: "green", hex: "#33790f" },
	{ name: "grey", hex: "#6a6a6a" },
	{ name: "indigo", hex: "#655cd6" },
	{ name: "jade", hex: "#007a50" },
	{ name: "lime", hex: "#577400" },
	{ name: "orange", hex: "#bd3c13" },
	{ name: "pink", hex: "#c72259" },
	{ name: "pumpkin", hex: "#9c5900" },
	{ name: "purple", hex: "#aa40bf" },
	{ name: "red", hex: "#c52f21" },
	{ name: "sand", hex: "#6e6a60" },
	{ name: "slate", hex: "#5d6b89" },
	{ name: "violet", hex: "#8352c5" },
	{ name: "yellow", hex: "#756b00" },
	{ name: "zinc", hex: "#646b79" },
];
</script>

<template>
	<div class="docs-colors-grid">
		<div v-for="color in colors" :key="color.name" class="docs-color-swatch">
			<div class="docs-color-swatch-preview" :style="{ backgroundColor: color.hex }">
				<span style="color: #fff; font-size: 0.75rem; font-weight: 600;">Aa</span>
			</div>
			<div class="docs-color-swatch-label">
				{{ color.name }}<template v-if="color.note"> ({{ color.note }})</template>
			</div>
		</div>
	</div>
</template>
