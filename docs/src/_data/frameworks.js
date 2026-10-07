// The integration guides and the marks that name them, once. The sidebar
// and the pager (nav.js), the Installation page, the home page, each
// guide's breadcrumb, header and verification note, and the Brand page all
// read this file, so a guide cannot be linked from one place and missing
// from another, a count cannot drift from the list it counts, and a logo
// cannot be drawn without its provenance.
//
// One guide per tool a reader would look for by name. Tools that are the
// same set-up under two names share one guide and say so in `covers`
// (HTML on Vite is the Vite guide; Phoenix LiveView is the Phoenix guide),
// and a package manager is never a guide: every guide that installs from
// npm offers all four. Integrations whose only purpose is another CSS
// framework (its CLI, its standalone binary, an atomic engine) are not
// guides either; `excluded` below names them so a test can keep them out.
//
// A mark is a project's own logo, downloaded from the project's official
// site or repository on the date it carries and committed unmodified under
// docs/public/logos/frameworks/. Nothing is hotlinked and nothing is
// redrawn. Where a project publishes a separate variant for dark
// backgrounds, `dark` names it; a one-colour mark (`mono`) is shown black
// on light and white on dark, as its own site shows it; otherwise one file
// serves both schemes. A logo is shown only under terms its owner publishes
// for that file: a trademark policy, brand guidelines, or the licence of the
// repository the file itself is shipped in (which covers the file, and is
// named as such). The licence of a project's code says nothing about a logo
// published elsewhere, so it is never borrowed for one. A project whose terms
// do not allow the logo here (Symfony), or that publishes none for it, has no
// mark, and its guide is named by text alone: `noMark` says why.
//
// Wherever a mark is a link, it leads to the project's official site
// (`officialUrl`), named as such, and the guide is a separate link beside
// it: the Django Software Foundation asks that its logo link to
// djangoproject.com, and the OpenJS Foundation allows a project logo only
// as a link to that project's home page. Elsewhere a mark is decorative
// (alt="") beside the printed name.

const fs = require("node:fs");
const path = require("node:path");

// The date the first marks were retrieved. A mark added later carries its
// own `retrieved`.
const retrieved = "2026-09-30";
const logoDir = path.join(__dirname, "../../public/logos/frameworks");

// Width over height, from the file itself, so every <img> carries its
// intrinsic size and nothing moves while the logos load: an SVG's viewBox,
// or its width and height when it has none; a PNG's header.
/** @param {string} file */
const aspect = (file) => {
	const full = path.join(logoDir, file);
	if (file.endsWith(".png")) {
		const header = fs.readFileSync(full).subarray(16, 24);
		return header.readUInt32BE(0) / header.readUInt32BE(4);
	}
	const svg = fs.readFileSync(full, "utf8");
	const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
	const box = /viewBox="([\d.\s-]+)"/.exec(root);
	if (box) {
		const [, , width, height] = box[1].trim().split(/\s+/).map(Number);
		return width / height;
	}
	const width = Number(/\swidth="([\d.]+)"/.exec(root)?.[1]);
	const height = Number(/\sheight="([\d.]+)"/.exec(root)?.[1]);
	if (width > 0 && height > 0) return width / height;
	throw new Error(`frameworks.js: ${file} has neither a viewBox nor a width and height`);
};

/**
 * @typedef {object} Mark
 * @property {string} name The project's name, printed beside the mark.
 * @property {string} file The mark, for the light scheme or for both.
 * @property {string} [dark] The project's own variant for dark backgrounds.
 * @property {boolean} [mono] One colour: black on light, white on dark.
 * @property {boolean} [wide] A wordmark rather than a symbol.
 * @property {number} [aspect] Width over height, read from the file below.
 * @property {number} [darkAspect] The dark variant's, where its frame differs.
 * @property {string} owner
 * @property {string} source Where the file was downloaded from.
 * @property {string} terms
 * @property {string} termsUrl
 * @property {string} [retrieved] When, if not on the first date above.
 * @property {string} [note]
 * @property {string} [attribution] A notice the terms require.
 */

const openJs = {
	terms: "OpenJS Foundation trademark policy",
	termsUrl: "https://trademark-policy.openjsf.org/",
};

