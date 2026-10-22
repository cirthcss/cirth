const fs = require("node:fs");
const path = require("node:path");

// One reading of the brand mark, for every script that needs its geometry
// or its colour.
//
// The mark's measurements are derived from its drawing, never written
// down: a box measured by hand is right about one drawing and silently
// wrong about the next. Every ink is painted from the theme's scales: the
// disc from the accent, so the badge and the primary share a hue by
// construction, and the figure from the neutrals.

const { parseColor } = require("./color");

const publicDir = path.join(__dirname, "../../docs/public");
const colorsFile = path.join(__dirname, "../../src/theme/_colors.scss");

// The mark is one drawing, used at every size from the 16px tab icon up. It
// names, by id, the disc that bounds the badge and the figure's two inks,
// the light fills and the dark lines drawn over them.
/** @type {{ file: string, disc: string, light: string, dark: string }} */
const DRAWING = {
	file: path.join(__dirname, "../../docs/brand/cirth-mark.svg"),
	disc: "disc",
	light: "figure-light",
	dark: "figure-dark",
};

/** @param {string} file */
const read = (file) => fs.readFileSync(path.join(publicDir, file), "utf8");

/**
 * A step of the theme's scales (`accent-500`, `canvas-light`) as written in
 * src/theme/_colors.scss.
 *
 * @param {string} name
 * @returns {string}
 */
const scaleStep = (name) => {
	const colors = fs.readFileSync(colorsFile, "utf8");
	const match = colors.match(new RegExp(`\\$${name}:\\s*(oklch\\([^)]*\\))`));
	if (!match) throw new Error(`brand-mark: $${name} not found in src/theme/_colors.scss`);
	return match[1];
};

/**
 * The same step as the uppercase hex an SVG fill carries.
 *
 * @param {string} name
 * @returns {string}
 */
const pigment = (name) => {
	const { r, g, b } = parseColor(scaleStep(name));
	/** @param {number} value */
	const channel = (value) =>
		Math.round(Math.max(0, Math.min(1, value)) * 255)
			.toString(16)
			.padStart(2, "0")
			.toUpperCase();
	return `#${channel(r)}${channel(g)}${channel(b)}`;
};

/**
 * The `d` command of every path in an SVG, in document order.
 *
 * @param {string} svg
 * @returns {string[]}
 */
const pathData = (svg) => [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);

// Exact bounds for a path. Straight segments are exact by inspection;
// Bezier segments and elliptical arcs are exact at their extrema, found by
// solving the derivative rather than by sampling the curve.
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
 * The points that bound an elliptical arc: its endpoints, plus each point
 * where the ellipse turns on an axis and that lies inside the arc's sweep.
 * The arc is converted to its centre form as SVG 1.1 appendix F.6.5 does,
 * radii scaled up when they are too small to reach.
 *
 * @param {number} x1
 * @param {number} y1
 * @param {number} rxIn
 * @param {number} ryIn
 * @param {number} degrees
 * @param {number} large
 * @param {number} sweep
 * @param {number} x2
 * @param {number} y2
 * @returns {{ xs: number[], ys: number[] }}
 */
