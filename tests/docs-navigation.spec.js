const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");
const frameworks = require("../docs/src/_data/frameworks.js");
const nav = require("../docs/src/_data/nav.js");

// The documentation's indexes: the sidebar tree with Installation as a
// branch holding its guides, the breadcrumb above a guide, the pager that
// follows the reading order rather than the tree, the two rails that stay
// beside the page and never reach the footer, and the outline that folds a
// long page's subsections under their sections.

assertDocsBuilt("docs-navigation.spec");

/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let origin;

test.beforeAll(async () => {
	server = createServer();
	origin = await startServer(server);
});

test.afterAll(() => {
	server.close();
});

const sidebarGroups = (/** @type {import("@playwright/test").Page} */ page) =>
	page.locator(".docs-sidebar details.docs-nav-group").evaluateAll((groups) =>
		groups.map((group) => ({
			name: group.querySelector(":scope > summary")?.textContent?.trim(),
			open: /** @type {HTMLDetailsElement} */ (group).open,
		})),
	);

test("the guides are pages of Installation, not a section of their own", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${origin}/content/link/`, { waitUntil: "networkidle" });

	// Every group is a native disclosure, and only the one holding the page
	// arrives open.
	const groups = await sidebarGroups(page);
	expect(groups.map((group) => group.name)).toEqual(nav.sidebar.map((group) => group.text));
	expect(groups.map((group) => group.name)).not.toContain("Frameworks");
	expect(groups.filter((group) => group.open).map((group) => group.name)).toEqual(["Content"]);

	// Installation is a branch: its own link, and a toggle beside it that
	// folds its guides. The link is never inside the summary.
	const branch = page.locator(".docs-sidebar .docs-nav-branch");
	await expect(branch).toHaveCount(1);
	await expect(branch.locator(":scope > a")).toHaveAttribute("href", "/installation");
	await expect(branch.locator("summary a")).toHaveCount(0);
	const guides = await branch
		.locator(":scope > details li a")
		.evaluateAll((links) => links.map((link) => [link.textContent?.trim(), link.getAttribute("href")]));
	expect(guides).toEqual(frameworks.guides.map((guide) => [guide.name, guide.link]));
	for (const name of ["Laravel", "Django", "Phoenix", "WordPress", "Yew", "Vite", "Rails", "Blazor", "Hugo"]) {
		expect(guides.map(([text]) => text), `${name} is a guide`).toContain(name);
	}

	// Inside the branch, one disclosure per category, each with a visible
	// name, in the data's order, all closed on a page that is not a guide.
	const categories = branch.locator(".docs-nav-category > details");
	await expect(categories.locator(":scope > summary")).toHaveText(
		frameworks.groups.map((/** @type {{ text: string }} */ group) => group.text),
	);
	for (const open of await categories.evaluateAll((items) => items.map((item) => /** @type {HTMLDetailsElement} */ (item).open))) {
		expect(open).toBe(false);
	}

	// On a guide, its group and the branch arrive open, the guide is the
	// current page, and the reader sees it without scrolling the rail.
	await page.goto(`${origin}/installation/django/`, { waitUntil: "networkidle" });
	expect((await sidebarGroups(page)).filter((group) => group.open).map((group) => group.name)).toEqual([
		"Start",
	]);
	await expect(page.locator(".docs-sidebar .docs-nav-branch > details")).toHaveAttribute("open", "");
	const current = page.locator('.docs-sidebar a[aria-current="page"]');
	await expect(current).toHaveText("Django");
	await expect(current).toBeInViewport();
	// Only Django's category is open, and it is a disclosure the keyboard
	// can fold like any other.
	const openCategories = await page
		.locator(".docs-sidebar .docs-nav-category > details")
		.evaluateAll((items) =>
			items.filter((item) => /** @type {HTMLDetailsElement} */ (item).open).map((item) => item.querySelector("summary")?.textContent?.trim()),
		);
	expect(openCategories).toEqual(["Backend frameworks"]);

	// The toggle is a real disclosure the keyboard operates.
	const toggle = page.locator(".docs-sidebar .docs-nav-branch > details > summary");
	await expect(toggle).toHaveAccessibleName("Installation pages");
	await toggle.focus();
	await page.keyboard.press("Enter");
	await expect(page.locator(".docs-sidebar .docs-nav-branch > details")).not.toHaveAttribute("open", "");
	await page.keyboard.press("Enter");
	await expect(page.locator(".docs-sidebar .docs-nav-branch > details")).toHaveAttribute("open", "");
});

test("the compact menu is the sidebar's tree", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/installation/laravel/`, { waitUntil: "networkidle" });

	const read = (/** @type {string} */ root) =>
		page.locator(`${root} a`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
	expect(await read(".docs-mobile-nav nav")).toEqual(await read(".docs-sidebar nav"));
	await page.locator(".docs-mobile-nav > summary").click();
	await expect(page.locator('.docs-mobile-nav a[aria-current="page"]')).toHaveText("Laravel");
	await expect(page.locator('.docs-mobile-nav a[aria-current="page"]')).toBeVisible();
});

