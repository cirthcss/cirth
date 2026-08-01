import { common, createLowlight } from "lowlight";

// Local replacement for the `rehype-highlight` package: cirth's docs only
// ever fence html/css/js/json/sh (verified: `grep -rhoE '^```[a-z]*'
// docs/src/pages`), so the general-purpose plugin's language detection,
// aliasing, and per-language config surface is unused weight — this is
// the ~20 lines of it cirth actually exercises, built directly on
// `lowlight` (already installed transitively; still the exact same
// highlight.js grammars underneath, same `.hljs-*` token classes).
const lowlight = createLowlight(common);

const getText = (node) =>
	(node.children ?? [])
		.map((child) => (child.type === "text" ? child.value : getText(child)))
		.join("");

const getLanguage = (node) => {
	const className = node.properties?.className;
	if (!Array.isArray(className)) return undefined;
	const match = className.find((name) => String(name).startsWith("language-"));
	return match ? String(match).slice("language-".length) : undefined;
};

const visit = (node, callback) => {
	if (node.type === "element") callback(node);
	for (const child of node.children ?? []) visit(child, callback);
};

export function rehypeCode() {
	return (tree) => {
		visit(tree, (node) => {
			if (node.tagName !== "pre") return;
			const code = (node.children ?? []).find(
				(child) => child.type === "element" && child.tagName === "code",
			);
			if (!code) return;

			const lang = getLanguage(code);
			if (!lang) return;

			const text = getText(code);
			let result;
			try {
				result = lowlight.highlight(lang, text);
			} catch {
				return; // unregistered language — leave the plain text as-is
			}

			if (!Array.isArray(code.properties.className)) {
				code.properties.className = [];
			}
			if (!code.properties.className.includes("hljs")) {
				code.properties.className.unshift("hljs");
			}
			code.children = result.children;
		});
	};
}
