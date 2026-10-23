// Site navigation config.

const siteTitle = "Cirth";
const siteDescription =
	"Semantic-first CSS framework for usable interfaces, with optional layout classes and no shipped JavaScript runtime.";

// "Docs" opens the documentation where it begins, with why; "Get started"
// (the home page, the footer) skips straight to installing it. "Source" is
// the repository, the one link here that leaves the site.
const topNav = [
	{ text: "Docs", link: "/why-cirth" },
	{ text: "Examples", link: "/examples" },
	{ text: "Source", link: "https://github.com/cirthcss/cirth", external: true },
];

// The integration guides, from the one list in frameworks.js. Their index is
// separate from the installation quickstart, so choosing a stack never
// interrupts the basic path. A category has no page; its `anchor` is its
// heading on the Framework guides page. Guides are not in the reading order.
const { groups } = require("./frameworks.js");
const frameworks = groups.map(({ id, text, guides }) => ({
	text,
	id,
	anchor: `/framework-guides/#guides-${id}`,
	items: guides.map(({ name, link }) => ({ text: name, link })),
}));

const sidebar = [
	// Why to choose it, whether it fits the browsers and the project, how
	// to install it. Customization, the next group, is how to make it yours.
	{
		text: "Start",
		items: [
			{ text: "Why Cirth", link: "/why-cirth" },
			{ text: "Compatibility", link: "/compatibility" },
			{ text: "Installation", link: "/installation" },
			{ text: "Package and builds", link: "/package" },
			{ text: "Framework guides", link: "/framework-guides", items: frameworks },
		],
	},
	{
		text: "Customization",
		items: [
			{ text: "Overview", link: "/customization" },
			{ text: "Token reference", link: "/tokens" },
			{ text: "Colors", link: "/colors" },
			{ text: "Themes", link: "/themes" },
			{ text: "Presets", link: "/presets" },
		],
	},
	{
		text: "Layout",
		items: [
			{ text: "Document", link: "/layout/document" },
			{ text: "Landmarks", link: "/layout/landmarks" },
			{ text: "Container", link: "/layout/container" },
			{ text: "Section", link: "/layout/section" },
			{ text: "Grid", link: "/layout/grid" },
			{ text: "Row", link: "/layout/row" },
			{ text: "Overflow auto", link: "/layout/overflow-auto" },
		],
	},
	{
		text: "Content",
		items: [
			{ text: "Typography", link: "/content/typography" },
			{ text: "Link", link: "/content/link" },
			{ text: "Button", link: "/content/button" },
			{ text: "Table", link: "/content/table" },
			{ text: "Description list", link: "/content/description-list" },
			{ text: "Code", link: "/content/code" },
			{ text: "Figure", link: "/content/figure" },
			{ text: "Embedded content", link: "/content/embedded" },
			{ text: "Misc", link: "/content/misc" },
		],
	},
	{
		text: "Forms",
		items: [
			{ text: "Overview", link: "/forms/" },
			{ text: "Text inputs", link: "/forms/text-inputs" },
			{ text: "Select", link: "/forms/select" },
			{ text: "Textarea", link: "/forms/textarea" },
			{ text: "Validation and states", link: "/forms/validation" },
			{ text: "Checkbox, radio and switch", link: "/forms/checkbox-radio-switch" },
			{ text: "Color", link: "/forms/input-color" },
			{ text: "Date", link: "/forms/input-date" },
			{ text: "File", link: "/forms/input-file" },
			{ text: "Range", link: "/forms/input-range" },
			{ text: "Search", link: "/forms/input-search" },
		],
	},
	{
		text: "Components",
		items: [
			{ text: "Accordion", link: "/components/accordion" },
			{ text: "Card", link: "/components/card" },
			{ text: "Dropdown", link: "/components/dropdown" },
			{ text: "Group", link: "/components/group" },
			{ text: "Loading", link: "/components/loading" },
			{ text: "Meter", link: "/components/meter" },
			{ text: "Modal", link: "/components/modal" },
			{ text: "Nav", link: "/components/nav" },
			{ text: "Popover", link: "/components/popover" },
			{ text: "Progress", link: "/components/progress" },
		],
	},
	{
		text: "Guides",
		items: [
			{ text: "Accessibility and user preferences", link: "/guides/accessibility" },
			{ text: "Using Cirth with existing CSS", link: "/guides/existing-css" },
			{ text: "Delivery and deployment", link: "/delivery" },
		],
	},
	{
		text: "Utilities",
		items: [
			{ text: "Screen-reader only", link: "/utilities/sr-only" },
			{ text: "Truncate", link: "/utilities/truncate" },
			{ text: "Breakout", link: "/utilities/breakout" },
			{ text: "Print", link: "/utilities/print" },
		],
	},
	{
		text: "Project",
		items: [
			{ text: "Upgrading", link: "/upgrading" },
			{ text: "About", link: "/about" },
			{ text: "Contributions", link: "/contributions" },
			{ text: "Brand", link: "/brand" },
			{ text: "Attributions", link: "/attributions" },
			{ text: "Markup comparison", link: "/markup-comparison" },
		],
	},
];

