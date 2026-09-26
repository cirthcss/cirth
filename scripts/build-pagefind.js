const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const docsDist = path.join(projectRoot, "docs/dist");
const outputPath = path.join(docsDist, "pagefind");
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

const buildPagefindIndex = async () => {
  if (!fs.existsSync(path.join(docsDist, "index.html"))) {
    throw new Error("[pagefind] docs/dist is missing; Eleventy must run first");
  }

  const pagefind = await import("pagefind");
  const created = await pagefind.createIndex({ verbose: false });
  assertNoErrors(created.errors, "could not create the index");
  if (!created.index) throw new Error("[pagefind] no index was created");

  try {
    // Every page of the current line, and none of an archived one.
    //
    // docs/versions/ is copied into the output verbatim, so the archives sit
    // in docs/dist beside the live site. Indexing the directory wholesale
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
    // docs/dist and the addresses come out unchanged.
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
          const relative = path.relative(docsDist, full);
          return archived.has(relative) ? [] : htmlFiles(full);
        }
        return entry.name.endsWith(".html") ? [full] : [];
      });

    for (const file of htmlFiles(docsDist)) {
      const added = await created.index.addHTMLFile({
        sourcePath: path.relative(docsDist, file),
        content: fs.readFileSync(file, "utf8"),
      });
      assertNoErrors(added.errors, `could not index ${path.relative(docsDist, file)}`);
    }

    // Incremental Eleventy builds keep docs/dist alive. Remove only the
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

if (require.main === module) {
  buildPagefindIndex().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { buildPagefindIndex };