test("every guide names Installation above its title", async ({ page }) => {
	for (const guide of frameworks.guides) {
		await page.goto(`${origin}${guide.link}/`, { waitUntil: "networkidle" });
		const trail = page.locator('.docs-content > nav[aria-label="breadcrumb"]');
		await expect(trail, guide.id).toHaveCount(1);
		await expect(trail.locator("ol > li")).toHaveCount(2);
		await expect(trail.locator("li a")).toHaveAttribute("href", "/installation/");
		await expect(trail.locator("li a")).toHaveText("Installation");
		await expect(trail.locator('li[aria-current="page"]')).toHaveText(guide.name);
		// Before the title, not after it: the trail, the project's card, the h1.
		expect(
			await trail.evaluate((element) => [element.nextElementSibling?.className, element.nextElementSibling?.nextElementSibling?.tagName]),
		).toEqual(["docs-project", "H1"]);
	}
	// A page that is not nested carries none.
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });
	await expect(page.locator('nav[aria-label="breadcrumb"]')).toHaveCount(0);
});

// --- The reading order -------------------------------------------------

/**
 * A group's own entries in the rendered sidebar: its pages, not the guides
 * nested under one of them.
 * @param {import("@playwright/test").Page} page
 * @param {string} name
 */
const groupPages = (page, name) =>
	page
		.locator(".docs-sidebar details.docs-nav-group")
		.filter({ has: page.locator(`:scope > summary:text-is("${name}")`) })
		.locator(":scope > ul > li > a")
		.evaluateAll((links) => links.map((link) => [link.textContent?.trim(), link.getAttribute("href")]));

test("Start says why, then whether it fits, then how to install it", async ({ page }) => {
	await page.goto(`${origin}/why-cirth/`, { waitUntil: "networkidle" });
	const groups = await sidebarGroups(page);
	expect(groups[0].name).toBe("Start");
	expect(groups.map((group) => group.name)).not.toContain("Introduction");
	expect(await groupPages(page, "Start")).toEqual([
		["Why Cirth", "/why-cirth"],
		["Compatibility", "/compatibility"],
		["Installation", "/installation"],
	]);
	expect(groups[1].name).toBe("Customization");
	// Upgrading is about the project's releases, not about starting: it
	// leads the Project group, at the same address.
	expect(await groupPages(page, "Project")).toEqual([
		["Upgrading", "/upgrading"],
		["About", "/about"],
		["Contributions", "/contributions"],
		["Brand", "/brand"],
	]);
	const upgrading = await page.request.get(`${origin}/upgrading/`);
	expect(upgrading.status()).toBe(200);
	expect(await upgrading.text()).not.toMatch(/http-equiv="refresh"/);
});

test("Docs opens the documentation where it begins; Get started installs", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const docs = page.locator('.docs-header nav[aria-label="main navigation"] a', { hasText: /^Docs$/ });
	await expect(docs).toHaveAttribute("href", "/why-cirth");
	// The drawer on a narrow screen lists the same link.
	await expect(page.locator('[data-docs-menu-drawer] a', { hasText: /^Docs$/ })).toHaveAttribute("href", "/why-cirth");
	// Every "Get started" on the home page and in the footer installs.
	const starts = page.locator("a", { hasText: /^Get started$/ });
	expect(await starts.count()).toBeGreaterThanOrEqual(3);
	for (const href of await starts.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
		expect(href).toBe("/installation");
	}
	// It is current on the page it opens, and on no other.
	await page.goto(`${origin}/why-cirth/`, { waitUntil: "domcontentloaded" });
	await expect(docs).toHaveAttribute("aria-current", "page");
	await page.goto(`${origin}/installation/`, { waitUntil: "domcontentloaded" });
	await expect(docs).not.toHaveAttribute("aria-current", "page");
});

