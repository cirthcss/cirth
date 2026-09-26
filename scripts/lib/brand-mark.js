const fs = require("node:fs");
const path = require("node:path");

// One reading of the brand mark, for every script that needs its geometry.
//
// Before this module the mark's measurements were written down twice, by
// hand, and disagreed: build-brand-lockup.js carried
// `MARK_BOX = { x: 76, y: 66, width: 340.476, height: 380 }` while the
// favicons cropped the same drawing at `88 48 346 416`. Both were correct
// for the drawing someone measured, and neither would survive a redraw,
// because nothing recomputes them and nothing notices when they are wrong.
//
// The box is derived from the path data instead. For the current mark that
// reproduces the hand-measured constant exactly.

const publicDir = path.join(__dirname, "../../docs/public");

/** The file the mark's geometry is read from. Every other asset follows it. */
const SOURCE = "logo_brand.svg";

/** @param {string} file */
const read = (file) => fs.readFileSync(path.join(publicDir, file), "utf8");

/**
 * The `d` command of every path in an SVG, in document order.
 *
 * @param {string} svg
 * @returns {string[]}
 */
const pathData = (svg) => [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);

/** The mark's own paths, from the one file that defines them. */
const markPaths = () => {
	const paths = pathData(read(SOURCE));
	if (paths.length === 0) {
		throw new Error(`brand-mark: no <path> found in ${SOURCE}`);
	}
	return paths;
};

// Exact bounds for a path. Straight segments are exact by inspection;
// Bezier segments are exact at their extrema, found by solving the
// derivative rather than by sampling the curve. Elliptical arcs are the one
// command this does not bound exactly, so it refuses them instead of
// returning a number that looks measured and is not: a mark drawn with arcs
// needs this function extended, not trusted.
/**
 * @param {number[]} values
 * @param {{ min: number, max: number }} into
 */
const track = (values, into) => {
	for (const value of values) {
		if (value < into.min) into.min = value;
		if (value > into.max) into.max = value;
	}
};

/**
 * Extrema of a cubic Bezier on one axis: the endpoints, plus any turning
 * point inside the segment.
 *
 * @param {number} p0
 * @param {number} p1
 * @param {number} p2
 * @param {number} p3
 * @returns {number[]}
 */
const cubicExtrema = (p0, p1, p2, p3) => {
	const out = [p0, p3];
	const a = -3 * p0 + 9 * p1 - 9 * p2 + 3 * p3;
	const b = 6 * p0 - 12 * p1 + 6 * p2;
	const c = 3 * p1 - 3 * p0;
	/** @param {number} t */
	const at = (t) => {
		const u = 1 - t;
		return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
	};
	if (Math.abs(a) < 1e-12) {
		if (Math.abs(b) > 1e-12) {
			const t = -c / b;
			if (t > 0 && t < 1) out.push(at(t));
		}
		return out;
	}
	const disc = b * b - 4 * a * c;
	if (disc < 0) return out;
	const root = Math.sqrt(disc);
	for (const t of [(-b + root) / (2 * a), (-b - root) / (2 * a)]) {
		if (t > 0 && t < 1) out.push(at(t));
	}
	return out;
};

/**
 * @param {number} p0
 * @param {number} p1
 * @param {number} p2
 * @returns {number[]}
 */
const quadraticExtrema = (p0, p1, p2) => {
	const out = [p0, p2];
	const denominator = p0 - 2 * p1 + p2;
	if (Math.abs(denominator) > 1e-12) {
		const t = (p0 - p1) / denominator;
		if (t > 0 && t < 1) {
			const u = 1 - t;
			out.push(u * u * p0 + 2 * u * t * p1 + t * t * p2);
		}
	}
	return out;
};

/**
 * The ink bounding box of a set of paths.
 *
 * @param {string[]} paths
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
const boundingBox = (paths) => {
	const xs = { min: Infinity, max: -Infinity };
	const ys = { min: Infinity, max: -Infinity };

	for (const d of paths) {
		const tokens = d.match(/[A-Za-z]|-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? [];
		let cursor = 0;
		let command = "";
		let x = 0;
		let y = 0;
		let startX = 0;
		let startY = 0;
		// The control point a smooth segment reflects. Reset by every
		// command that is not itself a curve, which is what the spec says.
		let reflectX = 0;
		let reflectY = 0;

		/** @returns {number} */
		const next = () => Number(tokens[cursor++]);

		while (cursor < tokens.length) {
			const token = tokens[cursor];
			if (/[A-Za-z]/.test(token)) {
				command = token;
				cursor++;
				// An implicit repeat of M continues as L, per the spec.
				if (command === "M") command = "M";
				if (command === "m") command = "m";
			}
			const relative = command === command.toLowerCase();
			const base = command.toUpperCase();
			const originX = relative ? x : 0;
			const originY = relative ? y : 0;

			if (base === "Z") {
				x = startX;
				y = startY;
				reflectX = x;
				reflectY = y;
				if (cursor < tokens.length && !/[A-Za-z]/.test(tokens[cursor])) {
					throw new Error(`brand-mark: numbers after a close-path in "${d}"`);
				}
				continue;
			}

			if (base === "M" || base === "L" || base === "T") {
				const nx = originX + next();
				const ny = originY + next();
				if (base === "T") {
					const cx = 2 * x - reflectX;
					const cy = 2 * y - reflectY;
					track(quadraticExtrema(x, cx, nx), xs);
					track(quadraticExtrema(y, cy, ny), ys);
					reflectX = cx;
					reflectY = cy;
				} else {
					track([nx], xs);
					track([ny], ys);
					reflectX = nx;
					reflectY = ny;
				}
				if (base === "M") {
					startX = nx;
					startY = ny;
					// A second coordinate pair after M is an implicit lineto.
					command = relative ? "l" : "L";
				}
				x = nx;
				y = ny;
				continue;
			}

			if (base === "H" || base === "V") {
				const value = (base === "H" ? originX : originY) + next();
				if (base === "H") {
					x = value;
					track([x], xs);
				} else {
					y = value;
					track([y], ys);
				}
				reflectX = x;
				reflectY = y;
				continue;
			}

			if (base === "C" || base === "S") {
				const c1x = base === "C" ? originX + next() : 2 * x - reflectX;
				const c1y = base === "C" ? originY + next() : 2 * y - reflectY;
				const c2x = originX + next();
				const c2y = originY + next();
				const nx = originX + next();
				const ny = originY + next();
				track(cubicExtrema(x, c1x, c2x, nx), xs);
				track(cubicExtrema(y, c1y, c2y, ny), ys);
				reflectX = c2x;
				reflectY = c2y;
				x = nx;
				y = ny;
				continue;
			}

			if (base === "Q") {
				const cx = originX + next();
				const cy = originY + next();
				const nx = originX + next();
				const ny = originY + next();
				track(quadraticExtrema(x, cx, nx), xs);
				track(quadraticExtrema(y, cy, ny), ys);
				reflectX = cx;
				reflectY = cy;
				x = nx;
				y = ny;
				continue;
			}

			throw new Error(
				`brand-mark: cannot bound the "${command}" command exactly. ` +
					"Extend boundingBox() rather than letting it guess.",
			);
		}
	}

	if (xs.min === Infinity) throw new Error("brand-mark: no drawable geometry");
	return {
		x: xs.min,
		y: ys.min,
		width: Math.round((xs.max - xs.min) * 1000) / 1000,
		height: Math.round((ys.max - ys.min) * 1000) / 1000,
	};
};

module.exports = { SOURCE, boundingBox, markPaths, pathData, publicDir, read };