// Pages that moved when the documentation was reorganised. Each old path
// still builds a page (docs/src/pages/moved.njk) that names the new one,
// points a canonical link at it and forwards the reader there, so a
// bookmark or a search result from before the move still lands. `anchors`
// maps a fragment whose content moved to a different page; any other
// fragment is carried across unchanged.
const redirects = [
	{
		from: "/get-started/",
		to: "/installation/",
		title: "Installation",
		anchors: {
			"excluding-a-third-party-component":
				"/guides/existing-css/#excluding-a-third-party-component",
		},
	},
	{
		from: "/deploy/",
		to: "/delivery/",
		title: "Delivery and deployment",
		anchors: {
			"what-a-smaller-stylesheet-actually-buys": "/delivery/#compression",
		},
	},
	{
		from: "/utilities/accessibility/",
		to: "/guides/accessibility/",
		title: "Accessibility and user preferences",
		anchors: {},
	},
	{
		from: "/utilities/high-contrast/",
		to: "/guides/accessibility/#increased-contrast",
		title: "Accessibility and user preferences",
		anchors: {},
	},
	{
		from: "/utilities/reduce-motion/",
		to: "/guides/accessibility/#reduced-motion",
		title: "Accessibility and user preferences",
		anchors: {},
	},
	// The CDN guide repeated the Installation page's first section. The
	// quickstart lives there now, while advanced delivery and build selection
	// have their own authoritative pages.
	{
		from: "/installation/cdn/",
		to: "/installation/#cdn",
		title: "Installation",
		anchors: {
			"1-link-it": "/installation/#cdn",
			"2-write-html": "/installation/#minimal-page",
			"choosing-a-build": "/package/#screen-builds",
			"print-and-presets": "/package/#companion-files",
		},
	},
	// For a while the JavaScript guides were one page with a section each.
	// Each tool has its own page again; a link to a section of the old page
	// lands on that tool's page.
	// Remix v2 continues as React Router v7, whose guide covers it.
	{
		from: "/installation/remix/",
		to: "/installation/react-router/",
		title: "Install Cirth for React Router",
		anchors: {},
	},
	// Spring Boot had one guide for Thymeleaf and one for JSP; both are now
	// sections of a single guide.
	{
		from: "/installation/spring-boot-thymeleaf/",
		to: "/installation/spring-boot/#thymeleaf",
		title: "Install Cirth for Spring Boot",
		anchors: {},
	},
	{
		from: "/installation/spring-boot-jsp/",
		to: "/installation/spring-boot/#jsp",
		title: "Install Cirth for Spring Boot",
		anchors: {},
	},
	{
		from: "/installation/javascript/",
		to: "/framework-guides/",
		title: "Framework guides",
		anchors: {
			vite: "/installation/vite/",
			react: "/installation/react/",
			vue: "/installation/vue/",
			nuxt: "/installation/nuxt/",
			sveltekit: "/installation/sveltekit/",
			astro: "/installation/astro/",
			"1-install": "/installation/vite/#1-install",
			"2-import-it": "/installation/vite/#2-import-it",
			"3-set-the-css-target": "/installation/vite/#3-set-the-css-target",
			"4-write-html": "/installation/vite/",
		},
	},
];

// Where a reader goes next, not a second index of the reference: the
// sidebar is that. Three paths: starting, the project, and the people.
const footerLinks = [
	{
		title: "Start",
		items: [
			{ text: "Get started", link: "/installation" },
			{ text: "Why Cirth", link: "/why-cirth" },
			{ text: "Examples", link: "/examples" },
			{ text: "Customization", link: "/customization" },
		],
	},
	{
		title: "Project",
		items: [
			{ text: "About", link: "/about" },
			{ text: "Brand", link: "/brand" },
			{ text: "Contributions", link: "/contributions" },
			{ text: "Changelog", link: "https://github.com/cirthcss/cirth/blob/master/CHANGELOG.md" },
			{ text: "npm", link: "https://www.npmjs.com/package/@cirthcss/cirth" },
		],
	},
	{
		title: "Community",
		items: [
			{ text: "GitHub", link: "https://github.com/cirthcss/cirth" },
			{ text: "Discussions", link: "https://github.com/orgs/cirthcss/discussions" },
			{ text: "Issues", link: "https://github.com/cirthcss/cirth/issues" },
			{ text: "Contributors", link: "https://github.com/cirthcss/cirth/graphs/contributors" },
		],
	},
];

const footer = {
	message: "Released under the Apache License 2.0.",
	copyright: "Copyright © 2025-present Riccardo Pastori",
};

// Page URLs end in "/" and the links above do not.
/** @param {string} link */
const withSlash = (link) => (link.endsWith("/") ? link : `${link}/`);

// The order the documentation is read in, which is not the sidebar's tree:
// every page a group lists, in the sidebar's order, and none of the pages
// nested under one. A guide is read by whoever uses that stack and by no
// one else, so a chain of every guide between Installation and
// Customization would be a detour every reader had to walk.
const readingOrder = sidebar.flatMap((group) =>
	group.items.map(({ items, ...page }) => ({ ...page, group: group.text })),
);

// What the pager offers on each page, keyed by URL. A page in the reading
// order leads to its neighbours there. A nested page (a guide) is a step
// out of it: it goes back to the page it is nested under, and on to the
// page that follows that one, so every guide returns to the same place and
// none leads to another. A category inside Installation has no route and
// is never a destination.
/** @type {Record<string, { prev?: (typeof readingOrder)[number], next?: (typeof readingOrder)[number] }>} */
const pager = {};
readingOrder.forEach((page, index) => {
	pager[withSlash(page.link)] = { prev: readingOrder[index - 1], next: readingOrder[index + 1] };
});
for (const item of sidebar.flatMap((group) => group.items)) {
	if (!item.items) continue;
	const { next } = pager[withSlash(item.link)];
	const parent = readingOrder.find((page) => page.link === item.link);
	for (const child of item.items.flatMap((entry) => entry.items ?? [entry])) {
		pager[withSlash(child.link)] = { prev: parent, next };
	}
}

module.exports = {
	siteTitle,
	siteDescription,
	topNav,
	sidebar,
	frameworks,
	redirects,
	footerLinks,
	footer,
	readingOrder,
	pager,
};
