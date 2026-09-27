// The examples showcase (docs/src/pages/examples.njk), as data.
//
// Each example is a snippet in docs/src/content/demos/, rendered by the
// same `demo` shortcode as every other live example on the site, so the
// markup a reader copies from "Show HTML" is the markup on the page. Grouped
// by the kind of screen it belongs to, and each one names the documented
// elements it is built from, so the showcase is also a way into the
// reference.
//
// Adding one: write the snippet, add an entry here. `frame: "narrow"` gives
// a screen that is narrow by nature (a sign-in card) a narrower stage, which
// is the frame's width, not a change to the example.

/** @param {string} text @param {string} link */
const use = (text, link) => ({ text, link });

module.exports = [
	{
		id: "application",
		title: "Application",
		summary: "The chrome and the data screens of an internal tool.",
		items: [
			{
				demo: "example-app-navigation",
				title: "App navigation",
				summary: "A navigation bar with an account menu, a breadcrumb trail and a search field.",
				uses: [
					use("Nav", "/components/nav"),
					use("Dropdown", "/components/dropdown"),
					use("Group", "/components/group"),
				],
			},
			{
				demo: "example-dashboard",
				title: "Dashboard",
				summary: "Metric cards in a wrapping grid, a meter, and a running job with a busy button.",
				uses: [
					use("Card", "/components/card"),
					use("Grid", "/layout/grid"),
					use("Meter", "/components/meter"),
					use("Progress", "/components/progress"),
					use("Loading", "/components/loading"),
				],
			},
			{
				demo: "example-data-table",
				title: "Data table",
				summary: "A filterable table with a caption, row headers, a footer total and pagination.",
				uses: [
					use("Table", "/content/table"),
					use("Overflow auto", "/layout/overflow-auto"),
					use("Search", "/forms/input-search"),
					use("Nav", "/components/nav"),
				],
			},
		],
	},
	{
		id: "forms",
		title: "Forms",
		summary: "The screens people fill in: signing in, changing settings, paying.",
		items: [
			{
				demo: "example-sign-in",
				title: "Sign in",
				summary: "A card with a title band, two fields, a switch and a footer link.",
				frame: "narrow",
				uses: [
					use("Card", "/components/card"),
					use("Text inputs", "/forms/text-inputs"),
					use("Switch", "/forms/checkbox-radio-switch"),
				],
			},
			{
				demo: "example-settings",
				title: "Settings",
				summary: "Fieldsets, a field in its invalid state, a segmented choice, switches and a select.",
				uses: [
					use("Forms", "/forms/"),
					use("Validation", "/forms/validation"),
					use("Segmented", "/forms/checkbox-radio-switch#segmented-choice"),
					use("Select", "/forms/select"),
				],
			},
			{
				demo: "example-checkout",
				title: "Checkout",
				summary: "An address form beside an order summary with a total and a gift card field.",
				uses: [
					use("Grid", "/layout/grid"),
					use("Table", "/content/table"),
					use("Accordion", "/components/accordion"),
					use("Group", "/components/group"),
				],
			},
		],
	},
	{
		id: "content",
		title: "Content",
		summary: "Pages people read: articles, plans, profiles and answers.",
		items: [
			{
				demo: "example-article",
				title: "Article",
				summary: "Headings, a byline, highlighted text, a quotation, a list, a keyboard key and a captioned code sample.",
				uses: [
					use("Typography", "/content/typography"),
					use("Code", "/content/code"),
					use("Figure", "/content/figure"),
				],
			},
			{
				demo: "example-pricing",
				title: "Pricing",
				summary: "Three plan cards that wrap onto one column on a phone.",
				uses: [
					use("Card", "/components/card"),
					use("Grid", "/layout/grid"),
					use("Button", "/content/button"),
				],
			},
			{
				demo: "example-profile",
				title: "Profile",
				summary: "A description list of account details and a share popover with no script.",
				uses: [
					use("Description list", "/content/description-list"),
					use("Popover", "/components/popover"),
				],
			},
			{
				demo: "example-faq",
				title: "FAQ",
				summary: "An exclusive accordion: open one answer and the others close, by the browser.",
				uses: [use("Accordion", "/components/accordion")],
			},
		],
	},
];