/**
 * The pager as rendered: each link's href, rel and two lines.
 * @param {import("@playwright/test").Page} page
 */
const pagerOf = (page) =>
	page.locator(".docs-prev-next a").evaluateAll((links) =>
		links.map((link) => ({
			rel: link.getAttribute("rel"),
			href: link.getAttribute("href"),
			label: link.querySelector("small")?.textContent?.trim(),
			title: link.querySelector("strong")?.textContent?.trim(),
		})),
	);

test("the pager follows the reading order, and names where it leads", async ({ page }) => {
	const expected = {
		"/why-cirth/": [
			{ rel: "next", href: "/compatibility", label: "Next · Start →", title: "Compatibility" },
		],
		"/compatibility/": [
			{ rel: "prev", href: "/why-cirth", label: "← Previous · Start", title: "Why Cirth" },
			{ rel: "next", href: "/installation", label: "Next · Start →", title: "Installation" },
		],
		"/installation/": [
			{ rel: "prev", href: "/compatibility", label: "← Previous · Start", title: "Compatibility" },
			{ rel: "next", href: "/customization", label: "Next · Customization →", title: "Overview" },
		],
		"/customization/": [
			{ rel: "prev", href: "/installation", label: "← Previous · Start", title: "Installation" },
			{ rel: "next", href: "/colors", label: "Next · Customization →", title: "Colors" },
		],
		"/upgrading/": [
			{ rel: "prev", href: "/utilities/print", label: "← Previous · Utilities", title: "Print" },
			{ rel: "next", href: "/about", label: "Next · Project →", title: "About" },
		],
	};
	for (const [url, links] of Object.entries(expected)) {
		await page.goto(`${origin}${url}`, { waitUntil: "domcontentloaded" });
		expect(await pagerOf(page), url).toEqual(links);
	}
});

test("every guide steps back to Installation and on to Customization", async ({ page }) => {
	expect(frameworks.guides).toHaveLength(frameworks.count);
	for (const { link, name } of frameworks.guides) {
		await page.goto(`${origin}${link}/`, { waitUntil: "domcontentloaded" });
		expect(await pagerOf(page), name).toEqual([
			{ rel: "prev", href: "/installation", label: "← Previous · Start", title: "Installation" },
			{ rel: "next", href: "/customization", label: "Next · Customization →", title: "Overview" },
		]);
		// The breadcrumb is unchanged: Installation / the guide.
		await expect(page.locator(".docs-breadcrumb li")).toHaveText(["Installation", name]);
	}
});

test("no page's pager leads to a guide, a category or a page that is not there", async ({
	page,
	browserName,
}) => {
	// Markup, read off every page: one engine reads it as well as three.
	test.skip(browserName !== "chromium", "markup check");
	const guideLinks = new Set(frameworks.guides.map((guide) => guide.link));
	const readingLinks = nav.readingOrder.map((entry) => entry.link);
	expect(readingLinks.filter((link) => guideLinks.has(link))).toEqual([]);
	// Every page the sidebar lists is in the reading order or a guide, and
	// nothing else is.
	const listed = nav.sidebar.flatMap((group) =>
		group.items.flatMap((item) => [item.link, ...(item.items ?? []).flatMap((child) => (child.items ?? [child]).map((entry) => entry.link))]),
	);
	expect([...readingLinks, ...guideLinks].sort()).toEqual([...listed].sort());

	const routes = new Set();
	for (const url of Object.keys(nav.pager)) {
		const response = await page.request.get(`${origin}${url}`);
		expect(response.status(), url).toBe(200);
		routes.add(url);
		const html = await response.text();
		const pager = /<nav class="docs-prev-next"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? "";
		const links = [...pager.matchAll(/<a href="([^"]+)" rel="(prev|next)">/g)].map(([, href, rel]) => ({ href, rel }));
		const { prev, next } = nav.pager[url];
		expect(links, url).toEqual([
			...(prev ? [{ href: prev.link, rel: "prev" }] : []),
			...(next ? [{ href: next.link, rel: "next" }] : []),
		]);
		for (const { href } of links) {
			expect(guideLinks.has(href), `${url} leads to the guide ${href}`).toBe(false);
			expect(readingLinks, `${url} leads to ${href}, which is not a page of the reading order`).toContain(href);
		}
	}
	// The ends of the chain, and nothing past them.
	expect(nav.pager["/why-cirth/"].prev).toBeUndefined();
	expect(nav.pager[`${readingLinks.at(-1)}/`].next).toBeUndefined();
	// A category heading (Build tools) has no route and is never a link.
	for (const group of frameworks.groups) {
		expect(Object.values(nav.pager).flatMap(({ prev, next }) => [prev?.text, next?.text])).not.toContain(group.text);
	}
	// Every link a pager makes lands on a page.
	for (const { link } of nav.readingOrder) expect(routes.has(link.endsWith("/") ? link : `${link}/`), link).toBe(true);
});

