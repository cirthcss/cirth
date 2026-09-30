// Site navigation config, ported 1:1 from the previous src/lib/nav.ts.

const siteTitle = "Cirth";
const siteDescription =
	"HTML-native CSS framework. Production-ready UI from semantic HTML: no class vocabulary to learn, 0 JavaScript.";

const topNav = [
	{ text: "Docs", link: "/installation" },
	{ text: "Examples", link: "/examples" },
];

// The framework guides, from the one list in frameworks.js: the sidebar
// group below, the Installation page, the home page and each guide's own
// header all read it.
const { guides } = require("./frameworks.js");
const frameworks = guides.map(({ text, link, summary }) => ({ text, link, summary }));

const sidebar = [
	{
		text: "Introduction",
		items: [
			{ text: "Why Cirth", link: "/why-cirth" },
			{ text: "Installation", link: "/installation" },
			{ text: "Compatibility", link: "/compatibility" },
			{ text: "Upgrading", link: "/upgrading" },
		],
	},
	{
		text: "Frameworks",
		items: frameworks.map(({ text, link }) => ({ text, link })),
	},
	{
		text: "Customization",
		items: [
			{ text: "Overview", link: "/customization" },
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
			{ text: "About", link: "/about" },
			{ text: "Contributions", link: "/contributions" },
			{ text: "Brand", link: "/brand" },
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
				"/compatibility/#excluding-a-third-party-component",
		},
	},
	{
		from: "/deploy/",
		to: "/compatibility/",
		title: "Compatibility",
		anchors: {
			"what-a-smaller-stylesheet-actually-buys": "/about/#why-small-matters-here",
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

module.exports = {
	siteTitle,
	siteDescription,
	topNav,
	sidebar,
	frameworks,
	redirects,
	footerLinks,
	footer,
	github: "https://github.com/cirthcss/cirth",
	// Flat, ordered list of every doc page: drives prev/next footer links.
	// Each entry carries its group so the pager can say where it leads.
	flatPages: sidebar.flatMap((group) =>
		group.items.map((item) => ({ ...item, group: group.text })),
	),
};
