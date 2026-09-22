const { listPresetNames } = require("./presets");

// What a build is required to produce, and therefore exactly what the npm
// tarball is required to contain. Two consumers read this list and must not
// be allowed to disagree about it: check-dist.js, which proves each file
// keeps the promise its name makes, and check-package-surface.js, which
// proves the published tarball holds those files and nothing else.
//
// The class-scoping wrapper.
const scopeClass = "cirth";

// The one cascade layer every built file puts all of its rules in (gh#124,
// specs/cascade-layer.md). src/helpers/_cascade.scss is where the SCSS
// writes it; check-dist.js and smoke-consumer.js hold dist/ and the tarball
// to this name, so the two cannot drift apart unnoticed.
const layerName = "cirth";

const rootBuilds = [
	{ name: "cirth", classless: false, scoped: false },
	{ name: "cirth.classless", classless: true, scoped: false },
	{ name: "cirth.scoped", classless: false, scoped: true },
	{ name: "cirth.classless.scoped", classless: true, scoped: true },
	// The print pass ships separately (see src/cirth.print*.scss). It is a
	// root build like the others and owes the same invariants: a classless
	// print sheet must stay class-free, a scoped one must stay inside the
	// wrapper. Nothing here treats it as optional — a print stylesheet that
	// leaked a class selector would break the classless promise on paper
	// just as surely as on screen.
	{ name: "cirth.print", classless: false, scoped: false },
	{ name: "cirth.print.classless", classless: true, scoped: false },
	{ name: "cirth.print.scoped", classless: false, scoped: true },
	{ name: "cirth.print.classless.scoped", classless: true, scoped: true },
];

/** Presets are discovered from src/presets/, never listed by hand. */
const presetBuilds = () =>
	listPresetNames().map((name) => ({ name: `presets/${name}` }));

/**
 * The DTCG token export (scripts/build-tokens.js): one complete file per
 * colour scheme.
 *
 * @type {readonly ("light" | "dark")[]}
 */
const tokenSchemes = ["light", "dark"];

/**
 * Every file a complete build writes into dist/, expanded and minified,
 * plus the token export, as tarball-relative paths.
 *
 * @returns {string[]}
 */
const distFiles = () =>
	[
		...[...rootBuilds, ...presetBuilds()].flatMap(({ name }) => [
			`dist/${name}.css`,
			`dist/${name}.min.css`,
		]),
		...tokenSchemes.map((scheme) => `dist/tokens/${scheme}.tokens.json`),
	].sort();

module.exports = {
	distFiles,
	layerName,
	presetBuilds,
	rootBuilds,
	scopeClass,
	tokenSchemes,
};