test("the pages that moved still forward, and carry no pager", async ({ page }) => {
	for (const { from, to } of nav.redirects) {
		const response = await page.request.get(`${origin}${from}`);
		expect(response.status(), from).toBe(200);
		const html = await response.text();
		expect(html, from).toContain(`<link rel="canonical" href="${to}"`);
		expect(html, from).not.toContain("docs-prev-next");
		const target = await page.request.get(`${origin}${to.replace(/#.*$/, "")}`);
		expect(target.status(), `${from} -> ${to}`).toBe(200);
	}
});

// The preview of the unreleased line is served under /next/ (deploy-docs.yml).
// Every pager link is root-relative, which is the shape Eleventy's base
// plugin rewrites, so under /next/ they stay inside /next/. Built for real,
// into a directory of its own: the build cleans and indexes only the output
// it is given, so docs/dist, which the other specs are reading, is untouched.
test("under /next/, the pager and Docs stay inside the preview", async ({ browserName }) => {
	test.skip(browserName !== "chromium", "a build, not a rendering");
	test.setTimeout(120_000);
	const root = path.join(__dirname, "..");
	const scratch = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "cirth-next-"));
	const site = path.join(scratch, "next");
	try {
		execFileSync(process.execPath, ["node_modules/@11ty/eleventy/cmd.cjs", "--config=docs/eleventy.config.js", "--quiet", `--output=${site}`], {
			cwd: root,
			env: { ...process.env, GITHUB_PAGES: "true", DOCS_VARIANT: "next" },
			stdio: "pipe",
		});
		const read = (/** @type {string} */ url) => fs.readFileSync(path.join(site, url, "index.html"), "utf8");
		const pager = (/** @type {string} */ url) =>
			[.../<nav class="docs-prev-next"[\s\S]*?<\/nav>/.exec(read(url))?.[0].matchAll(/href="([^"]+)" rel="(prev|next)"/g) ?? []].map(
				([, href, rel]) => `${rel} ${href}`,
			);
		expect(pager("why-cirth")).toEqual(["next /cirth/next/compatibility"]);
		expect(pager("compatibility")).toEqual(["prev /cirth/next/why-cirth", "next /cirth/next/installation"]);
		expect(pager("installation")).toEqual(["prev /cirth/next/compatibility", "next /cirth/next/customization"]);
		for (const index of [0, Math.floor(frameworks.guides.length / 2), frameworks.guides.length - 1]) {
			const guide = frameworks.guides[index];
			const slug = guide.link.replace(/^\//, "");
			expect(pager(slug), guide.name).toEqual(["prev /cirth/next/installation", "next /cirth/next/customization"]);
			expect(read(slug), guide.name).toMatch(/class="docs-breadcrumb"[\s\S]*?href="\/cirth\/next\/installation\/"/);
		}
		expect(read("installation")).toMatch(/<a href="\/cirth\/next\/why-cirth"[^>]*>Docs<\/a>/);
		// The copies on the home page load their stylesheets from inside the
		// preview too.
		expect(read("")).toContain('href="/cirth/next/styles/generated/cirth-lab-scoped.css"');
	} finally {
		fs.rmSync(scratch, { recursive: true, force: true });
	}
});