/** @type {Record<string, Mark>} */
const marks = {
	vite: {
		name: "Vite",
		file: "vite.svg",
		owner: "VoidZero Inc. and Vite contributors",
		source: "https://github.com/vitejs/vite/blob/cf5c0288d526/docs/public/logo-without-border.svg",
		terms: "MIT (repository)",
		note: "Published in the MIT-licensed vitejs/vite repository; the project states no separate logo terms.",
		termsUrl: "https://github.com/vitejs/vite/blob/main/LICENSE",
	},
	postcss: {
		name: "PostCSS",
		file: "postcss.svg",
		owner: "The PostCSS project",
		source: "https://github.com/postcss/brand/blob/a07ead1904a6/dist/postcss-logo-symbol.svg",
		terms: "CC BY 4.0",
		termsUrl: "https://github.com/postcss/brand/blob/master/LICENSE",
		retrieved: "2026-10-02",
		note: "The symbol from the postcss/brand repository, the project's own store for its artwork.",
	},
	rsbuild: {
		name: "Rsbuild",
		file: "rsbuild.svg",
		owner: "The Rstack team (web-infra-dev)",
		source:
			"https://github.com/rspack-contrib/rstack-design-resources/blob/9d4a5e80043a/rsbuild/rsbuild-logo.svg",
		terms: "CC BY-NC-SA 4.0",
		termsUrl: "https://github.com/rspack-contrib/rstack-design-resources#license",
		retrieved: "2026-10-02",
		note: "From the Rstack design resources, licensed for non-commercial use with attribution; this documentation is free and sells nothing.",
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
	reactRouter: {
		name: "React Router",
		file: "react-router.svg",
		dark: "react-router-dark.svg",
		owner: "Shopify Inc.",
		source:
			"https://github.com/remix-run/react-router-website/tree/cce55dc06443/public/_brand/react-router-brand-assets/logo",
		terms: "React Router brand guidelines",
		termsUrl: "https://reactrouter.com/brand",
		retrieved: "2026-10-02",
		note: "The logo pair from the brand page, light and dark. The guidelines rule out any suggestion of endorsement, and there is none.",
	},
	remix: {
		name: "Remix",
		file: "remix.svg",
		dark: "remix-dark.svg",
		owner: "Shopify Inc.",
		source: "https://github.com/remix-run/remix-website/tree/25aea9ce95bd/public/_brand",
		terms: "Remix brand guidelines",
		termsUrl: "https://remix.run/brand",
		retrieved: "2026-10-02",
		note: "The light-mode and dark-mode logos from the brand page, each on the background it is drawn for.",
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
		note: "SvelteKit has no logo of its own and uses Svelte's, so both guides carry it.",
	},
	solid: {
		name: "Solid",
		file: "solid.svg",
		owner: "Solid contributors",
		source: "https://github.com/solidjs/solid-start/blob/a4ed2a4cd811/apps/landing-page/public/solid-logo.svg",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/solidjs/solid-start/blob/main/LICENSE",
		retrieved: "2026-10-02",
		note: "From the SolidStart landing page in the MIT-licensed solidjs/solid-start repository; the project states no separate logo terms.",
	},
	solidStart: {
		name: "SolidStart",
		file: "solidstart.svg",
		owner: "Solid contributors",
		source: "https://github.com/solidjs/solid-start/blob/a4ed2a4cd811/apps/landing-page/public/start-logo.svg",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/solidjs/solid-start/blob/main/LICENSE",
		retrieved: "2026-10-02",
	},
	qwik: {
		name: "Qwik",
		file: "qwik.svg",
		owner: "Qwik contributors",
		source: "https://github.com/QwikDev/qwik/blob/83a98c261d9d/packages/docs/public/logos/qwik-logo.svg",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/QwikDev/qwik/blob/main/LICENSE",
		retrieved: "2026-10-02",
		note: "The symbol qwik.dev serves from its own logos folder; the project states no separate logo terms.",
	},
	preact: {
		name: "Preact",
		file: "preact.svg",
		owner: "Preact contributors",
		source: "https://github.com/preactjs/preact-www/blob/4f0b067a3da7/src/assets/branding/symbol.svg",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/preactjs/preact-www/blob/master/LICENSE",
		retrieved: "2026-10-02",
		note: "The symbol offered on preactjs.com/branding, which states no terms beyond the repository's licence.",
	},
	lit: {
		name: "Lit",
		file: "lit.svg",
		owner: "OpenJS Foundation and Lit contributors",
		source: "https://github.com/lit/lit.dev/blob/697feba856f5/packages/lit-dev-content/site/images/flame.svg",
		...openJs,
		retrieved: "2026-10-02",
		note: "The flame lit.dev serves. Lit is an OpenJS Foundation project, and the foundation's policy allows a project logo as a link to the project's home page, which is the only way it is used here.",
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
	ember: {
		name: "Ember",
		file: "ember.svg",
		dark: "ember-dark.svg",
		wide: true,
		owner: "Tilde Inc.",
		source:
			"https://github.com/ember-learn/ember-website/tree/1cb3da94b3e4/public/images/brand/Ember%20Logos/Ember",
		terms: "Ember logo guidelines",
		termsUrl: "https://emberjs.com/logos/",
		retrieved: "2026-10-02",
		note: "The four-colour logo on light and the white one-colour logo on dark, the pairing the guidelines give, each with its registration mark.",
		attribution:
			"Ember is a trademark of Tilde Inc. This site is unaffiliated with the Ember project.",
	},
	vike: {
		name: "Vike",
		file: "vike.svg",
		owner: "Vike contributors",
		source: "https://github.com/vikejs/vike/blob/b2c0d5206df4/docs/assets/logo/vike.svg",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/vikejs/vike/blob/main/LICENSE.md",
		retrieved: "2026-10-02",
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
	fresh: {
		name: "Fresh",
		file: "fresh.svg",
		owner: "Deno Land Inc. and Fresh contributors",
		source: "https://github.com/freshframework/fresh/blob/86d6cdeb331a/www/static/logo.svg",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/freshframework/fresh/blob/main/LICENSE",
		retrieved: "2026-10-02",
		note: "The lemon usefresh.dev serves, byte for byte. The file has no viewBox and is sized by its own width and height.",
	},
	htmx: {
		name: "htmx",
		file: "htmx.svg",
		dark: "htmx-dark.svg",
		owner: "Big Sky Software",
		source: "https://github.com/bigskysoftware/htmx/tree/fa978b24e75f/editors/jetbrains",
		terms: "Zero-Clause BSD (repository)",
		termsUrl: "https://github.com/bigskysoftware/htmx/blob/master/LICENSE",
		retrieved: "2026-10-02",
		note: "The icon the htmx repository ships for its editor plugin, in its light and dark versions.",
	},
	laravel: {
		name: "Laravel",
		file: "laravel.svg",
		owner: "Laravel Holdings Inc.",
		source: "https://github.com/laravel/art/blob/d5f5e725c27f/logo-mark/5%20svg/3%20rgb/1%20Full%20Color/laravel-mark-rgb-red.svg",
		terms: "Laravel trademark policy",
		termsUrl: "https://laravel.com/legal/trademark",
		retrieved: "2026-10-01",
		note: "The red logomark from the official laravel/art repository. The policy permits referring to Laravel in documentation.",
	},
	rails: {
		name: "Rails",
		file: "rails.svg",
		mono: true,
		wide: true,
		owner: "David Heinemeier Hansson, under exclusive licence to the Rails Foundation",
		source: "https://github.com/rails/website/blob/fb413c108b1b/assets/images/logo.svg",
		terms: "Rails trademark policy",
		termsUrl: "https://rubyonrails.org/trademarks",
		retrieved: "2026-10-02",
		note: "The one-colour file rubyonrails.org itself colours with CSS. The policy allows the logo, without permission, to say that something supports Ruby on Rails.",
	},
	adonisjs: {
		name: "AdonisJS",
		file: "adonisjs.svg",
		dark: "adonisjs-dark.svg",
		wide: true,
		owner: "The AdonisJS project",
		source: "https://adonisjs.com/brand",
		terms: "AdonisJS brand guidelines",
		termsUrl: "https://adonisjs.com/brand",
		retrieved: "2026-10-04",
		note: "The black logo on light pages and the white one on dark pages, as the brand guidelines pair them, each exactly as the brand page's Copy SVG gives it (its Download links answered 404 on the day). Shown at its own proportions, with room round it and no effect, outline or other colour, as the guidelines ask.",
	},
	django: {
		name: "Django",
		file: "django.svg",
		dark: "django-dark.svg",
		wide: true,
		owner: "Django Software Foundation",
		source: "https://www.djangoproject.com/community/logos/",
		terms: "Django trademark licence",
		termsUrl: "https://www.djangoproject.com/trademarks/",
		retrieved: "2026-10-01",
		note: "The positive logo on light and the negative logo, white on its own green, on dark: both official files, in the official colours. The DSF asks a site that shows the logo to link it to djangoproject.com, and wherever it is a link here, it leads there.",
	},
	flask: {
		name: "Flask",
		file: "flask.svg",
		owner: "Pallets",
		source: "https://github.com/pallets/flask/blob/d73fa1cdcbd8/docs/_static/flask-icon.svg",
		terms: "BSD 3-Clause (repository)",
		termsUrl: "https://github.com/pallets/flask/blob/main/LICENSE.txt",
		retrieved: "2026-10-02",
		note: "The icon from Flask's own documentation sources; the project states no separate logo terms.",
	},
	phoenix: {
		name: "Phoenix",
		file: "phoenix.svg",
		owner: "Phoenix Framework contributors",
		source: "https://github.com/phoenixframework/phoenix/blob/v1.8.15/installer/templates/phx_assets/logo.svg.eex",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/phoenixframework/phoenix/blob/main/LICENSE.md",
		retrieved: "2026-10-01",
		note: "The mark the Phoenix installer writes into every new project, byte for byte, in Phoenix orange on both schemes; the project states no separate logo terms.",
	},
	dotnet: {
		name: ".NET",
		file: "dotnet.svg",
		owner: "Microsoft Corporation",
		source: "https://github.com/dotnet/brand/blob/91845f6ddf21/logo/dotnet-logo.svg",
		terms: ".NET brand repository",
		termsUrl: "https://github.com/dotnet/brand",
		retrieved: "2026-10-02",
		note: "The repository allows the logo to represent .NET in related content. ASP.NET Core and Blazor are part of .NET and have no logo of their own here, so both guides carry it.",
	},
	express: {
		name: "Express",
		file: "express.svg",
		dark: "express-dark.svg",
		wide: true,
		owner: "OpenJS Foundation and Express contributors",
		source: "https://github.com/expressjs/expressjs.com/tree/c936b6310349/public/images/logos",
		...openJs,
		retrieved: "2026-10-02",
		note: "The black and white logos from the expressjs.com repository. The OpenJS Foundation's policy allows a project logo as a link to the project's home page, which is the only way it is used here.",
	},
	elysia: {
		name: "Elysia",
		file: "elysia.svg",
		owner: "Elysia contributors",
		source: "https://github.com/elysiajs/documentation/blob/f68573703415/docs/public/assets/elysia.svg",
		terms: "MIT (repository)",
		termsUrl: "https://github.com/elysiajs/documentation/blob/main/LICENSE",
		retrieved: "2026-10-02",
	},
	wordpress: {
		name: "WordPress",
		file: "wordpress.svg",
		mono: true,
		owner: "WordPress Foundation",
		source: "https://github.com/WordPress/wporg-mu-plugins/blob/31aa3534aa28/mu-plugins/blocks/global-header-footer/images/w-mark.svg",
		terms: "WordPress trademark policy",
		termsUrl: "https://wordpressfoundation.org/trademark-policy/",
		retrieved: "2026-10-01",
		note: "The W mark from the header of WordPress.org itself. wordpress.org/about/logos publishes it in black and in white, and only those two colourways are shown.",
	},
	hugo: {
		name: "Hugo",
		file: "hugo.svg",
		wide: true,
		owner: "The Hugo authors",
		source: "https://github.com/gohugoio/hugoDocs/blob/bc18dd113c10/static/images/hugo-logo-wide.svg",
		terms: "Apache 2.0 (documentation content)",
		termsUrl: "https://github.com/gohugoio/hugoDocs/blob/master/content/LICENSE.md",
		retrieved: "2026-10-02",
	},
	zola: {
		name: "Zola",
		file: "zola.svg",
		dark: "zola-dark.svg",
		owner: "Zola contributors",
		source: "https://github.com/getzola/zola/tree/42c89b672144/docs/static/logos",
		terms: "EUPL 1.2 (repository)",
		termsUrl: "https://github.com/getzola/zola/blob/master/LICENSE",
		retrieved: "2026-10-02",
		note: "Coffee on white for light pages and cream on coffee for dark ones, both from the logos folder of Zola's own documentation.",
	},
	electron: {
		name: "Electron",
		file: "electron.svg",
		owner: "OpenJS Foundation",
		source: "https://github.com/electron/website/blob/e29b95b3c844/static/assets/img/logo.svg",
		...openJs,
		retrieved: "2026-10-02",
		note: "The logo electronjs.org serves. The OpenJS Foundation's policy allows a project logo as a link to the project's home page, which is the only way it is used here.",
		attribution: "Electron® is a registered trademark of the OpenJS Foundation.",
	},
	yew: {
		name: "Yew",
		file: "yew.svg",
		owner: "Yew contributors",
		source: "https://github.com/yewstack/yew/blob/bfa6c19af971/website/static/img/logo.svg",
		terms: "MIT or Apache 2.0 (repository)",
		termsUrl: "https://github.com/yewstack/yew#license",
		retrieved: "2026-10-01",
		note: "The logo the Yew website serves, from the dual-licensed yewstack/yew repository; the project states no separate logo terms.",
	},
};

// Every guide sits in one category, the one a reader would look under
// first. The Installation page and the sidebar group them in this order.
const categories = [
	{ id: "build", text: "Build tools", short: "Build tool" },
	{ id: "javascript", text: "JavaScript frameworks", short: "JavaScript" },
	{ id: "html", text: "HTML-first libraries", short: "HTML-first" },
	{ id: "backend", text: "Backend frameworks", short: "Backend" },
	{ id: "cms", text: "Content management", short: "CMS" },
	{ id: "static", text: "Static site generators", short: "Static sites" },
	{ id: "rust", text: "WebAssembly and Rust", short: "Rust" },
];

// How sure a guide is, in the words the guide prints. Every guide today is
// `verified`; the other levels exist so that a guide added from the
// documentation alone, or from a report, says so instead of borrowing a
// claim it has not earned.
const statuses = {
	verified: { text: "Verified", detail: "built and checked in a new project" },
	"docs-verified": { text: "Docs verified", detail: "written from the official documentation, not built here" },
	reported: { text: "Reported", detail: "reported to work, not reproduced here" },
	unsupported: { text: "Not supported", detail: "known not to work" },
};

// The browser floor a pipeline that lowers CSS needs to be told about.
const cssTarget = '["chrome123", "edge123", "firefox130", "safari18.2"]';

/**
 * @typedef {object} Guide
 * @property {string} id
 * @property {string} name The tool, as the sidebar, the grid and the h1 print it.
 * @property {string} category
 * @property {string | null} mark A key of `marks`, or null where none may be shown.
 * @property {string} [noMark] Why a guide has no mark, for the Brand page.
 * @property {string} officialUrl The project's own site.
 * @property {string} summary What the guide has you do, in one line.
 * @property {{ text: string, url: string }[]} docs The official pages the guide follows.
 * @property {{ status: keyof typeof statuses, date: string, with: string, result: string }} verified
 * @property {string} [toolchain] What the tool does to CSS on the way through.
 * @property {string[]} [covers] Set-ups this guide covers under another name.
 * @property {boolean} [lowers] Whether its build rewrites light-dark() by default;
 *   absent where nothing in the stack processes CSS (the file is served or copied as is).
 * @property {string} [fix] What to set where it does, as Compatibility lists it.
 */

/** @type {Guide[]} */
const guides = [
	// Build tools
	{
		id: "vite",
		name: "Vite",
		category: "build",
		mark: "vite",
		officialUrl: "https://vite.dev",
		summary: "Import it in the entry module and set build.cssTarget.",
		covers: ["HTML and Vite"],
		docs: [
			{ text: "Vite: CSS", url: "https://vite.dev/guide/features#css" },
			{ text: "Vite: build.cssTarget", url: "https://vite.dev/config/build-options#build-csstarget" },
		],
		toolchain: "Vite 8 minifies CSS with Lightning CSS for an older target than Cirth's and rewrites light-dark().",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Vite 8.3.2 (`create-vite` 9.2.1, vanilla template)",
			result: "Without `build.cssTarget` the build kept none of Cirth's 46 `light-dark()` values; with it, all 46.",
		},
	},
	{
		id: "postcss",
		name: "PostCSS",
		category: "build",
		mark: "postcss",
		officialUrl: "https://postcss.org",
		summary: "Inline it with postcss-import; nothing else to set.",
		docs: [
			{ text: "postcss-import", url: "https://github.com/postcss/postcss-import" },
			{ text: "PostCSS", url: "https://postcss.org" },
		],
		toolchain: "postcss-import inlines the file as it is; Autoprefixer adds two prefixed rules and changes nothing else.",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "PostCSS 8.5.28, postcss-cli 12.0.0, postcss-import 17.0.0, and Autoprefixer 10.6.1 with its default browsers",
			result: "All 46 `light-dark()` values kept, with and without Autoprefixer.",
		},
	},
	{
		id: "rsbuild",
		name: "Rsbuild",
		category: "build",
		mark: "rsbuild",
		officialUrl: "https://rsbuild.rs",
		summary: "Import it in the entry module and give the project Cirth's browsers.",
		docs: [
			{ text: "Rsbuild: CSS usage", url: "https://rsbuild.rs/guide/styling/css-usage" },
			{ text: "Rsbuild: Browserslist", url: "https://rsbuild.rs/guide/advanced/browserslist" },
		],
		toolchain: "Rsbuild lowers CSS for its default browserslist, which predates light-dark().",
		lowers: true,
		fix: "`browserslist` in `package.json`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Rsbuild 2.2.11 (`create-rsbuild`, vanilla)",
			result: "The default build lowered all 46 `light-dark()` values; with a browserslist at Cirth's floor, all 46 were kept.",
		},
	},
	// JavaScript frameworks
	{
		id: "angular",
		name: "Angular",
		category: "javascript",
		mark: "angular",
		officialUrl: "https://angular.dev",
		summary: "A path in the styles array of angular.json, or an @import.",
		docs: [
			{
				text: "Angular: workspace configuration, styles",
				url: "https://angular.dev/reference/configs/workspace-config",
			},
		],
		toolchain: "Angular's build keeps light-dark() and inlines the critical part into index.html, also unchanged.",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Angular 22.2.1 (`ng new`, CSS, no SSR)",
			result: "All 46 `light-dark()` values kept, in the stylesheet and in the critical CSS inlined into index.html.",
		},
	},
	{
		id: "astro",
		name: "Astro",
		category: "javascript",
		mark: "astro",
		officialUrl: "https://astro.build",
		summary: "Import it in a layout's frontmatter.",
		docs: [{ text: "Astro: Styles and CSS", url: "https://docs.astro.build/en/guides/styling/" }],
		toolchain: "Astro's build keeps light-dark() as it is.",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Astro 7.3.5 (`create astro`, minimal) on Vite 8.3.2",
			result: "All 46 `light-dark()` values kept with no configuration.",
		},
	},
	{
		id: "ember",
		name: "Ember",
		category: "javascript",
		mark: "ember",
		officialUrl: "https://emberjs.com",
		summary: "Import it in app/app.js; Embroider builds for your targets.",
		docs: [
			{ text: "Ember Guides: Vite", url: "https://guides.emberjs.com/release/build-tools/vite/" },
			{
				text: "Ember Guides: build targets",
				url: "https://guides.emberjs.com/release/configuring-ember/build-targets/",
			},
		],
		toolchain: "Embroider sets Vite's target from config/targets.js, which names current browsers.",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Ember 7.3 (`ember-cli` 7.3.0, Embroider and Vite 8.3.2)",
			result: "All 46 `light-dark()` values kept with the default targets.",
		},
	},
	{
		id: "fresh",
		name: "Fresh",
		category: "javascript",
		mark: "fresh",
		officialUrl: "https://usefresh.dev",
		summary: "Add the npm package and @import it in assets/styles.css.",
		docs: [
			{ text: "Fresh: Vite", url: "https://usefresh.dev/docs/advanced/vite" },
			{ text: "Fresh: static files", url: "https://usefresh.dev/docs/concepts/static-files" },
		],
		toolchain: "Fresh builds with Vite 7, whose CSS minifier keeps light-dark().",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Fresh 2.3.3 and @fresh/plugin-vite 1.1.2 (Vite 7.3.6) on Deno 2.9.7",
			result: "All 46 `light-dark()` values kept with no configuration.",
		},
	},
	{
		id: "lit",
		name: "Lit",
		category: "javascript",
		mark: "lit",
		officialUrl: "https://lit.dev",
		summary: "Adopt it in each component's shadow root.",
		docs: [{ text: "Lit: Styles", url: "https://lit.dev/docs/components/styles/" }],
		toolchain: "A stylesheet in the document does not reach a shadow root; the component adopts Cirth itself.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Lit 3.3.3 on Vite 8.3.2 (`create-vite` lit template)",
			result: "A button inside the component's shadow root took Cirth's styles; with `build.cssTarget` all 46 `light-dark()` values were kept.",
		},
	},
	{
		id: "nextjs",
		name: "Next.js",
		category: "javascript",
		mark: "nextjs",
		officialUrl: "https://nextjs.org",
		summary: "Import it in the root layout and give the project Cirth's browsers.",
		docs: [
			{ text: "Next.js: CSS", url: "https://nextjs.org/docs/app/getting-started/css" },
			{ text: "Next.js: supported browsers", url: "https://nextjs.org/docs/architecture/supported-browsers" },
		],
		toolchain: "Next compiles CSS for its default browsers and rewrites light-dark().",
		lowers: true,
		fix: "`browserslist` in `package.json`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Next.js 16.3.8 (`create-next-app`, App Router, TypeScript)",
			result: "The default build lowered all 46 `light-dark()` values; with a browserslist at Cirth's floor, all 46 were kept.",
		},
	},
	{
		id: "nuxt",
		name: "Nuxt",
		category: "javascript",
		mark: "nuxt",
		officialUrl: "https://nuxt.com",
		summary: "One entry in the css array and Vite's CSS target.",
		docs: [
			{ text: "Nuxt: Styling", url: "https://nuxt.com/docs/getting-started/styling" },
		],
		toolchain: "Nuxt builds with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`vite.build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Nuxt 4.5.2 (`nuxi init`, minimal template)",
			result: "The default build lowered all 46 `light-dark()` values; with `vite.build.cssTarget`, all 46 were kept.",
		},
	},
	{
		id: "preact",
		name: "Preact",
		category: "javascript",
		mark: "preact",
		officialUrl: "https://preactjs.com",
		summary: "Import it in src/main.jsx and set Vite's CSS target.",
		docs: [{ text: "Preact: Getting started", url: "https://preactjs.com/guide/v10/getting-started" }],
		toolchain: "Preact's starter builds with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Preact 10.29.8 on Vite 8.3.2 (`create-vite` preact template)",
			result: "Without `build.cssTarget` none of the 46 `light-dark()` values survived; with it, all 46.",
		},
	},
	{
		id: "qwik",
		name: "Qwik",
		category: "javascript",
		mark: "qwik",
		officialUrl: "https://qwik.dev",
		summary: "Import it in src/root.tsx; nothing else to set.",
		docs: [{ text: "Qwik: Styles", url: "https://qwik.dev/docs/components/styles/" }],
		toolchain: "Qwik's starter builds with Vite 7, whose CSS minifier keeps light-dark().",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Qwik 1.20.1 and Qwik City 1.20.1 (`create-qwik`) on Vite 7.3.1",
			result: "All 46 `light-dark()` values kept with no configuration.",
		},
	},
	{
		id: "react",
		name: "React",
		category: "javascript",
		mark: "react",
		officialUrl: "https://react.dev",
		summary: "Import it where the app mounts and set Vite's CSS target.",
		covers: ["React and Vite"],
		docs: [
			{ text: "React: Build a React app from scratch", url: "https://react.dev/learn/build-a-react-app-from-scratch" },
			{ text: "Vite: build.cssTarget", url: "https://vite.dev/config/build-options#build-csstarget" },
		],
		toolchain: "React's Vite starter rewrites light-dark() unless Vite is told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "React 19.3.0 on Vite 8.3.2 (`create-vite` react template)",
			result: "Without `build.cssTarget` none of the 46 `light-dark()` values survived; with it, all 46.",
		},
	},
	{
		id: "react-router",
		name: "React Router",
		category: "javascript",
		mark: "reactRouter",
		officialUrl: "https://reactrouter.com",
		summary: "Replace Tailwind in app/app.css and set Vite's CSS target.",
		docs: [
			{ text: "React Router: installation", url: "https://reactrouter.com/start/framework/installation" },
			{ text: "React Router: route module, links", url: "https://reactrouter.com/start/framework/route-module" },
		],
		toolchain: "Framework mode builds with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "React Router 8.4.0 (`create-react-router`, framework mode) on Vite 8.3.2",
			result: "The default build lowered all 46 `light-dark()` values; with `build.cssTarget`, all 46 were kept.",
		},
	},
	{
		id: "remix",
		name: "Remix",
		category: "javascript",
		mark: "remix",
		officialUrl: "https://remix.run",
		summary: "Serve it from public/ and link it in the document.",
		docs: [
			{ text: "Remix: guides", url: "https://remix.run/docs" },
			{ text: "Remix: assets package", url: "https://github.com/remix-run/remix/tree/main/packages/assets" },
		],
		toolchain: "Remix 3's asset server leaves light-dark() alone but loses ten of Cirth's data: icons; served as a static file, Cirth arrives intact.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Remix 3.0.0 (`remix new`) on Node 24.18.0",
			result: "From `public/` through `staticFiles()` the file arrived byte for byte and every icon loaded. Through the asset server, ten repeated `data:` icons became unresolved URLs, which 404 inside a `data-theme=\"dark\"` subtree.",
		},
	},
	{
		id: "solid",
		name: "Solid",
		category: "javascript",
		mark: "solid",
		officialUrl: "https://www.solidjs.com",
		summary: "Import it in src/index.jsx and set Vite's CSS target.",
		docs: [
			{ text: "Solid: styling your components", url: "https://docs.solidjs.com/guides/styling-your-components" },
		],
		toolchain: "Solid's Vite starter rewrites light-dark() unless Vite is told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Solid 1.9.15 on Vite 8.3.2 (`create-vite` solid template)",
			result: "Without `build.cssTarget` none of the 46 `light-dark()` values survived; with it, all 46.",
		},
	},
	{
		id: "solidstart",
		name: "SolidStart",
		category: "javascript",
		mark: "solidStart",
		officialUrl: "https://docs.solidjs.com/solid-start",
		summary: "Import it in src/app.jsx and set Vite's CSS target.",
		docs: [{ text: "SolidStart documentation", url: "https://docs.solidjs.com/solid-start" }],
		toolchain: "SolidStart 2 builds with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "SolidStart 2.0.5 (`create-solid --v2`) on Vite 8.3.2",
			result: "The default build lowered all 46 `light-dark()` values; with `build.cssTarget`, all 46 were kept.",
		},
	},
	{
		id: "svelte",
		name: "Svelte",
		category: "javascript",
		mark: "svelte",
		officialUrl: "https://svelte.dev",
		summary: "Import it in src/main.js and set Vite's CSS target.",
		docs: [{ text: "Svelte: Getting started", url: "https://svelte.dev/docs/svelte/getting-started" }],
		toolchain: "Svelte's Vite starter rewrites light-dark() unless Vite is told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Svelte 5.57.1 on Vite 8.3.2 (`create-vite` svelte template)",
			result: "Without `build.cssTarget` none of the 46 `light-dark()` values survived; with it, all 46.",
		},
	},
	{
		id: "sveltekit",
		name: "SvelteKit",
		category: "javascript",
		mark: "svelte",
		officialUrl: "https://svelte.dev/docs/kit",
		summary: "Import it in the root layout and set Vite's CSS target.",
		docs: [{ text: "SvelteKit: Routing, +layout", url: "https://svelte.dev/docs/kit/routing" }],
		toolchain: "SvelteKit builds with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "SvelteKit 3.0.0 (`sv create`, minimal) on Vite 8.3.2",
			result: "The default build lowered all 46 `light-dark()` values; with `build.cssTarget`, all 46 were kept.",
		},
	},
	{
		id: "vike",
		name: "Vike",
		category: "javascript",
		mark: "vike",
		officialUrl: "https://vike.dev",
		summary: "Import it in pages/+Layout and set Vite's CSS target.",
		docs: [{ text: "Vike: Layout", url: "https://vike.dev/Layout" }],
		toolchain: "Vike builds with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Vike 0.4.267 with React on Vite 8.3.2",
			result: "The default build lowered all 46 `light-dark()` values; with `build.cssTarget`, all 46 were kept.",
		},
	},
	{
		id: "vue",
		name: "Vue",
		category: "javascript",
		mark: "vue",
		officialUrl: "https://vuejs.org",
		summary: "Import it in src/main.js and set Vite's CSS target.",
		docs: [{ text: "Vue: Quick start", url: "https://vuejs.org/guide/quick-start" }],
		toolchain: "Vue's Vite starter rewrites light-dark() unless Vite is told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Vue 3.5.43 on Vite 8.3.2 (`create-vite` vue template)",
			result: "Without `build.cssTarget` none of the 46 `light-dark()` values survived; with it, all 46.",
		},
	},
	{
		id: "waku",
		name: "Waku",
		category: "javascript",
		mark: null,
		noMark: "Waku publishes no logo or trademark terms (its repository's MIT licence covers the code, not the mark), so the guide is named by text alone.",
		officialUrl: "https://waku.gg",
		summary: "Replace Tailwind in src/styles.css and set Vite's CSS target.",
		docs: [{ text: "Waku: guides", url: "https://waku.gg/guides" }],
		toolchain: "Waku builds with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`vite.build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Waku 1.0.0-rc.2 on Vite 8.3.2",
			result: "The default build lowered all 46 `light-dark()` values; with `vite.build.cssTarget`, all 46 were kept.",
		},
	},
	// HTML-first libraries
	{
		id: "htmx",
		name: "htmx",
		category: "html",
		mark: "htmx",
		officialUrl: "https://htmx.org",
		summary: "Link it once in the page htmx swaps into.",
		docs: [{ text: "htmx: documentation", url: "https://htmx.org/docs/" }],
		toolchain: "htmx swaps HTML into a page that already has the stylesheet; nothing to build.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "htmx 2.0.11, served by Express 5.2.1",
			result: "A fragment swapped in by `hx-get` was styled on arrival, invalid field included.",
		},
	},
	{
		id: "stimulus",
		name: "Stimulus",
		category: "html",
		mark: null,
		noMark: "Stimulus publishes no logo terms: the repository behind stimulus.hotwired.dev states no licence, and 37signals' brand guidelines are about not imitating its products, not about showing their logos. The guide is named by text alone.",
		officialUrl: "https://stimulus.hotwired.dev",
		summary: "Let controllers set the attributes Cirth already styles.",
		docs: [{ text: "Stimulus Handbook", url: "https://stimulus.hotwired.dev/handbook/introduction" }],
		toolchain: "Stimulus adds no CSS step; the stylesheet comes from whatever builds the page.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Stimulus 3.2.2 on Vite 8.3.2",
			result: "A controller that set `aria-busy` on a button drew Cirth's busy state.",
		},
	},
	// Backend frameworks: server-rendered ones and HTTP servers alike
	{
		id: "adonisjs",
		name: "AdonisJS",
		category: "backend",
		mark: "adonisjs",
		officialUrl: "https://adonisjs.com",
		summary: "Import it in resources/css/app.css and set Vite's CSS target.",
		docs: [{ text: "AdonisJS: Vite", url: "https://docs.adonisjs.com/guides/frontend/vite" }],
		toolchain: "AdonisJS bundles with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "AdonisJS 7.5.2 (hypermedia starter kit), @adonisjs/vite 6.0.3 on Vite 8.3.2",
			result: "The default build lowered all 46 `light-dark()` values; with `build.cssTarget`, all 46 were kept.",
		},
	},
	{
		id: "aspnet-core",
		name: "ASP.NET Core",
		category: "backend",
		mark: "dotnet",
		officialUrl: "https://dotnet.microsoft.com/apps/aspnet",
		summary: "A file in wwwroot, fingerprinted by MapStaticAssets.",
		docs: [
			{
				text: "ASP.NET Core: static files",
				url: "https://learn.microsoft.com/aspnet/core/fundamentals/static-files",
			},
		],
		toolchain: "Static web assets are copied unchanged, compressed beside the original and fingerprinted.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: ".NET SDK 10.0.401 (`dotnet new webapp`, Razor Pages)",
			result: "The published app linked a fingerprinted copy and rendered it.",
		},
	},
	{
		id: "blazor",
		name: "Blazor",
		category: "backend",
		mark: "dotnet",
		officialUrl: "https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor",
		summary: "A file in wwwroot, linked through @Assets in App.razor.",
		docs: [
			{
				text: "Blazor: static files",
				url: "https://learn.microsoft.com/aspnet/core/blazor/fundamentals/static-files",
			},
		],
		toolchain: "Static web assets are copied unchanged, compressed beside the original and fingerprinted.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: ".NET SDK 10.0.401 (`dotnet new blazor`, Interactive Server)",
			result: "The published app linked a fingerprinted copy; markup added by an interactive re-render was styled.",
		},
	},
	{
		id: "django",
		name: "Django",
		category: "backend",
		mark: "django",
		officialUrl: "https://www.djangoproject.com",
		summary: "A static file in your app, linked with the static tag.",
		docs: [
			{
				text: "Django: How to manage static files",
				url: "https://docs.djangoproject.com/en/6.1/howto/static-files/",
			},
		],
		toolchain: "collectstatic and ManifestStaticFilesStorage copy the file unchanged under a hashed name.",
		verified: {
			status: "verified",
			date: "2026-10-01",
			with: "Django 6.1.1 (startproject and startapp)",
			result: "It rendered under `runserver`, and `collectstatic` with `ManifestStaticFilesStorage` wrote a byte-identical hashed copy that the template resolved with `DEBUG` off.",
		},
	},
	{
		id: "flask",
		name: "Flask",
		category: "backend",
		mark: "flask",
		officialUrl: "https://flask.palletsprojects.com",
		summary: "A file in static/, linked with url_for.",
		docs: [{ text: "Flask: static files", url: "https://flask.palletsprojects.com/en/stable/tutorial/static/" }],
		toolchain: "Flask serves static/ as it is.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Flask 3.1.3 on Python 3.13.7",
			result: "The page rendered with the file served from `static/`.",
		},
	},
	{
		id: "laravel",
		name: "Laravel",
		category: "backend",
		mark: "laravel",
		officialUrl: "https://laravel.com",
		summary: "Import it in resources/css/app.css, in place of Tailwind, and set Vite's CSS target.",
		docs: [{ text: "Laravel: Asset bundling (Vite)", url: "https://laravel.com/docs/vite" }],
		toolchain: "Laravel bundles with Vite 8, which rewrites light-dark() unless told the target.",
		lowers: true,
		fix: "`build.cssTarget`",
		verified: {
			status: "verified",
			date: "2026-10-01",
			with: "Laravel 13.34.0 (`composer create-project`), Vite 8.3.2 and laravel-vite-plugin 3.2.0",
			result: "Without `build.cssTarget` the build kept none of the 46 `light-dark()` values and a forced-dark subtree stayed light; with it, all 46 and the subtree turned dark.",
		},
	},
	{
		id: "livewire",
		name: "Livewire",
		category: "backend",
		mark: null,
		noMark: "Livewire publishes no logo or trademark terms (its repository's MIT licence covers the code, not the mascot or the wordmark), so the guide is named by text alone.",
		officialUrl: "https://livewire.laravel.com",
		summary: "Cirth comes from Laravel's Vite build; Livewire's updates keep it.",
		docs: [{ text: "Livewire: installation", url: "https://livewire.laravel.com/docs/installation" }],
		toolchain: "Livewire injects its own small styles and morphs the DOM; it does not touch the stylesheet.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Livewire 4.4.7 on Laravel 13.34.0 and Vite 8.3.2",
			result: "Markup a component added after `wire:click` was styled once Livewire morphed it in.",
		},
	},
	{
		id: "phoenix",
		name: "Phoenix",
		category: "backend",
		mark: "phoenix",
		officialUrl: "https://www.phoenixframework.org",
		summary: "Installed into assets/ and bundled by esbuild.",
		covers: ["Phoenix LiveView"],
		docs: [{ text: "Phoenix: Asset management", url: "https://hexdocs.pm/phoenix/asset_management.html" }],
		toolchain: "esbuild bundles and minifies the file and keeps light-dark().",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-01",
			with: "Phoenix 1.8.15 (`mix phx.new --no-tailwind`), esbuild 0.25.4, Elixir 1.20.4 on OTP 28",
			result: "`mix assets.deploy` kept all 46 `light-dark()` values. esbuild warns about one empty `:is()` in 0.16.0; the rule still works in every browser.",
		},
	},
	{
		id: "rails",
		name: "Rails",
		category: "backend",
		mark: "rails",
		officialUrl: "https://rubyonrails.org",
		summary: "A file in vendor/assets, linked before the app's own stylesheets.",
		docs: [
			{ text: "Rails Guides: The Asset Pipeline", url: "https://guides.rubyonrails.org/asset_pipeline.html" },
		],
		toolchain: "Propshaft copies the file unchanged under a digest.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Rails 8.1.4 with Propshaft 1.3.2 on Ruby 4.0.7",
			result: "`assets:precompile` wrote a byte-identical digested copy, and the production server linked and rendered it.",
		},
	},
	{
		id: "symfony",
		name: "Symfony",
		category: "backend",
		mark: null,
		noMark: "The Symfony trademark and logo policy asks for written permission for any use of the logo, so the guide is named by text alone.",
		officialUrl: "https://symfony.com",
		summary: "Require it through AssetMapper's importmap and import it in app.js.",
		docs: [
			{ text: "Symfony: AssetMapper", url: "https://symfony.com/doc/current/frontend/asset_mapper.html" },
		],
		toolchain: "AssetMapper downloads the file from the npm registry's CDN and serves it unchanged under a digest.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Symfony 8.1.8 with AssetMapper 8.1.8 on PHP 8.5.8",
			result: "`importmap:require` fetched the file; `asset-map:compile` wrote a byte-identical digested copy, which the page linked.",
		},
	},
	{
		id: "elysia",
		name: "Elysia",
		category: "backend",
		mark: "elysia",
		officialUrl: "https://elysiajs.com",
		summary: "Serve dist/ with the static plugin and link it.",
		docs: [{ text: "Elysia: static plugin", url: "https://elysiajs.com/plugins/static" }],
		toolchain: "The static plugin serves the file as it is, as text/css.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Elysia 1.4.30 and @elysiajs/static 1.4.10 on Bun 1.4.2",
			result: "The stylesheet was served as text/css and the page rendered with it.",
		},
	},
	{
		id: "express",
		name: "Express",
		category: "backend",
		mark: "express",
		officialUrl: "https://expressjs.com",
		summary: "Serve dist/ with express.static and link it.",
		docs: [{ text: "Express: serving static files", url: "https://expressjs.com/en/starter/static-files.html" }],
		toolchain: "express.static serves the file as it is.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Express 5.2.1 on Node 24.18.0",
			result: "The stylesheet was served as text/css and the page rendered with it.",
		},
	},
	// Content management
	{
		id: "wordpress",
		name: "WordPress",
		category: "cms",
		mark: "wordpress",
		officialUrl: "https://wordpress.org",
		summary: "Enqueued from your theme's functions.php.",
		docs: [
			{
				text: "WordPress: Including assets",
				url: "https://developer.wordpress.org/themes/basics/including-css-javascript/",
			},
		],
		toolchain: "wp_enqueue_style links the file as it is, with ?ver= for cache busting.",
		verified: {
			status: "verified",
			date: "2026-10-01",
			with: "WordPress 7.1.2 on PHP 8.3, run by WordPress Playground CLI, with a classic theme",
			result: "The stylesheet arrived as enqueued, with `?ver=` and the version.",
		},
	},
	// Static site generators
	{
		id: "eleventy",
		name: "Eleventy",
		category: "static",
		mark: null,
		noMark: "Eleventy publishes no logo or trademark terms (the 11ty/logo repository states no licence, and the code's MIT licence does not cover the mark), so the guide is named by text alone.",
		officialUrl: "https://www.11ty.dev",
		summary: "Copy the file through and link it.",
		docs: [{ text: "Eleventy: Passthrough file copy", url: "https://www.11ty.dev/docs/copy/" }],
		toolchain: "Passthrough copy writes the file unchanged.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Eleventy 3.1.6, with an ES module config and with a CommonJS one",
			result: "The copy in `_site` was byte-identical either way. This documentation site is itself built with Eleventy and Cirth.",
		},
	},
	{
		id: "hugo",
		name: "Hugo",
		category: "static",
		mark: "hugo",
		officialUrl: "https://gohugo.io",
		summary: "A file in assets/, fingerprinted by Hugo Pipes.",
		docs: [
			{ text: "Hugo: resources.Fingerprint", url: "https://gohugo.io/functions/resources/fingerprint/" },
		],
		toolchain: "Hugo Pipes fingerprints the file and writes its SRI hash; minify also keeps light-dark().",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Hugo 0.167.0 extended",
			result: "The fingerprinted file kept all 46 `light-dark()` values, with and without `minify`.",
		},
	},
	{
		id: "zola",
		name: "Zola",
		category: "static",
		mark: "zola",
		officialUrl: "https://www.getzola.org",
		summary: "A file in static/, linked with get_url and a cache-busting hash.",
		docs: [{ text: "Zola: templates, get_url", url: "https://www.getzola.org/documentation/templates/overview/" }],
		toolchain: "Zola copies static/ unchanged.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Zola 0.23.6",
			result: "The copy in `public/` was byte-identical and linked with its hash.",
		},
	},
	// Electron is a JavaScript runtime for desktop apps; its guide sits with
	// the JavaScript frameworks.
	{
		id: "electron",
		name: "Electron",
		category: "javascript",
		mark: "electron",
		officialUrl: "https://www.electronjs.org",
		summary: "Link it from the renderer's page and allow data: images in the CSP.",
		docs: [
			{ text: "Electron: security, Content Security Policy", url: "https://www.electronjs.org/docs/latest/tutorial/security" },
		],
		toolchain: "Electron loads the file as it is; a Content Security Policy decides whether Cirth's icons load.",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Electron 44.5.1 (Chromium 152)",
			result: "The window followed the system scheme and a forced-dark subtree; with `img-src` lacking `data:`, the CSP blocked Cirth's icons, and with it none were blocked.",
		},
	},
	// WebAssembly and Rust
	{
		id: "dioxus",
		name: "Dioxus",
		category: "rust",
		mark: null,
		noMark: "The Dioxus brand repository (github.com/DioxusLabs/brand) allows the logo \"for your own projects\", not commercially, and says nothing of a third-party site showing it to name Dioxus, so the guide is named by text alone.",
		officialUrl: "https://dioxuslabs.com",
		summary: "An asset!() with minification off, linked by document::Stylesheet.",
		docs: [{ text: "Dioxus: Assets", url: "https://dioxuslabs.com/learn/0.7/essentials/ui/assets" }],
		toolchain: "Dioxus's asset pipeline minifies CSS for older browsers in release builds and rewrites light-dark().",
		lowers: true,
		fix: "`with_minify(false)` on the asset",
		verified: {
			status: "verified",
			date: "2026-10-02",
			with: "Dioxus 0.7.10 (`dx bundle --release`, web)",
			result: "By default the release bundle lowered all 46 `light-dark()` values; with minification off, the copy was byte-identical.",
		},
	},
	{
		id: "yew",
		name: "Yew",
		category: "rust",
		mark: "yew",
		officialUrl: "https://yew.rs",
		summary: "One Trunk link in index.html.",
		docs: [{ text: "Trunk: assets", url: "https://trunkrs.dev/assets/" }],
		toolchain: "Trunk copies the file, adds an integrity hash, and with --minify keeps light-dark().",
		lowers: false,
		verified: {
			status: "verified",
			date: "2026-10-01",
			with: "Yew 0.23.0 (csr) and Trunk 0.21.14",
			result: "`trunk build --release` copied the file byte for byte; with `--minify` all 46 `light-dark()` values were kept.",
		},
	},
];

