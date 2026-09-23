const fs = require("node:fs");
const path = require("node:path");

const { brotliCompress } = require("./compressed-size");
const { minifiedCssFiles } = require("./dist-manifest");

/**
 * Write one `.br` file beside every minified CSS entry point in an output
 * folder. The manifest, rather than a directory scan, decides the public
 * surface so an accidental minified file cannot silently become package API.
 *
 * @param {string} outputFolder
 * @returns {string[]} absolute paths written
 */
const writeBrotliSidecars = (outputFolder) =>
  minifiedCssFiles().map((manifestPath) => {
    const relativePath = manifestPath.replace(/^dist\//, "");
    const sourcePath = path.join(outputFolder, relativePath);
    const sidecarPath = `${sourcePath}.br`;

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`${relativePath}: minified CSS source is missing.`);
    }

    fs.writeFileSync(sidecarPath, brotliCompress(fs.readFileSync(sourcePath)));
    return sidecarPath;
  });

module.exports = { writeBrotliSidecars };
