const path = require("node:path");

const { BROTLI_QUALITY } = require("./lib/compressed-size");
const { writeBrotliSidecars } = require("./lib/brotli-sidecars");

const distFolder = path.join(__dirname, "../dist");
const written = writeBrotliSidecars(distFolder);

console.log(
  `[@cirthcss/cirth] Wrote ${written.length} Brotli sidecars at quality ${BROTLI_QUALITY}`,
);