// Integrations that are not guides here, and why: each exists to run
// another CSS framework, or is a way of installing that every guide already
// covers. A test keeps them out of the list.
const excluded = [
	{ name: "Tailwind CSS CLI", reason: "runs another CSS framework" },
	{ name: "Tailwind CSS Standalone", reason: "runs another CSS framework" },
	{ name: "UnoCSS", reason: "an atomic CSS engine, another CSS framework" },
	{ name: "Bun dev server", reason: "a package manager's server; every npm guide covers Bun" },
	{ name: "npm", reason: "a package manager; every guide offers it" },
	{ name: "pnpm", reason: "a package manager; every guide offers it" },
	{ name: "Yarn", reason: "a package manager; every guide offers it" },
];

for (const mark of Object.values(marks)) {
	mark.aspect = aspect(mark.file);
	if (mark.dark) {
		const dark = aspect(mark.dark);
		// A project's dark variant is normally the same drawing in other
		// colours. Django's is not: the negative logo sits on its own green
		// field, so its frame is wider. It is still the project's file,
		// unmodified, and the page sizes it by its own ratio.
		if (Math.abs(dark - mark.aspect) > 0.01) mark.darkAspect = dark;
	}
}

// A logo is shown only with its provenance and its owner's own terms, all
// four named. "No terms stated" is not a term: a mark whose owner states
// none is not shown, and its guide carries `noMark` instead.
const placeholderTerms = /^\s*$|\bno\s+(?:terms|licen[cs]e|policy)\b|not\s+stated|unknown|\btbd\b|\btodo\b/i;
for (const [id, mark] of Object.entries(marks)) {
	for (const field of /** @type {const} */ (["source", "owner", "terms", "termsUrl"])) {
		if (typeof mark[field] !== "string" || mark[field].trim() === "") {
			throw new Error(`frameworks.js: mark ${id} has no ${field}`);
		}
	}
	if (placeholderTerms.test(mark.terms)) {
		throw new Error(`frameworks.js: mark ${id} names no terms ("${mark.terms}"); give the guide noMark instead`);
	}
	if (!/^https:\/\//.test(mark.source) || !/^https:\/\//.test(mark.termsUrl)) {
		throw new Error(`frameworks.js: mark ${id} needs an https source and terms URL`);
	}
	if (!guides.some((guide) => guide.mark === id)) {
		throw new Error(`frameworks.js: mark ${id} is not used by any guide`);
	}
}

