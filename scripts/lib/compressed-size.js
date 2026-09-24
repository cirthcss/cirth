const zlib = require("node:zlib");

// Two encodings, two jobs.
//
// Gzip level 9 is the *budgeted* representation and the number the
// documentation quotes, because it is what the delivery paths Cirth
// documents actually send: GitHub Pages and unpkg never negotiate Brotli,
// and jsDelivr compresses on the fly at quality 4, which is larger than its
// own gzip. A gzip figure is the one a reader can hold the project to.
//
// Brotli quality 11 is reported alongside as the best case a consumer can
// reach by precompressing the file themselves and serving it with
// `Content-Encoding: br`. It is information, not a promise: nothing on the
// documented paths delivers it.
//
// Keep both parameters explicit so local builds, CI and the documentation
// measure the same bytes even if a runtime changes its encoder default.
const GZIP_LEVEL = 9;
const BROTLI_QUALITY = 11;

/**
 * @param {Buffer | string} source
 * @returns {number}
 */
const gzipSize = (source) => zlib.gzipSync(source, { level: GZIP_LEVEL }).length;

/**
 * @param {Buffer | string} source
 * @returns {number}
 */
const brotliSize = (source) =>
	zlib.brotliCompressSync(source, {
		params: {
			[zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
		},
	}).length;

module.exports = { BROTLI_QUALITY, GZIP_LEVEL, brotliSize, gzipSize };
