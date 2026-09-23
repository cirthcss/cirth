const fs = require("node:fs");
const path = require("node:path");
const { compileScssFolder } = require("./lib/compile-scss");
const { DEFAULT_PREFIX, readPrefixArg } = require("./lib/prefix");
const { runSync } = require("./lib/run-sync");

const projectRoot = path.join(__dirname, "..");
const binFolder = path.join(projectRoot, "node_modules/.bin");
const binExtension = process.platform === "win32" ? ".cmd" : "";
const sourceFolder = path.join(projectRoot, "src");
const outputFolder = path.join(projectRoot, "dist");

// `npm run build -- --prefix "--acme-"` builds the same dist/ under another
// custom property prefix (gh#126). Read it before anything runs, so an
// invalid value fails without touching dist/.
/** @type {string} */
let prefix;
try {
  prefix = readPrefixArg(process.argv.slice(2));
} catch (error) {
  console.error(`[@cirthcss/cirth] ${/** @type {Error} */ (error).message}`);
  process.exit(1);
}

/** @param {string} name */
const getBinary = (name) => path.join(binFolder, `${name}${binExtension}`);

/**
 * @param {string} label
 * @param {string} command
 * @param {readonly string[]} args
 */
const run = (label, command, args) => {
  console.log(`[@cirthcss/cirth] ${label}`);
  runSync(command, args, { cwd: projectRoot, env: process.env });
};

// Compile only public top-level Cirth entrypoints; internals are pulled in
// through @use. Uses the Sass Embedded API directly (via compileScssFolder)
// so the build does not depend on an ambiguous sass CLI binary.
const compileCss = () => {
  console.log("[@cirthcss/cirth] Compile");
  compileScssFolder({
    sourceFolder,
    outputFolder,
    filter: (dirent) => dirent.name.startsWith("cirth"),
    prefix,
  });
};

const cleanOutput = () => {
  console.log("[@cirthcss/cirth] Clean");
  fs.rmSync(outputFolder, { recursive: true, force: true });
  fs.mkdirSync(outputFolder, { recursive: true });
};

console.log("\x1b[96m[@cirthcss/cirth] Start\x1b[0m");
if (prefix !== DEFAULT_PREFIX) {
  console.log(`[@cirthcss/cirth] Custom property prefix: ${prefix}`);
}

// Keep this order: every generated CSS file should pass through Lightning CSS before minification.
run("Format", getBinary("prettier"), [
  "--write",
  "--log-level",
  "silent",
  "src/**/*.scss",
]);
run("Lint", getBinary("stylelint"), ["src/**/*.scss"]);
run("Check CSS variables", process.execPath, [
  path.join(__dirname, "check-css-variables.js"),
]);
cleanOutput();
compileCss();
run("Compile presets", process.execPath, [
  path.join(__dirname, "build-presets.js"),
  `--prefix=${prefix}`,
]);
run("Transform CSS", process.execPath, [
  path.join(__dirname, "process-css.js"),
  "--transform",
]);
run("Minify", process.execPath, [
  path.join(__dirname, "process-css.js"),
  "--minify",
]);
run("Export tokens", process.execPath, [
  path.join(__dirname, "build-tokens.js"),
  `--prefix=${prefix}`,
]);
run("Compress CSS", process.execPath, [
  path.join(__dirname, "build-brotli.js"),
]);
// Non-blocking: warns if a bundle grows past the Brotli budget so it still
// fits a single TCP/HTTP round trip. `npm run check:size` (used in CI)
// runs the same check without --warn-only and fails the build instead.
run("Check size", process.execPath, [
  path.join(__dirname, "check-css-size.js"),
  "--warn-only",
]);

console.log("\x1b[32m[@cirthcss/cirth] Done\x1b[0m");