for (const guide of guides) {
	if (guide.mark && guide.noMark) {
		throw new Error(`frameworks.js: ${guide.id} has a mark and says it has none`);
	}
	if (guide.mark === null && (typeof guide.noMark !== "string" || guide.noMark.trim().length < 20)) {
		throw new Error(`frameworks.js: ${guide.id} has no mark and does not say why`);
	}
	if (!categories.some((category) => category.id === guide.category)) {
		throw new Error(`frameworks.js: ${guide.id} has unknown category ${guide.category}`);
	}
	if (guide.mark !== null && !marks[guide.mark]) {
		throw new Error(`frameworks.js: ${guide.id} names unknown mark ${guide.mark}`);
	}
	if (!(guide.verified.status in statuses)) {
		throw new Error(`frameworks.js: ${guide.id} has unknown status ${guide.verified.status}`);
	}
	if (guide.lowers && !guide.fix) {
		throw new Error(`frameworks.js: ${guide.id} rewrites light-dark() and does not say what to set`);
	}
	if (!/^https:\/\//.test(guide.officialUrl)) {
		throw new Error(`frameworks.js: ${guide.id} has no official https URL`);
	}
}

const byName = (/** @type {Guide} */ a, /** @type {Guide} */ b) =>
	a.name.localeCompare(b.name, "en", { sensitivity: "base" });