/**
 * Where the two rails, the layout and the footer are, at the bottom of a
 * page.
 * @param {import("@playwright/test").Page} page
 */
const railsAtBottom = (page) =>
	page.evaluate(async () => {
		window.scrollTo(0, document.documentElement.scrollHeight);
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const box = (/** @type {string} */ selector) => {
			const element = document.querySelector(selector);
			if (!element) return null;
			const rect = element.getBoundingClientRect();
			const style = getComputedStyle(element);
			return {
				top: rect.top,
				bottom: rect.bottom,
				scrollHeight: element.scrollHeight,
				clientHeight: element.clientHeight,
				overflowY: style.overflowY,
				position: style.position,
				overscroll: style.overscrollBehaviorY,
			};
		};
		return {
			sidebar: box(".docs-sidebar"),
			toc: box(".docs-toc"),
			layout: box(".docs-layout"),
			footer: box(".docs-footer"),
			viewport: window.innerHeight,
			pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
		};
	});

test("the rails stop before the footer and scroll inside themselves", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });

	for (const url of ["/content/link/", "/utilities/sr-only/", "/compatibility/"]) {
		await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });
		// Every group open: the longest the index can be.
		await page.evaluate(() => {
			for (const group of document.querySelectorAll(".docs-sidebar details")) {
				/** @type {HTMLDetailsElement} */ (group).open = true;
			}
		});
		const at = await railsAtBottom(page);
		if (!at.sidebar || !at.layout || !at.footer) throw new Error(`${url}: missing shell`);

		for (const [name, rail] of /** @type {const} */ ([["sidebar", at.sidebar], ["toc", at.toc]])) {
			if (!rail) continue;
			expect(rail.position, `${url} ${name} sticks`).toBe("sticky");
			expect(rail.overflowY, `${url} ${name} scrolls inside`).toBe("auto");
			expect(rail.overscroll, `${url} ${name} keeps its scroll`).toBe("contain");
			// Never taller than the window, never past the layout, never
			// under the footer.
			expect(rail.bottom - rail.top, `${url} ${name} height`).toBeLessThanOrEqual(at.viewport);
			expect(rail.bottom, `${url} ${name} ends inside the layout`).toBeLessThanOrEqual(at.layout.bottom + 0.5);
			expect(rail.bottom, `${url} ${name} ends before the footer`).toBeLessThanOrEqual(at.footer.top + 0.5);
		}
		// With every group open the index is longer than its rail, and it is
		// the rail that scrolls, not the page.
		expect(at.sidebar.scrollHeight, `${url} sidebar overflows its rail`).toBeGreaterThan(at.sidebar.clientHeight);
		expect(at.pageOverflow, `${url} horizontal overflow`).toBeLessThanOrEqual(0);
	}

	// And it scrolls: the last entry can be brought into the rail's view
	// without the page moving.
	await page.goto(`${origin}/content/link/`, { waitUntil: "networkidle" });
	await page.evaluate(() => {
		for (const group of document.querySelectorAll(".docs-sidebar details")) {
			/** @type {HTMLDetailsElement} */ (group).open = true;
		}
	});
	const before = await page.evaluate(() => window.scrollY);
	await page.locator(".docs-sidebar").evaluate((rail) => {
		rail.scrollTop = rail.scrollHeight;
	});
	await expect(page.locator(".docs-sidebar a").last()).toBeInViewport();
	expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test("a long outline folds its subsections, and the spy opens the one being read", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	// The longest outline on the site.
	await page.goto(`${origin}/customization/`, { waitUntil: "networkidle" });

	const toc = page.locator(".docs-toc");
	const groups = toc.locator("details[data-toc-group]");
	expect(await groups.count()).toBeGreaterThan(1);
	// Each section's subsections sit under its own link.
	const nested = await toc.locator(".docs-toc-branch").first().evaluate((branch) => ({
		link: branch.querySelector(":scope > a")?.getAttribute("href"),
		children: branch.querySelectorAll(":scope > details li a").length,
	}));
	expect(nested.link).toMatch(/^#/);
	expect(nested.children).toBeGreaterThan(0);

	// Read a subsection: its section opens and its entry is current, in the
	// rail's view.
	const target = await toc.locator(".docs-toc-branch details li a").nth(2).getAttribute("data-slug");
	await page.locator(`.docs-content [id="${target}"]`).evaluate((heading) => {
		window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - 60);
	});
	await expect(toc.locator(`a[data-slug="${target}"]`)).toHaveAttribute("aria-current", "true");
	const owner = toc.locator(`a[data-slug="${target}"]`).locator("xpath=ancestor::details[1]");
	await expect(owner).toHaveAttribute("open", "");
	await expect(toc.locator(`a[data-slug="${target}"]`)).toBeInViewport();

	// The compact outline is the same tree.
	const hrefs = (/** @type {string} */ root) =>
		page.locator(`${root} a`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
	expect(await hrefs(".docs-toc-top nav")).toEqual(await hrefs(".docs-toc nav"));
});

