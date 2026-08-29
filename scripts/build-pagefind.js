const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const docsDist = path.join(projectRoot, "docs/dist");
const outputPath = path.join(docsDist, "pagefind");

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
    const indexed = await created.index.addDirectory({
      path: docsDist,
      glob: "**/*.html",
    });
    assertNoErrors(indexed.errors, "could not index docs/dist");

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
