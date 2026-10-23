const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const { expect, test } = require("@playwright/test");
const { removeBuildOutput } = require("../scripts/lib/build-output");

// Where a docs build writes, cleans and indexes.
//
// The build cleans its output once and writes the search index into it.
// Both used to be docs/dist whatever the build was told, so a build pointed
// at another directory deleted the real site and then failed in Pagefind.
// Now both follow the output Eleventy reports, and these tests hold that:
// an alternative output leaves docs/dist exactly as it was, carries its own
// complete site and index, and coexists with another one, while the
// ordinary build still empties its own docs/dist of anything stale.
//
// This file builds docs/dist itself, which empties it for a moment, so it
// runs as its own project before the behavior projects that read the site
// (playwright.behavior.config.js), never beside them.

const root = path.join(__dirname, "..");
const dist = path.join(root, "docs/dist");
const archives = fs.readdirSync(path.join(root, "docs/versions"));

test.describe.configure({ mode: "serial" });

/** @param {string[]} [extra] @param {NodeJS.ProcessEnv} [env] */
const build = (extra = [], env = {}) =>
	execFileSync(process.execPath, ["node_modules/@11ty/eleventy/cmd.cjs", "--config=docs/eleventy.config.js", "--quiet", ...extra], {
		cwd: root,
		env: { ...process.env, ...env },
		stdio: "pipe",
	});

/** Every file under `dir`, relative, with its size and modification time. */
const inventory = (/** @type {string} */ dir) => {
	/** @type {string[]} */
	const files = [];
	const walk = (/** @type {string} */ at) => {
		for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
			const full = path.join(at, entry.name);
			if (entry.isDirectory()) walk(full);
			else {
				const stats = fs.statSync(full);
				files.push(`${path.relative(dir, full)} ${stats.size} ${stats.mtimeMs}`);
			}
		}
	};
	walk(dir);
	return files.sort();
};

/** The page addresses a built search index holds. */
const indexedUrls = (/** @type {string} */ site) => {
	const fragments = path.join(site, "pagefind/fragment");
	return fs.readdirSync(fragments).map((name) => {
		const raw = zlib.gunzipSync(fs.readFileSync(path.join(fragments, name)));
		const text = raw.toString("utf8");
		return JSON.parse(text.slice(text.indexOf("{"))).url;
	});
};

/** @param {string} label */
const temporary = (label) => fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), `cirth-${label}-`));

