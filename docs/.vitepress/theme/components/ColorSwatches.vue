<script setup lang="ts">
// Light-mode `--cirth-primary` value for each theme, resolved from
// src/themes/default/_light.scss, src/themes/jade/_light.scss, and
// src/themes/slate/_light.scss. Swatches only — building the actual
// per-theme stylesheet is left to `npm run build`, see
// scripts/build-themes.js.
const colors = [
	{ name: "azure", hex: "#0172ad", note: "default" },
	{ name: "jade", hex: "#007a50" },
	{ name: "slate", hex: "#5d6b89" },
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