// The guides with everything a page needs to draw one: its route, its
// mark, its category's names and its status's words.
const entries = guides.map((guide) => ({
	...guide,
	link: `/installation/${guide.id}`,
	markData: guide.mark ? marks[guide.mark] : null,
	categoryText: /** @type {(typeof categories)[number]} */ (
		categories.find((category) => category.id === guide.category)
	).text,
	categoryShort: /** @type {(typeof categories)[number]} */ (
		categories.find((category) => category.id === guide.category)
	).short,
	status: statuses[guide.verified.status],
}));

// The guides grouped for the Installation page and the sidebar, in the
// order of `categories`, alphabetical inside each.
const groups = categories
	.map((category) => ({
		...category,
		guides: entries.filter((guide) => guide.category === category.id).sort(byName),
	}))
	.filter((group) => group.guides.length > 0);

// The marks the home page shows, one or two per ecosystem: bundlers and
// client frameworks, backend frameworks in five languages, a CMS, a static
// site generator and Rust. None of them needs a notice where it appears.
const featured = [
	"vite",
	"react",
	"vue",
	"svelte",
	"angular",
	"astro",
	"laravel",
	"django",
	"rails",
	"phoenix",
	"aspnet-core",
	"flask",
	"wordpress",
	"htmx",
	"hugo",
	"yew",
];