test("a fragment lands under the sticky header, not behind it", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${origin}/compatibility/`, { waitUntil: "networkidle" });
	const link = page.locator(".docs-toc nav > ul > li > a").nth(2);
	const slug = await link.getAttribute("data-slug");
	await link.click();
	await page.waitForTimeout(300);
	const geometry = await page.evaluate((id) => ({
		header: /** @type {Element} */ (document.querySelector(".docs-header")).getBoundingClientRect().bottom,
		heading: /** @type {Element} */ (document.getElementById(/** @type {string} */ (id))).getBoundingClientRect().top,
	}), slug);
	expect(geometry.heading).toBeGreaterThanOrEqual(geometry.header);
});

test("Installation is short, and the CDN is said once", async ({ page }) => {
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });
	const content = page.locator(".docs-content");
	await expect(content.locator(":scope > h2")).toHaveText([
		/CDN/,
		/npm/,
		/Guides/,
		/Advanced builds/,
		/Next steps/,
	]);
	// No live classless or scoped demo and no full-page tutorial.
	await expect(content.locator(".docs-demo")).toHaveCount(0);
	await expect(content.locator("pre", { hasText: "<!doctype html>" })).toHaveCount(0);
	// One CDN snippet on the page.
	await expect(content.locator("pre", { hasText: "cdn.jsdelivr.net" })).toHaveCount(1);
	// Every guide, grouped, the count printed from the same data.
	await expect(content.locator(".docs-guide-grid > li")).toHaveCount(frameworks.count);
	await expect(content).toContainText(`${frameworks.count} guides, by category`);

	// The retired CDN guide forwards rather than repeating the snippet.
	const response = await page.request.get(`${origin}/installation/cdn/`);
	const html = await response.text();
	expect(html).toMatch(/<link rel="canonical" href="\/installation\/#cdn"/);
	expect(html).not.toMatch(/cdn\.jsdelivr\.net/);
});

test("Compatibility opens on the browsers, not on a grid of figures", async ({ page }) => {
	await page.goto(`${origin}/compatibility/`, { waitUntil: "networkidle" });
	const content = page.locator(".docs-content");
	await expect(content.locator(".docs-facts")).toHaveCount(0);
	// Before the first section: the title, one sentence and a short list of
	// answers, each a line, no table and no card.
	const opening = await content.evaluate((element) => {
		const children = [...element.children];
		const first = children.findIndex((child) => child.tagName === "H2");
		return children.slice(0, first).map((child) => ({
			tag: child.tagName,
			items: child.tagName === "UL" ? [...child.children].map((item) => item.querySelector("strong")?.textContent) : [],
		}));
	});
	expect(opening.map((child) => child.tag)).toEqual(["H1", "P", "UL"]);
	expect(opening[2].items).toEqual([
		"Browsers:",
		"Modern CSS:",
		"Your build:",
		"Scoped builds:",
		"Existing CSS and component libraries:",
	]);
	const summary = content.locator(":scope > ul").first();
	await expect(summary).toContainText("Chrome, Chrome for Android and Edge 123+");
	await expect(summary).toContainText("light-dark()");
	for (const href of await summary.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
		expect(href).toMatch(/^#/);
	}
	await expect(content.locator(":scope > h2").first()).toHaveText(/Browser support/);
});
