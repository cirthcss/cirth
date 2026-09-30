// The framework guides and the marks that name them, once. The sidebar
// (nav.js), the Installation page, the home page and each guide's own
// header all read this file, so a guide cannot be linked from one place and
// missing from another, and a logo cannot be drawn without its provenance.
//
// A mark is a project's own logo, downloaded from the project's official
// site or repository on the date below and committed unmodified under
// docs/public/logos/frameworks/. Nothing is hotlinked and nothing is
// redrawn. Where a project publishes a separate variant for dark
// backgrounds, `dark` names it; otherwise one file serves both schemes.
// The Brand page prints this table, and with it the one attribution a
// project's terms require (Next.js).
//
// A mark is never the only thing naming a guide: every place that draws
// one also prints the name as text, so the image is decorative (alt="")
// and a page still reads correctly when it does not load.

const fs = require("node:fs");
const path = require("node:path");

const retrieved = "2026-09-30";
const logoDir = path.join(__dirname, "../../public/logos/frameworks");

// Width over height, from the file's own viewBox, so every <img> carries
// its intrinsic size and nothing moves while the logos load.
/** @param {string} file */
const aspect = (file) => {
	const svg = fs.readFileSync(path.join(logoDir, file), "utf8");
	const box = /viewBox="([\d.\s-]+)"/.exec(svg);
	if (!box) throw new Error(`frameworks.js: ${file} has no viewBox`);
	const [, , width, height] = box[1].trim().split(/\s+/).map(Number);
	return width / height;
};

const marks = {
	html: {
		name: "HTML",
		file: "html.svg",
		owner: "W3C",
		source: "https://www.w3.org/html/logo/downloads/HTML5_Logo.svg",
		terms: "CC BY 3.0",
		termsUrl: "https://www.w3.org/html/logo/",
	},
	vite: {
		name: "Vite",
		file: "vite.svg",
		owner: "VoidZero Inc. and Vite contributors",
		source: "https://github.com/vitejs/vite/blob/cf5c0288d526/docs/public/logo-without-border.svg",
		terms: "MIT (repository)",
		note: "Published in the MIT-licensed vitejs/vite repository; the project states no separate logo terms.",
		termsUrl: "https://github.com/vitejs/vite/blob/main/LICENSE",
	},
	react: {
		name: "React",
		file: "react.svg",
		dark: "react-dark.svg",
		owner: "Meta Platforms, Inc. and affiliates",
		source: "https://github.com/reactjs/react.dev/tree/75ef18a9172e/public/images/brand",
		terms: "CC BY 4.0",
		termsUrl: "https://github.com/reactjs/react.dev/blob/main/LICENSE-DOCS.md",
	},
	nextjs: {
		name: "Next.js",
		file: "nextjs.svg",
		dark: "nextjs-dark.svg",
		owner: "Vercel, Inc.",
		source: "https://vercel.com/geist/brands",
		terms: "Vercel brand guidelines",
		termsUrl: "https://vercel.com/geist/brands",
		attribution:
			"Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc.",
	},
	vue: {
		name: "Vue",
		file: "vue.svg",
		owner: "Evan You",
		source: "https://github.com/vuejs/art/blob/366e8fad63e6/logo.svg",
		terms: "CC BY-NC-SA 4.0",
		note: "The terms allow the logo in open-source projects related to Vue.js. Designed by Evan You.",
		termsUrl: "https://github.com/vuejs/art#readme",
	},
	nuxt: {
		name: "Nuxt",
		file: "nuxt.svg",
		owner: "Nuxt Team",
		source: "https://nuxt.com/design-kit",
		terms: "Nuxt design kit",
		note: "The mountain icon may stand alone; the wordmark may not, so it is not used.",
		termsUrl: "https://nuxt.com/design-kit",
	},
	svelte: {
		name: "Svelte",
		file: "svelte.svg",
		owner: "Svelte contributors",
		source: "https://github.com/sveltejs/branding/blob/2af7bc72f1bf/svelte-logo.svg",
		terms: "Svelte branding guidelines",
		termsUrl: "https://github.com/sveltejs/branding#readme",
	},
	astro: {
		name: "Astro",
		file: "astro.svg",
		dark: "astro-dark.svg",
		wide: true,
		owner: "The Astro project",
		source: "https://astro.build/press/",
		terms: "Astro press guidelines",
		note: "The full logo, unmodified. The logomark alone needs written consent, so it is not used.",
		termsUrl: "https://astro.build/press/",
	},
	angular: {
		name: "Angular",
		file: "angular.svg",
		owner: "Google LLC",
		source: "https://github.com/angular/angular/blob/b6bf6504adab/adev/src/app/core/layout/navigation/navigation.component.html",
		terms: "CC BY 4.0",
		note: "The SVG is the one angular.dev draws in its own navigation, taken from the Angular repository unmodified.",
		termsUrl: "https://angular.dev/press-kit",
	},
	eleventy: {
		name: "Eleventy",
		file: "eleventy.svg",
		owner: "The Eleventy project",
		source: "https://github.com/11ty/logo/blob/82352f4ede5a/assets/logo-bg.svg",
		terms: "No licence stated",
		note: "Published in the 11ty/logo repository with no licence; used only to identify the Eleventy guide.",
		termsUrl: "https://github.com/11ty/logo",
	},
};