const arcExtrema = (x1, y1, rxIn, ryIn, degrees, large, sweep, x2, y2) => {
	const xs = [x1, x2];
	const ys = [y1, y2];
	let rx = Math.abs(rxIn);
	let ry = Math.abs(ryIn);
	if ((x1 === x2 && y1 === y2) || rx === 0 || ry === 0) return { xs, ys };
	const phi = (degrees * Math.PI) / 180;
	const cos = Math.cos(phi);
	const sin = Math.sin(phi);
	const hx = (x1 - x2) / 2;
	const hy = (y1 - y2) / 2;
	const px = cos * hx + sin * hy;
	const py = -sin * hx + cos * hy;
	const reach = (px * px) / (rx * rx) + (py * py) / (ry * ry);
	if (reach > 1) {
		rx *= Math.sqrt(reach);
		ry *= Math.sqrt(reach);
	}
	const numerator = rx * rx * ry * ry - rx * rx * py * py - ry * ry * px * px;
	const denominator = rx * rx * py * py + ry * ry * px * px;
	const coefficient = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
	const ccx = (coefficient * rx * py) / ry;
	const ccy = (-coefficient * ry * px) / rx;
	const cx = cos * ccx - sin * ccy + (x1 + x2) / 2;
	const cy = sin * ccx + cos * ccy + (y1 + y2) / 2;
	/** @param {number} ux @param {number} uy @param {number} vx @param {number} vy */
	const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
	const start = angle(1, 0, (px - ccx) / rx, (py - ccy) / ry);
	let span = angle((px - ccx) / rx, (py - ccy) / ry, (-px - ccx) / rx, (-py - ccy) / ry);
	if (!sweep && span > 0) span -= 2 * Math.PI;
	if (sweep && span < 0) span += 2 * Math.PI;
	const turn = 2 * Math.PI;
	/** @param {number} theta */
	const inside = (theta) =>
		span >= 0 ? (((theta - start) % turn) + turn) % turn <= span : (((start - theta) % turn) + turn) % turn <= -span;
	/** @param {number} theta */
	const at = (theta) => ({
		x: cx + rx * cos * Math.cos(theta) - ry * sin * Math.sin(theta),
		y: cy + rx * sin * Math.cos(theta) + ry * cos * Math.sin(theta),
	});
	const turnX = Math.atan2(-ry * sin, rx * cos);
	const turnY = Math.atan2(ry * cos, rx * sin);
	for (const theta of [turnX, turnX + Math.PI]) if (inside(theta)) xs.push(at(theta).x);
	for (const theta of [turnY, turnY + Math.PI]) if (inside(theta)) ys.push(at(theta).y);
	return { xs, ys };
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

			if (base === "A") {
				const rx = next();
				const ry = next();
				const rotation = next();
				const large = next();
				const sweep = next();
				// Flags written without separators ("011") would be read as
				// one number; refuse them rather than misreading the arc.
				if (![0, 1].includes(large) || ![0, 1].includes(sweep)) {
					throw new Error(`brand-mark: unreadable arc flags in "${d}"`);
				}
				const nx = originX + next();
				const ny = originY + next();
				const arc = arcExtrema(x, y, rx, ry, rotation, large, sweep, nx, ny);
				track(arc.xs, xs);
				track(arc.ys, ys);
				reflectX = nx;
				reflectY = ny;
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

/** The name's outlines: the word as drawn for the lockup, not set in type. */
const NAME_SOURCE = path.join(__dirname, "../../docs/brand/cirth-wordmark-onest.svg");

/**
 * A path rewritten in absolute M, L, C, Q and Z commands, moved by
 * (dx, dy). Smooth curves are expanded and H and V become lines, so the
 * result is a path any consumer of this module can bound or transform.
 * Elliptical arcs are refused: the name's glyphs draw none, and rewriting
 * one would need the centre form arcExtrema() works out.
 *
 * @param {string} d
 * @param {number} [dx]
 * @param {number} [dy]
 * @returns {string}
 */
const absolutePath = (d, dx = 0, dy = 0) => {
	const tokens = d.match(/[A-Za-z]|-?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
	/** @param {number} value */
	const fmt = (value) => String(Math.round(value * 1000) / 1000);
	/** @param {number} x @param {number} y */
	const at = (x, y) => `${fmt(x + dx)} ${fmt(y + dy)}`;
	let cursor = 0;
	let command = "";
	let x = 0;
	let y = 0;
	let startX = 0;
	let startY = 0;
	let reflectX = 0;
	let reflectY = 0;
	let previous = "";
	/** @type {string[]} */
	const out = [];
	const next = () => Number(tokens[cursor++]);
	while (cursor < tokens.length) {
		if (/[A-Za-z]/.test(tokens[cursor])) command = tokens[cursor++];
		const base = command.toUpperCase();
		const relative = command !== base;
		const ox = relative ? x : 0;
		const oy = relative ? y : 0;
		if (base === "Z") {
			out.push("Z");
			x = startX;
			y = startY;
			previous = "Z";
			continue;
		}
		if (base === "M" || base === "L") {
			x = ox + next();
			y = oy + next();
			out.push(`${base}${at(x, y)}`);
			if (base === "M") {
				startX = x;
				startY = y;
				command = relative ? "l" : "L";
			}
		} else if (base === "H" || base === "V") {
			if (base === "H") x = ox + next();
			else y = oy + next();
			out.push(`L${at(x, y)}`);
		} else if (base === "C" || base === "S") {
			const smooth = base === "S";
			const c1x = smooth ? (previous === "C" ? 2 * x - reflectX : x) : ox + next();
			const c1y = smooth ? (previous === "C" ? 2 * y - reflectY : y) : oy + next();
			const c2x = ox + next();
			const c2y = oy + next();
			x = ox + next();
			y = oy + next();
			out.push(`C${at(c1x, c1y)} ${at(c2x, c2y)} ${at(x, y)}`);
			reflectX = c2x;
			reflectY = c2y;
			previous = "C";
			continue;
		} else if (base === "Q" || base === "T") {
			const smooth = base === "T";
			const cx = smooth ? (previous === "Q" ? 2 * x - reflectX : x) : ox + next();
			const cy = smooth ? (previous === "Q" ? 2 * y - reflectY : y) : oy + next();
			x = ox + next();
			y = oy + next();
			out.push(`Q${at(cx, cy)} ${at(x, y)}`);
			reflectX = cx;
			reflectY = cy;
			previous = "Q";
			continue;
		} else {
			throw new Error(`brand-mark: cannot rewrite the "${command}" command`);
		}
		previous = base;
	}
	return out.join("");
};

/**
 * The name's glyphs, one absolute path each, in the source's units with
 * every glyph's own translation applied: the baseline sits at y = 1000.
 *
 * @returns {string[]}
 */
const namePaths = () => {
	const svg = fs.readFileSync(NAME_SOURCE, "utf8");
	const glyphs = [...svg.matchAll(/<g transform="translate\(([-\d.]+)[ ,]+([-\d.]+)\)">\s*<path d="([^"]+)"/g)];
	if (glyphs.length === 0) throw new Error(`brand-mark: no glyph found in ${path.relative(process.cwd(), NAME_SOURCE)}`);
	return glyphs.map(([, tx, ty, d]) => absolutePath(d, Number(tx), Number(ty)));
};

/** @typedef {{ x: number, y: number, width: number, height: number }} Box */

/**
 * The attributes of a tag, by name.
 *
 * @param {string} tag
 * @returns {Record<string, string>}
 */
const attributes = (tag) =>
	Object.fromEntries(
		[...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([, name, double, single]) => [name, double ?? single]),
	);

/**
 * A transform as the shift it makes, or, where the shape allows it, the
 * one rotation it turns by. Anything else is refused: the box of a shape
 * moved by an arbitrary matrix is not the moved box.
 *
 * @param {string | undefined} value
 * @param {boolean} rotatable
 * @returns {{ dx: number, dy: number, rotate?: { angle: number, cx: number, cy: number } }}
 */
const readTransform = (value, rotatable) => {
	/** @type {{ dx: number, dy: number, rotate?: { angle: number, cx: number, cy: number } }} */
	const out = { dx: 0, dy: 0 };
	if (!value) return out;
	const steps = [...value.matchAll(/(\w+)\(([^)]*)\)/g)];
	for (const [, name, args] of steps) {
		const n = args.trim().split(/[\s,]+/).map(Number);
		if (name === "translate") {
			out.dx += n[0];
			out.dy += n[1] ?? 0;
		} else if (name === "rotate" && rotatable && steps.length === 1) {
			out.rotate = { angle: n[0], cx: n[1] ?? 0, cy: n[2] ?? 0 };
		} else {
			throw new Error(`brand-mark: cannot bound a shape under transform="${value}"`);
		}
	}
	return out;
};

/**
 * The box of one shape in its own coordinates.
 *
 * @param {string} tag
 * @param {Record<string, string>} a
 * @returns {Box}
 */
const shapeBox = (tag, a) => {
	/** @param {string} name */
	const num = (name) => Number(a[name] ?? 0);
	if (tag === "path") return boundingBox([a.d]);
	if (tag === "rect") return { x: num("x"), y: num("y"), width: num("width"), height: num("height") };
	if (tag === "circle") {
		const r = num("r");
		return { x: num("cx") - r, y: num("cy") - r, width: 2 * r, height: 2 * r };
	}
	if (tag === "ellipse") {
		// An ellipse turned by θ about (px, py): its centre turns with it,
		// and its half-extents are the exact ones of the rotated curve.
		const { rotate } = readTransform(a.transform, true);
		const theta = ((rotate?.angle ?? 0) * Math.PI) / 180;
		const px = rotate?.cx ?? 0;
		const py = rotate?.cy ?? 0;
		const ox = num("cx") - px;
		const oy = num("cy") - py;
		const cx = px + ox * Math.cos(theta) - oy * Math.sin(theta);
		const cy = py + ox * Math.sin(theta) + oy * Math.cos(theta);
		const rx = num("rx");
		const ry = num("ry");
		const hx = Math.hypot(rx * Math.cos(theta), ry * Math.sin(theta));
		const hy = Math.hypot(rx * Math.sin(theta), ry * Math.cos(theta));
		return { x: cx - hx, y: cy - hy, width: 2 * hx, height: 2 * hy };
	}
	throw new Error(`brand-mark: cannot bound a <${tag}>; extend shapeBox() rather than skipping it`);
};

const STROKE = ["stroke", "stroke-width", "stroke-linejoin", "stroke-miterlimit"];

/**
 * The ink box of a drawing's markup, and the box of every shape that has
 * an id. Groups may only translate. A stroke widens a shape's box by half
 * its width times the miter limit, the furthest a mitred corner can reach:
 * a bound, not a measurement. The current drawing has no strokes.
 *
 * @param {string} markup
 * @returns {{ ink: Box, byId: Record<string, Box> }}
 */
const inkOf = (markup) => {
	/** @type {Array<{ dx: number, dy: number, style: Record<string, string> }>} */
	const stack = [{ dx: 0, dy: 0, style: {} }];
	/** @type {Record<string, Box>} */
	const byId = {};
	const xs = { min: Infinity, max: -Infinity };
	const ys = { min: Infinity, max: -Infinity };
	for (const [tagText, closing, tag, , selfClosing] of markup.matchAll(/<(\/?)([a-zA-Z][\w:-]*)\b([^>]*?)(\/?)>/g)) {
		const top = /** @type {{ dx: number, dy: number, style: Record<string, string> }} */ (stack.at(-1));
		if (tag === "g") {
			if (closing) stack.pop();
			else if (!selfClosing) {
				const a = attributes(tagText);
				const shift = readTransform(a.transform, false);
				const style = { ...top.style };
				for (const name of STROKE) if (a[name]) style[name] = a[name];
				stack.push({ dx: top.dx + shift.dx, dy: top.dy + shift.dy, style });
			}
			continue;
		}
		if (closing || ["svg", "title", "desc"].includes(tag)) continue;
		const a = attributes(tagText);
		const box = shapeBox(tag, a);
		const shift = tag === "ellipse" ? { dx: 0, dy: 0 } : readTransform(a.transform, tag === "circle");
		const style = { ...top.style };
		for (const name of STROKE) if (a[name]) style[name] = a[name];
		const stroked = style.stroke && style.stroke !== "none";
		const width = Number(style["stroke-width"] ?? 1);
		const join = style["stroke-linejoin"] ?? "miter";
		const pad = !stroked ? 0 : join === "miter" ? (width * Number(style["stroke-miterlimit"] ?? 4)) / 2 : width / 2;
		const placed = {
			x: box.x + top.dx + shift.dx - pad,
			y: box.y + top.dy + shift.dy - pad,
			width: box.width + 2 * pad,
			height: box.height + 2 * pad,
		};
		if (a.id) byId[a.id] = placed;
		track([placed.x, placed.x + placed.width], xs);
		track([placed.y, placed.y + placed.height], ys);
	}
	if (xs.min === Infinity) throw new Error("brand-mark: no drawable geometry");
	/** @param {number} value */
	const round = (value) => Math.round(value * 1000) / 1000;
	return {
		ink: { x: round(xs.min), y: round(ys.min), width: round(xs.max - xs.min), height: round(ys.max - ys.min) },
		byId,
	};
};

/**
 * The markup with every colour of one element, and of everything inside
 * it, repainted. The element is found by id; its drawn colour is its own
 * fill, which must be a hex value.
 *
 * @param {string} markup
 * @param {string} id
 * @param {string} colour
 * @param {string} where
 */
const repaint = (markup, id, colour, where) => {
	const open = new RegExp(`<([a-zA-Z]+)\\b[^>]*\\sid="${id}"[^>]*?(/?)>`).exec(markup);
	if (!open) throw new Error(`brand-mark: no element with id "${id}" in ${where}`);
	const [tagText, tag, selfClosing] = open;
	let end = open.index + tagText.length;
	if (!selfClosing) {
		const inner = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, "g");
		inner.lastIndex = end;
		let depth = 1;
		/** @type {RegExpExecArray | null} */
		let match = null;
		while (depth > 0 && (match = inner.exec(markup))) {
			if (match[1]) depth--;
			else if (!match[2]) depth++;
		}
		if (!match || depth > 0) throw new Error(`brand-mark: "${id}" in ${where} is never closed`);
		end = match.index + match[0].length;
	}
	const drawn = attributes(tagText).fill;
	if (!/^#[0-9a-f]{6}$/i.test(drawn ?? "")) throw new Error(`brand-mark: "${id}" in ${where} has no hex fill to repaint`);
	const painted = markup.slice(open.index, end).replace(new RegExp(drawn, "gi"), colour);
	return markup.slice(0, open.index) + painted + markup.slice(end);
};

/**
 * The drawing of the mark, ready to publish: its view box, its markup with
 * every ink painted, its ink box, and the box of its disc, the circle a
 * lockup aligns and an icon is framed on. The drawing's title and
 * description, and its ids and data attributes, stay in the source:
 * nothing refers to them, and they describe how the drawing was made
 * rather than the mark.
 *
 * @param {{ disc: string, light: string, dark: string }} paint hex fills
 * @returns {{ viewBox: Box, body: string, ink: Box, disc: Box }}
 */
const drawing = (paint) => {
	const spec = DRAWING;
	const where = path.relative(path.join(__dirname, "../.."), spec.file);
	const source = fs.readFileSync(spec.file, "utf8");
	const root = /<svg\b[^>]*>/.exec(source);
	const box = root ? (attributes(root[0]).viewBox ?? "").trim().split(/[\s,]+/).map(Number) : [];
	if (!root || box.length !== 4 || box.some((n) => !Number.isFinite(n))) {
		throw new Error(`brand-mark: ${where} has no <svg> with a viewBox`);
	}
	let body = source
		.slice(root.index + root[0].length, source.lastIndexOf("</svg>"))
		.replace(/\s*<title\b[\s\S]*?<\/title>/g, "")
		.replace(/\s*<desc\b[\s\S]*?<\/desc>/g, "");
	if (/<(?:script|style|image|use|text|foreignObject|defs|clipPath|mask|pattern|filter|\w+Gradient)\b|url\(|href\s*=/i.test(body)) {
		throw new Error(`brand-mark: ${where} uses something the generators do not carry over (a reference, a style sheet, text or an image)`);
	}
	body = repaint(body, spec.disc, paint.disc, where);
	body = repaint(body, spec.light, paint.light, where);
	body = repaint(body, spec.dark, paint.dark, where);
	const { ink, byId } = inkOf(body);
	const disc = byId[spec.disc];
	if (!disc) throw new Error(`brand-mark: no disc "${spec.disc}" in ${where}`);
	body = body
		.replace(/\s(?:id|data-[\w-]+)="[^"]*"/g, "")
		.replace(/^\s*\n/, "")
		.replace(/\s+$/, "");
	return { viewBox: { x: box[0], y: box[1], width: box[2], height: box[3] }, body, ink, disc };
};

module.exports = { DRAWING, NAME_SOURCE, absolutePath, boundingBox, drawing, namePaths, pathData, pigment, publicDir, read, scaleStep };
