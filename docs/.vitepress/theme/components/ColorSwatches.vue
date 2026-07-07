<script setup lang="ts">
// Light-mode `--cirth-primary` value for the default theme and each preset,
// resolved from src/theme/_light.scss and src/presets/cobalt.scss /
// coral.scss. Swatches only — building the actual stylesheets is left to
// `npm run build`, see scripts/build-presets.js.
const colors = [
	{ name: "azure", hex: "#2671a3", note: "default theme" },
	{ name: "cobalt", hex: "#0f2d57", note: "preset" },
	{ name: "coral", hex: "#c0401f", note: "preset" },
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
