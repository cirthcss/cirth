const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
	COMPONENT_END,
	COMPONENT_START,
	EXCLUSION_GUARD,
	auditFinalCss,
	transformCss,
} = require("./lib/component-exclusion");
const { compileScssFolder } = require("./lib/compile-scss");

const projectRoot = path.join(__dirname, "..");
const sourceFolder = path.join(projectRoot, "src");
const binExtension = process.platform === "win32" ? ".cmd" : "";
const lightningcss = path.join(
	projectRoot,
	"node_modules/.bin",
	`lightningcss${binExtension}`,
);
const componentFolders = ["components", "content", "forms"];
const screenBuild = /^cirth(?:\.classless)?(?:\.scoped)?\.css$/;

/** @param {string} value @param {string} needle */
const occurrences = (value, needle) => value.split(needle).length - 1;

/** @param {string} value */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Ownership is a source decision, not a guess made from emitted selector
// text. Every partial in the three automatic-styling directories must opt in
// exactly once, and no other source area may quietly acquire the marker.
const componentFiles = componentFolders.flatMap((folder) =>
	fs
		.readdirSync(path.join(sourceFolder, folder))
		.filter((name) => name.endsWith(".scss"))
		.map((name) => path.join(sourceFolder, folder, name)),
);

for (const file of componentFiles) {
	const source = fs.readFileSync(file, "utf8");
	assert.equal(
		occurrences(source, COMPONENT_START),
		1,
		`${path.relative(projectRoot, file)} must have one ${COMPONENT_START} marker`,
	);
	assert.equal(
		occurrences(source, COMPONENT_END),
		1,
		`${path.relative(projectRoot, file)} must have one ${COMPONENT_END} marker`,
	);
	assert.ok(
		source.indexOf(COMPONENT_START) < source.indexOf(COMPONENT_END),
		`${path.relative(projectRoot, file)} has reversed ownership markers`,
	);
}

for (const sourceEntry of fs.readdirSync(sourceFolder, { recursive: true })) {
	const entry = String(sourceEntry);
	if (!entry.endsWith(".scss")) {
		continue;
	}
	const file = path.join(sourceFolder, entry);
	if (componentFiles.includes(file)) {
		continue;
	}
	const source = fs.readFileSync(file, "utf8");
	assert.equal(
		occurrences(source, COMPONENT_START) + occurrences(source, COMPONENT_END),
		0,
		`${entry} is intentionally global and must not carry component markers`,
	);
}

// Pin the hard selector shapes independently of Cirth's current source. This
// catches regressions in list handling, rightmost-subject selection,
// pseudo-element placement, conditional rules and keyframe exclusion.
const fixture = `
/* ${COMPONENT_START} */
input,
button::before,
form:has(.inside) > label + small,
::selection { color: red }
@media (width > 10px) { textarea::placeholder { color: gray } }
@keyframes fixture { from { opacity: 0 } }
/* ${COMPONENT_END} */
html { color: black }
`;
const fixtureResult = transformCss(fixture, "selector-fixture.css");
assert.equal(fixtureResult.stats.componentBranches, 5);
assert.match(fixtureResult.css, new RegExp(`input${escapeRegex(EXCLUSION_GUARD)}`));
assert.match(
	fixtureResult.css,
	new RegExp(`button${escapeRegex(EXCLUSION_GUARD)}::before`),
);
assert.match(
	fixtureResult.css,
	new RegExp(`${escapeRegex(EXCLUSION_GUARD)}::selection`),
);
assert.match(
	fixtureResult.css,
	new RegExp(`small${escapeRegex(EXCLUSION_GUARD)}`),
);
assert.match(fixtureResult.css, /@keyframes fixture \{ from \{ opacity: 0 \} \}/);
assert.match(fixtureResult.css, /html \{ color: black \}/);
assert.equal(auditFinalCss(fixtureResult.css, "selector-fixture.css"), 5);

if (!fs.existsSync(lightningcss)) {
	throw new Error("check:exclusion: Lightning CSS is missing; run `npm install`.");
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cirth-exclusion-"));
const compiledFolder = path.join(temporaryRoot, "compiled");
const finalFolder = path.join(temporaryRoot, "final");
fs.mkdirSync(finalFolder, { recursive: true });

/** @param {readonly string[]} args */
const runLightning = (args) => {
	const result = spawnSync(lightningcss, args, {
		cwd: projectRoot,
		encoding: "utf8",
	});
	if (result.status !== 0) {
		throw new Error(
			`Lightning CSS failed:\n${result.stderr || result.stdout || "unknown error"}`,
		);
	}
};

try {
	compileScssFolder({
		sourceFolder,
		outputFolder: compiledFolder,
		filter: (dirent) => dirent.name.startsWith("cirth"),
	});

	const reports = [];
	for (const filename of fs.readdirSync(compiledFolder).sort()) {
		if (!filename.endsWith(".css")) {
			continue;
		}
		const source = fs.readFileSync(path.join(compiledFolder, filename), "utf8");
		const transformed = transformCss(source, filename);
		const isScreen = screenBuild.test(filename);

		if (isScreen) {
			assert.equal(
				transformed.stats.sections,
				componentFiles.length,
				`${filename} did not include every component ownership section`,
			);
			assert.ok(
				transformed.stats.componentBranches > 0,
				`${filename} emitted no guarded component branches`,
			);
		} else {
			assert.equal(
				transformed.stats.sections,
				0,
				`${filename} is global-only but emitted a component section`,
			);
			assert.equal(transformed.stats.componentBranches, 0);
		}

		assert.doesNotMatch(transformed.css, /cirth-component:(?:start|end)/);

		const guarded = path.join(finalFolder, `${filename}.guarded`);
		const expanded = path.join(finalFolder, filename);
		const minified = path.join(
			finalFolder,
			filename.replace(/\.css$/, ".min.css"),
		);
		fs.writeFileSync(guarded, transformed.css);
		runLightning(["--browserslist", guarded, "-o", expanded]);
		runLightning(["--browserslist", "--minify", expanded, "-o", minified]);

		const expandedCount = auditFinalCss(
			fs.readFileSync(expanded, "utf8"),
			filename,
		);
		const minifiedCount = auditFinalCss(
			fs.readFileSync(minified, "utf8"),
			path.basename(minified),
		);
		assert.equal(expandedCount > 0, isScreen);
		assert.equal(minifiedCount > 0, isScreen);

		reports.push(
			`${filename}: ${transformed.stats.componentBranches} component ` +
				`branches guarded, ${transformed.stats.globalRules} global rules unchanged`,
		);
	}

	for (const report of reports) {
		console.log(`✓ ${report}`);
	}
} finally {
	fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log(
	`✓ check:exclusion: ${componentFiles.length} owned partials; parsed ` +
		`expanded and minified selectors for all Cirth builds.`,
);
