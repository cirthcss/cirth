const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

// `npm run dev`: the documentation site, served and live, over Cirth's own
// source.
//
//   npm run dev
//   npm run dev -- --port=8081 --output=/tmp/site
//
// Eleventy serves docs/ and rebuilds by itself when a page, a template or
// the docs' own stylesheets change. What it cannot see is src/. The site is
// styled by stylesheets compiled from src/ into docs/src/styles/generated/,
// a gitignored folder, and Eleventy's watcher skips everything .gitignore
// lists, so a change to Cirth reached the open page only after a restart.
//
// So this watches src/ itself. On a change it recompiles those stylesheets
// (build-docs.js), copies them into the output being served, where the dev
// server's own watcher reloads the page's CSS (the CIRTH_DEV_OUTPUT branch
// of docs/eleventy.config.js), and then rebuilds dist/, which the test
// suites read. Arguments are Eleventy's, passed through.

const projectRoot = path.join(__dirname, "..");
const sourceFolder = path.join(projectRoot, "src");
const generatedFolder = path.join(projectRoot, "docs/src/styles/generated");
const eleventyCli = path.join(projectRoot, "node_modules/@11ty/eleventy/cmd.cjs");

const eleventyArgs = process.argv.slice(2);
const outputArg = eleventyArgs.find((arg) => arg.startsWith("--output="));
const output = path.resolve(projectRoot, outputArg ? outputArg.slice("--output=".length) : "docs/dist");

// Polling avoids file-handle limits seen with recursive fs.watch on this source tree.
const pollInterval = 500;

/** @type {Set<import("node:child_process").ChildProcess>} */
const children = new Set();

/**
 * Runs one of the repository's scripts to completion.
 *
 * @param {string} script
 * @returns {Promise<number>} its exit code
 */
const runScript = (script) =>
	new Promise((resolve) => {
		const child = spawn(process.execPath, [path.join(__dirname, script)], { cwd: projectRoot, stdio: "inherit" });
		children.add(child);
		child.on("exit", (code) => {
			children.delete(child);
			resolve(code ?? 1);
		});
	});

/** @param {string} folder @returns {string[]} */
const getScssFiles = (folder) =>
	fs
		.readdirSync(folder, { withFileTypes: true })
		.flatMap((entry) => {
			const filename = path.join(folder, entry.name);
			if (entry.isDirectory()) return getScssFiles(filename);
			return entry.isFile() && entry.name.endsWith(".scss") ? [filename] : [];
		})
		.sort();

// mtime plus size is enough here and avoids hashing every SCSS file on each poll.
const getSnapshot = () =>
	new Map(
		getScssFiles(sourceFolder).map((filename) => {
			const stats = fs.statSync(filename);
			return [path.relative(sourceFolder, filename), `${stats.mtimeMs}:${stats.size}`];
		}),
	);

/** @param {Map<string, string>} before @param {Map<string, string>} after */
const differs = (before, after) =>
	before.size !== after.size || [...after].some(([filename, signature]) => before.get(filename) !== signature);

// One pass after a change in src/: the docs' stylesheets first, since they
// are what the open page shows, then dist/.
const rebuild = async () => {
	if ((await runScript("build-docs.js")) === 0 && fs.existsSync(output)) {
		fs.cpSync(generatedFolder, path.join(output, "styles/generated"), { recursive: true });
		console.log("[@cirthcss/cirth] dev: the site's stylesheets are rebuilt from src/");
	}
	await runScript("build.js");
};

// Debounced, and one pass at a time: edits that arrive during a pass queue
// exactly one more.
let running = false;
let pending = false;
/** @type {NodeJS.Timeout | undefined} */
let debounce;
const schedule = () => {
	clearTimeout(debounce);
	debounce = setTimeout(async () => {
		if (running) {
			pending = true;
			return;
		}
		running = true;
		await rebuild();
		running = false;
		if (pending) {
			pending = false;
			schedule();
		}
	}, 150);
};

const stop = (/** @type {number} */ code) => {
	clearTimeout(debounce);
	for (const child of children) child.kill();
	process.exit(code);
};
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

const main = async () => {
	if (!fs.existsSync(sourceFolder)) throw new Error("The src folder was not found.");
	if (!fs.existsSync(eleventyCli)) throw new Error("Eleventy is not installed: run npm install.");

	// The site's stylesheets exist before Eleventy copies them.
	if ((await runScript("build-docs.js")) !== 0) stop(1);

	const eleventy = spawn(process.execPath, [eleventyCli, "--config=docs/eleventy.config.js", "--serve", ...eleventyArgs], {
		cwd: projectRoot,
		stdio: "inherit",
		env: { ...process.env, CIRTH_DEV_OUTPUT: output },
	});
	children.add(eleventy);
	eleventy.on("exit", (code) => stop(code ?? 0));

	let snapshot = getSnapshot();
	setInterval(() => {
		const next = getSnapshot();
		if (differs(snapshot, next)) {
			snapshot = next;
			schedule();
		}
	}, pollInterval);
	console.log("[@cirthcss/cirth] dev: watching src/");

	// dist/ is brought up to date once, as the old watcher did on start; the
	// site's stylesheets were compiled above.
	running = true;
	await runScript("build.js");
	running = false;
	if (pending) {
		pending = false;
		schedule();
	}
};

main().catch((error) => {
	console.error(`[@cirthcss/cirth] dev: ${error.message}`);
	stop(1);
});
