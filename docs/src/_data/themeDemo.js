// The home page's "Your theme. Same HTML." demonstration, as data.
//
// One card, the same markup throughout. It starts as Cirth ships, with no
// declaration of its own, and three of Cirth's custom properties change one
// at a time as the reader scrolls: the accent, the corners, the canvas. The
// values are made up for the demonstration and none of them is a value the
// default theme or a shipped preset declares (tests/docs-stack.spec.js
// compares them with every compiled preset), so the demo shows what a theme
// of the reader's own looks like, not a preset under another name.
//
// The states are discrete endpoints, each checked for contrast in both
// schemes by the same test: custom properties are not interpolated, so no
// in-between colour is ever on screen.

const tokens = ["--cirth-primary", "--cirth-border-radius", "--cirth-canvas"];

/** @type {{ id: string, label: string, changes?: string, values: Record<string, string> }[]} */
const states = [
	{
		id: "default",
		label: "Cirth as it ships",
		values: {},
	},
	{
		id: "accent",
		label: "The accent",
		changes: "--cirth-primary",
		values: {
			"--cirth-primary": "light-dark(oklch(50% 0.17 32), oklch(72% 0.13 40))",
		},
	},
	{
		id: "corners",
		label: "The corners",
		changes: "--cirth-border-radius",
		values: {
			"--cirth-border-radius": "1.125rem",
		},
	},
	{
		id: "canvas",
		label: "The canvas",
		changes: "--cirth-canvas",
		values: {
			"--cirth-canvas": "light-dark(oklch(95% 0.026 85), oklch(20% 0.02 60))",
		},
	},
];

// Each state is the one before it plus its own change; the first declares
// nothing, so it has no stylesheet at all.
/** @type {Record<string, string>} */
let running = {};
const resolved = states.map((state) => {
	running = { ...running, ...state.values };
	const declared = tokens.filter((token) => token in running);
	return {
		...state,
		values: { ...running },
		css: declared.length ? `.cirth { ${declared.map((token) => `${token}: ${running[token]};`).join(" ")} }` : "",
	};
});

module.exports = {
	tokens,
	states: resolved,
	changes: resolved.filter((state) => state.changes),
	final: resolved[resolved.length - 1],
};
