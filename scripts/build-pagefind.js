const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const docsDist = path.join(projectRoot, "docs/dist");
const archivesRoot = path.join(projectRoot, "docs/versions");

/**
 * @param {string[]} errors
 * @param {string} stage
 */
const assertNoErrors = (errors, stage) => {
  if (errors.length > 0) {
    throw new Error(`[pagefind] ${stage}: ${errors.join("; ")}`);
  }
};

// The search index of one built site, read from and written into that
// site's own directory: the one Eleventy wrote this build to, which is
// docs/dist for the ordinary build and anything else for a build given
// another output. Nothing here may assume docs/dist, or a build into a
// temporary directory would index (and overwrite) the real site's search.
/**
 * @param {{ outputDir: string }} options
 */
const buildPagefindIndex = async ({ outputDir } = /** @type {any} */ ({})) => {
  if (typeof outputDir !== "string" || outputDir === "") {
    throw new Error("[pagefind] buildPagefindIndex needs the output directory it indexes");
  }
  const siteRoot = path.resolve(outputDir);
  const outputPath = path.join(siteRoot, "pagefind");
  if (!fs.existsSync(path.join(siteRoot, "index.html"))) {
    throw new Error(`[pagefind] ${path.relative(projectRoot, siteRoot) || siteRoot} has no built site; Eleventy must run first`);
  }

  const pagefind = await import("pagefind");
  const created = await pagefind.createIndex({ verbose: false });
  assertNoErrors(created.errors, "could not create the index");
  if (!created.index) throw new Error("[pagefind] no index was created");

  try {
    // Every page of the current line, and none of an archived one.
    //
    // docs/versions/ is copied into the output verbatim, so the archives sit
    // in the output beside the live site. Indexing the directory wholesale
    // swept them in: from v0.15.0 an archived build carries the same
    // `data-pagefind-body` marker the current one does, so searching the
    // current docs started returning pages from a release the reader is not
    // on. The root index went from 51 searchable pages to 99 the first time
    // a line built after that marker was archived, and each new line would
    // have added its own.
    //
    // Files are added one at a time rather than by directory because the
    // glob cannot express the exclusion: Pagefind rejects a negated pattern.
    // `sourcePath` is what the URL is derived from, so it stays relative to
    // the output and the addresses come out the same wherever it is.
    //
    // Each archive keeps its own search: the bundle was built and frozen
    // with it, so nothing is lost by leaving it out of this one.
    const archived = new Set(
      fs.existsSync(archivesRoot) ? fs.readdirSync(archivesRoot) : [],
    );

    /** @param {string} directory @returns {string[]} */
    const htmlFiles = (directory) =>
      fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          const relative = path.relative(siteRoot, full);
          return archived.has(relative) ? [] : htmlFiles(full);
        }
        return entry.name.endsWith(".html") ? [full] : [];
      });

    for (const file of htmlFiles(siteRoot)) {
      const added = await created.index.addHTMLFile({
        sourcePath: path.relative(siteRoot, file),
        content: fs.readFileSync(file, "utf8"),
      });
      assertNoErrors(added.errors, `could not index ${path.relative(siteRoot, file)}`);
    }

    // Incremental Eleventy builds keep the output alive. Remove only the
    // generated search bundle so obsolete hashed chunks cannot accumulate.
    fs.rmSync(outputPath, { recursive: true, force: true });
    const written = await created.index.writeFiles({ outputPath });
    assertNoErrors(written.errors, "could not write the browser bundle");
    const searchablePages = fs
      .readdirSync(path.join(outputPath, "fragment"))
      .filter((file) => file.endsWith(".pf_fragment")).length;
    console.log(
      `[@cirthcss/cirth] Pagefind indexed ${searchablePages} searchable pages`,
    );
  } finally {
    await created.index.deleteIndex();
    await pagefind.close();
  }
};

// Run on its own it indexes docs/dist, or the directory named by
// `--output <dir>`:
//
//   node scripts/build-pagefind.js
//   node scripts/build-pagefind.js --output /tmp/cirth-site
if (require.main === module) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--output");
  if (at !== -1 && !args[at + 1]) {
    console.error("[pagefind] --output needs a directory");
    process.exit(1);
  }
  buildPagefindIndex({ outputDir: at === -1 ? docsDist : args[at + 1] }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { buildPagefindIndex };
