const zlib = require("node:zlib");

// Static assets can afford Brotli's highest quality. Keep the parameter
// explicit so local builds, CI and the documentation all measure the same
// bytes even if a runtime changes its encoder default.
const BROTLI_QUALITY = 11;

/**
 * @param {Buffer | string} source
 * @returns {Buffer}
 */
const brotliCompress = (source) =>
	zlib.brotliCompressSync(source, {
		params: {
			[zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
		},
	});

/**
 * @param {Buffer | string} source
 * @returns {number}
 */
const brotliSize = (source) => brotliCompress(source).length;

module.exports = { BROTLI_QUALITY, brotliCompress, brotliSize };