// The pager walks the guides in the order the sidebar lists them.
const ordered = groups.flatMap((group) => group.guides);

module.exports = {
	retrieved,
	marks,
	categories,
	statuses,
	cssTarget,
	excluded,
	guides: ordered,
	groups,
	count: ordered.length,
	verifiedCount: ordered.filter((guide) => guide.verified.status === "verified").length,
	// What each stack's build does to Cirth's colours, for Compatibility.
	pipelines: {
		lowers: ordered.filter((guide) => guide.lowers === true),
		keeps: ordered.filter((guide) => guide.lowers === false),
		asIs: ordered.filter((guide) => guide.lowers === undefined),
	},
	checkedBetween: [
		ordered.map((guide) => guide.verified.date).sort()[0],
		ordered.map((guide) => guide.verified.date).sort().at(-1),
	],
	// The notices some projects' terms ask for wherever their logo appears.
	notices: Object.values(marks)
		.map((mark) => mark.attribution)
		.filter(Boolean),
	byId: Object.fromEntries(ordered.map((guide) => [guide.id, guide])),
	featured: featured.map((id) => {
		const guide = ordered.find((entry) => entry.id === id);
		if (!guide?.markData || guide.markData.attribution) {
			throw new Error(`frameworks.js: featured ${id} is not a guide with a mark that needs no notice`);
		}
		return guide;
	}),
};