test("a build into another directory leaves docs/dist exactly as it was", async () => {
	test.setTimeout(180_000);
	// 1. The ordinary build.
	build();
	expect(fs.existsSync(path.join(dist, "index.html"))).toBe(true);
	// 2. Something only docs/dist has.
	const sentinel = path.join(dist, ".build-output-sentinel");
	fs.writeFileSync(sentinel, "this file must survive a build elsewhere\n");
	const before = inventory(dist);

	const first = temporary("first");
	const second = temporary("second");
	try {
		const firstSite = path.join(first, "site");
		const secondSite = path.join(second, "site");
		// 3. The same site, built elsewhere.
		build([`--output=${firstSite}`]);
		// 4. docs/dist is untouched: the sentinel, and every file as it was.
		expect(fs.readFileSync(sentinel, "utf8")).toBe("this file must survive a build elsewhere\n");
		expect(inventory(dist)).toEqual(before);

		// 5. The other output is a whole site, with its own search index.
		for (const file of ["index.html", "installation/index.html", "pagefind/pagefind-entry.json", "pagefind/pagefind.js"]) {
			expect(fs.existsSync(path.join(firstSite, file)), file).toBe(true);
		}
		const urls = indexedUrls(firstSite);
		expect(urls.length).toBeGreaterThan(50);
		expect(urls).toContain("/installation/");
		// 6. Addresses are the site's, never the directory it was built in,
		// and no archived documentation line is in the current index.
		for (const url of urls) {
			expect(url, url).toMatch(/^\//);
			expect(url).not.toContain(first);
			expect(url).not.toContain("cirth-first-");
			for (const archive of archives) expect(url.startsWith(`/${archive}/`), url).toBe(false);
		}
		// The archives are still copied into the output; only the index
		// leaves them out.
		expect(fs.existsSync(path.join(firstSite, archives[0], "index.html"))).toBe(true);

		// 7. Two other outputs coexist: building the second does not clean
		// the first, and neither touches docs/dist.
		const firstFiles = inventory(firstSite);
		build([`--output=${secondSite}`]);
		expect(inventory(firstSite)).toEqual(firstFiles);
		expect(fs.existsSync(path.join(secondSite, "pagefind/pagefind-entry.json"))).toBe(true);
		expect(inventory(dist)).toEqual(before);
	} finally {
		fs.rmSync(first, { recursive: true, force: true });
		fs.rmSync(second, { recursive: true, force: true });
		fs.rmSync(sentinel, { force: true });
	}
});

test("the ordinary build still empties its own docs/dist of anything stale", async () => {
	test.setTimeout(120_000);
	const stale = path.join(dist, "a-page-that-was-deleted/index.html");
	fs.mkdirSync(path.dirname(stale), { recursive: true });
	fs.writeFileSync(stale, "<!doctype html><title>stale</title>");
	fs.writeFileSync(path.join(dist, "stale.txt"), "stale");
	build();
	expect(fs.existsSync(stale)).toBe(false);
	expect(fs.existsSync(path.join(dist, "stale.txt"))).toBe(false);
	expect(fs.existsSync(path.join(dist, "index.html"))).toBe(true);
	expect(indexedUrls(dist)).not.toContain("/a-page-that-was-deleted/");
	expect(fs.existsSync(path.join(dist, "pagefind/pagefind-entry.json"))).toBe(true);
});

test("the clean refuses anything that is not plainly a build output", async () => {
	const scratch = temporary("guard");
	try {
		const target = path.join(scratch, "out");
		fs.mkdirSync(target);
		fs.writeFileSync(path.join(target, "page.html"), "x");
		const link = path.join(scratch, "link");
		fs.symlinkSync(target, link);
		const file = path.join(scratch, "file.txt");
		fs.writeFileSync(file, "x");

		for (const [dir, why] of [
			["", /no name/],
			[path.parse(root).root, /filesystem root/],
			[os.homedir(), /home directory/],
			[root, /repository/],
			[path.dirname(root), /contains the repository/],
			[path.join(root, "docs"), /docs\//],
			[path.join(root, "docs/src"), /contains the sources/],
			[link, /symlink/],
			[file, /not a directory/],
		]) {
			expect(() => removeBuildOutput(String(dir), { sources: [path.join(root, "docs/src/pages")] }), String(dir)).toThrow(why);
		}
		// What it refused is all still there.
		expect(fs.existsSync(path.join(target, "page.html"))).toBe(true);
		expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
		// A plain output directory is emptied, and a missing one is fine.
		expect(removeBuildOutput(target)).toBe(target);
		expect(fs.existsSync(target)).toBe(false);
		expect(removeBuildOutput(path.join(scratch, "never-built"))).toBe(path.join(scratch, "never-built"));
	} finally {
		fs.rmSync(scratch, { recursive: true, force: true });
	}
});

test("Pagefind on its own takes the output it indexes", async () => {
	const { buildPagefindIndex } = require("../scripts/build-pagefind");
	await expect(buildPagefindIndex(/** @type {any} */ ({}))).rejects.toThrow(/needs the output directory/);
	const empty = temporary("empty");
	try {
		await expect(buildPagefindIndex({ outputDir: empty })).rejects.toThrow(/has no built site/);
		// Nothing was written into a directory that holds no site.
		expect(fs.readdirSync(empty)).toEqual([]);
	} finally {
		fs.rmSync(empty, { recursive: true, force: true });
	}
});
