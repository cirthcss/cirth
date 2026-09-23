const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");

const { compileScssFolder } = require("./lib/compile-scss");
const { version } = require("../package.json");
const { writeBrotliSidecars } = require("./lib/brotli-sidecars");
const { distFiles, tokenSchemes } = require("./lib/dist-manifest");
const { DEFAULT_PREFIX, applyPrefix, readPrefixArg } = require("./lib/prefix");
const { runSync } = require("./lib/run-sync");
const { buildTokenDocuments } = require("./lib/tokens");

// The build-time custom property prefix (gh#126), checked end to end.
//
// The claim is that `npm run build -- --prefix "--acme-"` produces the
// default artifact with the prefix swapped and nothing else. So this
// builds every dist file twice, outside dist/, through the same compile,
// transform, minify, token-export and compression steps build.js runs, and
// requires each prefixed file to equal its default counterpart with
// `--cirth-` replaced. That
// covers the root, classless, scoped and print builds and every preset,
// because it covers every file the manifest says a build produces.
//
// It does not touch dist/, so it can run beside a normal build.

const projectRoot = path.join(__dirname, "..");
const sourceFolder = path.join(projectRoot, "src");
const customPrefix = "--acme-";

/** @type {string[]} */
const checks = [];

/**
 * @param {string} label
 * @param {() => void} body
 */
const check = (label, body) => {
  body();
  checks.push(label);
};

/** @param {string} source */
const countDefault = (source) => source.split(DEFAULT_PREFIX).length - 1;

// --- Argument parsing ------------------------------------------------

check("the prefix defaults to --cirth-", () => {
  assert.strictEqual(readPrefixArg([]), DEFAULT_PREFIX);
});

check("--prefix takes its value as the next argument or after =", () => {
  assert.strictEqual(readPrefixArg(["--prefix", "--acme-"]), "--acme-");
  assert.strictEqual(readPrefixArg(["--prefix=--acme-"]), "--acme-");
  assert.strictEqual(readPrefixArg(["--prefix", "--my_ds-v2-"]), "--my_ds-v2-");
});

check("an invalid prefix is refused", () => {
  for (const bad of [
    "acme-",
    "--acme",
    "--1acme-",
    "--ac me-",
    "--",
    "-acme-",
  ]) {
    assert.throws(() => readPrefixArg(["--prefix", bad]), /not a valid/, bad);
  }
  assert.throws(() => readPrefixArg(["--prefix"]), /needs a value/);
});

check("build.js refuses an invalid prefix before touching dist/", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, "build.js"), "--prefix", "acme"],
    { cwd: projectRoot, encoding: "utf8" },
  );
  assert.strictEqual(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /not a valid custom property prefix/);
  assert.doesNotMatch(result.stdout, /Start/);
});

check("only identifiers that start with --cirth- are renamed", () => {
  assert.strictEqual(
    applyPrefix(
      "a{--cirth-x:1;color:var(--cirth-x,var(--cirth-y));--my--cirth-z:0}",
      customPrefix,
    ),
    "a{--acme-x:1;color:var(--acme-x,var(--acme-y));--my--cirth-z:0}",
  );
});

// --- Two full builds, compared ---------------------------------------

const workFolder = fs.mkdtempSync(path.join(os.tmpdir(), "cirth-prefix-"));

/** @param {string} prefix */
const buildInto = (prefix) => {
  const outputFolder = path.join(workFolder, prefix.replace(/^-+|-+$/g, ""));

  compileScssFolder({
    sourceFolder,
    outputFolder,
    filter: (dirent) => dirent.name.startsWith("cirth"),
    prefix,
  });
  compileScssFolder({
    sourceFolder: path.join(sourceFolder, "presets"),
    outputFolder: path.join(outputFolder, "presets"),
    prefix,
  });
  for (const mode of ["--transform", "--minify"]) {
    runSync(process.execPath, [
      path.join(__dirname, "process-css.js"),
      mode,
      "--dir",
      outputFolder,
    ]);
  }
  const documents = buildTokenDocuments(
    fs.readFileSync(path.join(outputFolder, "cirth.css"), "utf8"),
    version,
    prefix,
  );
  const tokensFolder = path.join(outputFolder, "tokens");
  fs.mkdirSync(tokensFolder, { recursive: true });
  for (const scheme of tokenSchemes) {
    fs.writeFileSync(
      path.join(tokensFolder, `${scheme}.tokens.json`),
      `${JSON.stringify(documents[scheme], null, "\t")}\n`,
    );
  }
  writeBrotliSidecars(outputFolder);
  return outputFolder;
};

/** @param {string} folder @param {string} file */
const readComparableText = (folder, file) => {
  const contents = fs.readFileSync(path.join(folder, file));
  return file.endsWith(".br")
    ? zlib.brotliDecompressSync(contents).toString("utf8")
    : contents.toString("utf8");
};

try {
  const defaultFolder = buildInto(DEFAULT_PREFIX);
  const prefixedFolder = buildInto(customPrefix);
  const files = distFiles().map((file) => file.replace(/^dist\//, ""));

  check(`every build file differs from the default by the prefix alone`, () => {
    for (const file of files) {
      const expected = readComparableText(defaultFolder, file);
      const actual = readComparableText(prefixedFolder, file);

      // A file with no custom properties would pass vacuously.
      assert.ok(
        countDefault(expected) > 0,
        `${file}: no ${DEFAULT_PREFIX} to rename`,
      );
      assert.strictEqual(
        countDefault(actual),
        0,
        `${file}: ${DEFAULT_PREFIX} left behind`,
      );
      assert.ok(
        actual === expected.replaceAll(DEFAULT_PREFIX, customPrefix),
        `${file}: differs from the default build by more than the prefix`,
      );
    }
  });

  check(
    `${files.length} files, including scoped builds, presets, Brotli sidecars and token exports`,
    () => {
      assert.ok(files.some((file) => file.includes(".scoped.")));
      assert.ok(files.some((file) => file.startsWith("presets/")));
      assert.ok(files.some((file) => file.startsWith("tokens/")));
    },
  );
} finally {
  fs.rmSync(workFolder, { recursive: true, force: true });
}

for (const label of checks) {
  console.log(`✓ ${label}`);
}
console.log(`\ncheck-prefix: ${checks.length} checks passed.`);