// `text` is the sidebar and page-title name; `marks` the logos the guide
// covers, in order. The Vue guide covers Nuxt, and the SvelteKit guide
// is where a Svelte reader lands, so those two carry a second mark.
const guides = [
	{
		id: "cdn",
		text: "HTML and CDN",
		link: "/installation/cdn",
		summary: "One link element. No install, no build.",
		marks: ["html"],
	},
	{
		id: "vite",
		text: "Vite",
		link: "/installation/vite",
		summary: "Import the stylesheet from your entry module.",
		marks: ["vite"],
	},
	{
		id: "react",
		text: "React",
		link: "/installation/react",
		summary: "Import it once, where the app mounts.",
		marks: ["react"],
	},
	{
		id: "nextjs",
		text: "Next.js",
		link: "/installation/nextjs",
		summary: "Import it in the root layout.",
		marks: ["nextjs"],
	},
	{
		id: "vue",
		text: "Vue and Nuxt",
		link: "/installation/vue",
		summary: "main.js, or the css option in nuxt.config.",
		marks: ["vue", "nuxt"],
	},
	{
		id: "sveltekit",
		text: "SvelteKit",
		link: "/installation/sveltekit",
		summary: "Import it in the root +layout.svelte.",
		marks: ["svelte"],
	},
	{
		id: "astro",
		text: "Astro",
		link: "/installation/astro",
		summary: "Import it in a shared layout.",
		marks: ["astro"],
	},
	{
		id: "angular",
		text: "Angular",
		link: "/installation/angular",
		summary: "Add it to the styles array in angular.json.",
		marks: ["angular"],
	},
	{
		id: "eleventy",
		text: "Eleventy",
		link: "/installation/eleventy",
		summary: "Copy the file through and link it.",
		marks: ["eleventy"],
	},
];

for (const mark of Object.values(marks)) {
	mark.aspect = aspect(mark.file);
	if (mark.dark && Math.abs(aspect(mark.dark) - mark.aspect) > 0.01) {
		throw new Error(`frameworks.js: ${mark.name}'s two variants differ in shape`);
	}
}

for (const guide of guides) {
	for (const id of guide.marks) {
		if (!marks[id]) throw new Error(`frameworks.js: ${guide.id} names unknown mark ${id}`);
	}
}

// Every mark with the guide it leads to, in guide order: the logo strip on
// the home page and the Installation page, where Nuxt and Svelte are
// entries of their own that land on the guide that covers them.
const entries = guides.flatMap((guide) =>
	guide.marks.map((id) => ({ id, ...marks[id], link: guide.link, guide: guide.text })),
);

module.exports = { retrieved, marks, guides, entries };
