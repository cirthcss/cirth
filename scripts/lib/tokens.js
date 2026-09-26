const postcss = require("postcss");

const { oklchToSrgb } = require("./color");
const { layerName } = require("./dist-manifest");
const { DEFAULT_PREFIX } = require("./prefix");

// Cirth's token surface as W3C Design Tokens (DTCG 2025.10), read from the
// compiled stylesheet rather than from src/, so the export describes exactly
// what dist/cirth.css declares and cannot drift from it (gh#93).
//
// One file per scheme. Each is complete on its own: the scheme-independent
// tokens appear in both, so a tool that loads one file as one mode never
// has to merge two.
//
// A `var()` reference to another token is exported as a DTCG alias, which
// keeps the relationship. Anything the browser computes (`color-mix()`,
// relative colours, a font stack that pulls in another stack) is exported
// resolved, because no DTCG type can express it, with the CSS it came from
// kept under $extensions so the relationship is not lost. A value no DTCG
// type can hold at all (a `calc()`, an `em` length, a `url()`) is not
// forced into one: it is listed, with its CSS and the reason, under the
// file's own $extensions, so nothing leaves the export silently.

const EXTENSION = "com.github.cirthcss";

/** @typedef {"light" | "dark"} Scheme */

/**
 * @typedef {object} OklchColor
 * @property {number} l 0..1
 * @property {number} c
 * @property {number | null} h degrees; null when the hue is missing
 * @property {number} alpha 0..1
 */

/**
 * @typedef {object} Token
 * @property {string} $type
 * @property {unknown} $value
 * @property {Record<string, { css: string }>} [$extensions]
 */

/** @typedef {{ css: string, reason: string }} Unrepresented */

// --- Reading the stylesheet -------------------------------------------

// The theme roots, as src/theme/_schemes.scss emits them. If the theme ever
// stops emitting one of these, the export fails rather than quietly
// exporting a scheme that is missing its overrides.
const BASE_ROOT = ":root, :host";
const LIGHT_ROOT =
  ':where([data-theme="light"]), :root:where(:not([data-theme="dark"])), ' +
  ':host(:where(:not([data-theme="dark"])))';
const DARK_ROOT = ':where([data-theme="dark"])';
const AUTO_DARK_ROOT =
  ":root:where(:not([data-theme])), :host(:where(:not([data-theme])))";
const AUTO_DARK_MEDIA = "only screen and (prefers-color-scheme: dark)";

/** @param {string} value */
const normalize = (value) => value.replace(/\s+/g, " ").trim();

/**
 * @param {import("postcss").Rule} rule
 * @param {string} prefix
 * @returns {[string, string][]}
 */
const customProperties = (rule, prefix) =>
  (rule.nodes ?? []).flatMap((node) =>
    node.type === "decl" && node.prop.startsWith(prefix)
      ? [[node.prop.slice(prefix.length), normalize(node.value)]]
      : [],
  );

/**
 * Splits a value on a separator that sits outside any parentheses or
 * string.
 *
 * @param {string} value
 * @param {"," | " " | "/"} separator
 * @returns {string[]}
 */
const splitTopLevel = (value, separator) => {
  /** @type {string[]} */
  const parts = [];
  let depth = 0;
  /** @type {string | null} */
  let quote = null;
  let current = "";

  for (const char of value) {
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    } else if (depth === 0 && char === separator) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part !== "");
};

/**
 * `name(args)` when the whole value is one function call.
 *
 * @param {string} value
 * @returns {{ name: string, args: string } | null}
 */
const functionCall = (value) => {
  const match = value.match(/^([a-z-]+)\((.*)\)$/s);
  if (!match) return null;

  // Reject `a(x) b(y)`: the closing parenthesis must be the opening one's.
  let depth = 0;
  for (let index = match[1].length; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    if (value[index] === ")") depth -= 1;
    if (depth === 0 && index < value.length - 1) return null;
  }
  return { name: match[1], args: match[2] };
};

/**
 * Replaces every `light-dark(a, b)` in a value with the given side, at
 * the top level, or nested, as a shadow does per layer colour. A
 * `light-dark()` that does not hold exactly two arguments is left as
 * written, so the conversion reports the value instead of guessing.
 *
 * @param {string} value
 * @param {0 | 1} side
 * @returns {string}
 */
const pickScheme = (value, side) => {
  const start = value.indexOf("light-dark(");
  if (start === -1) return value;

  let depth = 0;
  let end = start + "light-dark".length;
  for (; end < value.length; end += 1) {
    if (value[end] === "(") depth += 1;
    if (value[end] === ")") depth -= 1;
    if (depth === 0) break;
  }
  const args = splitTopLevel(
    value.slice(start + "light-dark(".length, end),
    ",",
  );
  if (args.length !== 2) return value;

  const picked = pickScheme(args[side], side);
  return (
    value.slice(0, start) + picked + pickScheme(value.slice(end + 1), side)
  );
};

/**
 * Every custom property each scheme's root resolves, in declaration order:
 * the scheme-independent root first, then the scheme's own overrides.
 * `light-dark()` pairs are split per scheme here; a `light-dark()` that
 * does not hold exactly two arguments is kept as written, and the
 * conversion below reports it as unrepresentable.
 *
 * @param {string} css
 * @param {string} [prefix]
 * @returns {Record<Scheme, Map<string, string>>}
 */
const readSchemes = (css, prefix = DEFAULT_PREFIX) => {
  const root = postcss.parse(css);
  /** @type {[string, string][]} */
  const base = [];
  /** @type {Record<string, [string, string][]>} */
  const overrides = {};
  /** @type {[string, string][] | null} */
  let autoDark = null;

  // The shipped stylesheet wraps these rules in `@layer cirth`. Treat that
  // block as the old root: direct rules are the base schemes, while direct
  // media children contain the OS preference. Descending through every
  // nested rule would mistake prefers-contrast overrides for base schemes.
  const themeContainer = /** @type {import("postcss").Container} */ (
    root.nodes.find(
      (node) =>
        node.type === "atrule" &&
        node.name === "layer" &&
        node.params === layerName &&
        node.nodes,
    ) ?? root
  );
  themeContainer.each((node) => {
    if (node.type === "rule") {
      const selector = normalize(node.selector);
      if (selector === BASE_ROOT) base.push(...customProperties(node, prefix));
      if (selector === LIGHT_ROOT)
        overrides.light = customProperties(node, prefix);
      if (selector === DARK_ROOT)
        overrides.dark = customProperties(node, prefix);
    } else if (
      node.type === "atrule" &&
      node.name === "media" &&
      normalize(node.params) === AUTO_DARK_MEDIA
    ) {
      node.each((child) => {
        if (
          child.type === "rule" &&
          normalize(child.selector) === AUTO_DARK_ROOT
        ) {
          autoDark = customProperties(child, prefix);
        }
      });
    }
  });

  if (base.length === 0 || !overrides.light || !overrides.dark) {
    throw new Error(
      "tokens: the theme roots were not found in the stylesheet. " +
        "src/theme/_schemes.scss changed the selectors this export reads; " +
        "update scripts/lib/tokens.js to match.",
    );
  }

  // The OS-preference dark block and the forced one are meant to be one
  // scheme written twice. Exporting one of them is only honest while that
  // stays true.
  if (JSON.stringify(autoDark) !== JSON.stringify(overrides.dark)) {
    throw new Error(
      "tokens: the prefers-color-scheme dark block no longer matches " +
        '[data-theme="dark"], so there is no single dark scheme to export.',
    );
  }

  /** @param {0 | 1} side @param {[string, string][]} own */
  const resolve = (side, own) => {
    /** @type {Map<string, string>} */
    const tokens = new Map();
    for (const [name, value] of base) tokens.set(name, pickScheme(value, side));
    for (const [name, value] of own) tokens.set(name, value);
    return tokens;
  };

  return {
    light: resolve(0, overrides.light),
    dark: resolve(1, overrides.dark),
  };
};

// --- Colour -----------------------------------------------------------

class Unsupported extends Error {}

/** @param {number} value */
const toLinear = (value) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/**
 * @param {{ l: number, a: number, b: number }} lab
 * @param {number} alpha
 * @returns {OklchColor}
 */
const oklabToOklch = ({ l, a, b }, alpha) => {
  const c = Math.hypot(a, b);
  // Achromatic: the hue is powerless, and CSS treats it as missing.
  const h = c < 1e-6 ? null : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c: h === null ? 0 : c, h, alpha };
};

/** @param {OklchColor} color */
const oklchToOklab = ({ l, c, h }) => {
  const radians = ((h ?? 0) * Math.PI) / 180;
  return { l, a: c * Math.cos(radians), b: c * Math.sin(radians) };
};

/**
 * @param {number} red 0..1
 * @param {number} green 0..1
 * @param {number} blue 0..1
 * @param {number} alpha
 * @returns {OklchColor}
 */
const srgbToOklch = (red, green, blue, alpha) => {
  const [r, g, b] = [red, green, blue].map(toLinear);
  const long = Math.cbrt(
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
  );
  const medium = Math.cbrt(
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
  );
  const short = Math.cbrt(
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  );
  return oklabToOklch(
    {
      l: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
      a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
      b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
    },
    alpha,
  );
};

/** @param {string} hex */
const parseHex = (hex) => {
  const digits = hex.slice(1);
  const full =
    digits.length <= 4
      ? [...digits].map((digit) => digit + digit).join("")
      : digits;
  const channels = (full.match(/../g) ?? []).map(
    (pair) => Number.parseInt(pair, 16) / 255,
  );
  return srgbToOklch(channels[0], channels[1], channels[2], channels[3] ?? 1);
};

/**
 * A number, percentage or angle, where `100%` means `percentScale`.
 *
 * @param {string} token
 * @param {number} percentScale
 */
const parseNumber = (token, percentScale) => {
  const match = token.match(/^(-?(?:\d+\.?\d*|\.\d+))(%|deg)?$/);
  if (!match) throw new Unsupported(`not a number: ${token}`);
  const number = Number.parseFloat(match[1]);
  return match[2] === "%" ? (number / 100) * percentScale : number;
};

/**
 * `calc()` over numbers and the relative-colour channel keywords, which is
 * everything the theme writes inside one.
 *
 * @param {string} expression
 * @param {Record<string, number>} channels
 * @returns {number}
 */
const evaluateCalc = (expression, channels) => {
  const tokens =
    expression.match(/-?(?:\d+\.?\d*|\.\d+)|[a-z]+|[-+*/()]/g) ?? [];
  let position = 0;

  /** @returns {number} */
  const primary = () => {
    const token = tokens[position++];
    if (token === "(") {
      const value = sum();
      position += 1; // ")"
      return value;
    }
    if (token !== undefined && token in channels) return channels[token];
    const number = Number.parseFloat(token ?? "");
    if (Number.isNaN(number)) throw new Unsupported(`calc(): ${expression}`);
    return number;
  };
  const product = () => {
    let value = primary();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const right = primary();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };
  const sum = () => {
    let value = product();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = product();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  const value = sum();
  if (position !== tokens.length)
    throw new Unsupported(`calc(): ${expression}`);
  return value;
};

/**
 * @typedef {object} Environment
 * @property {(name: string) => OklchColor} color
 * @property {(name: string) => number} number
 * @property {(args: string) => string} variable
 */

/**
 * @param {string} token
 * @param {number} percentScale
 * @param {Record<string, number>} channels
 * @param {Environment} env
 * @returns {number | null}
 */
const channel = (token, percentScale, channels, env) => {
  if (token === "none") return null;
  if (token in channels) return channels[token];
  const call = functionCall(token);
  if (call?.name === "calc") return evaluateCalc(call.args, channels);
  if (call?.name === "var") return env.number(env.variable(call.args));
  return parseNumber(token, percentScale);
};

/** @param {string} args @param {string} prefix */
const variableName = (args, prefix) => {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = args.trim().match(new RegExp(`^${escaped}([a-z0-9-]+)$`));
  if (!match) throw new Unsupported(`var(${args})`);
  return match[1];
};

/**
 * @param {string} args
 * @param {Environment} env
 * @returns {OklchColor}
 */
const evaluateOklch = (args, env) => {
  const [channelPart, alphaPart] = splitTopLevel(args, "/");
  let parts = splitTopLevel(channelPart, " ");
  /** @type {Record<string, number>} */
  let channels = {};

  if (parts[0] === "from") {
    const origin = evaluateColor(parts[1], env);
    channels = {
      l: origin.l,
      c: origin.c,
      h: origin.h ?? 0,
      alpha: origin.alpha,
    };
    parts = parts.slice(2);
  }
  if (parts.length !== 3) throw new Unsupported(`oklch(${args})`);

  const l = channel(parts[0], 1, channels, env);
  const c = channel(parts[1], 0.4, channels, env);
  const h = channel(parts[2], 1, channels, env);
  const alpha =
    alphaPart === undefined
      ? (channels.alpha ?? 1)
      : channel(alphaPart, 1, channels, env);

  return {
    l: l ?? 0,
    c: c ?? 0,
    h: h === null ? null : ((h % 360) + 360) % 360,
    alpha: alpha ?? 1,
  };
};

/**
 * `color-mix()` in oklch or oklab, with premultiplied alpha and the
 * shorter hue arc, following CSS Color 5.
 *
 * @param {string} args
 * @param {Environment} env
 * @returns {OklchColor}
 */
const evaluateColorMix = (args, env) => {
  const [method, first, second] = splitTopLevel(args, ",");
  const space = method.match(/^in (oklch|oklab)$/)?.[1];
  if (!space || second === undefined)
    throw new Unsupported(`color-mix(${args})`);

  /** @param {string} part */
  const operand = (part) => {
    const pieces = splitTopLevel(part, " ");
    const last = pieces[pieces.length - 1];
    const hasPercent = pieces.length > 1 && last.endsWith("%");
    return {
      color: evaluateColor(
        (hasPercent ? pieces.slice(0, -1) : pieces).join(" "),
        env,
      ),
      percent: hasPercent ? parseNumber(last, 1) : null,
    };
  };
  const a = operand(first);
  const b = operand(second);
  let p1 = a.percent ?? (b.percent === null ? 0.5 : 1 - b.percent);
  let p2 = b.percent ?? 1 - p1;
  const total = p1 + p2;
  if (total <= 0) throw new Unsupported(`color-mix(${args})`);
  const alphaScale = Math.min(total, 1);
  p1 /= total;
  p2 /= total;

  const alpha = a.color.alpha * p1 + b.color.alpha * p2;

  if (space === "oklab") {
    const x = oklchToOklab(a.color);
    const y = oklchToOklab(b.color);
    /** @param {"l" | "a" | "b"} key */
    const mix = (key) =>
      alpha === 0
        ? 0
        : (x[key] * a.color.alpha * p1 + y[key] * b.color.alpha * p2) / alpha;
    return oklabToOklch(
      { l: mix("l"), a: mix("a"), b: mix("b") },
      alpha * alphaScale,
    );
  }

  // oklch: a missing hue takes the other colour's.
  let h1 = a.color.h ?? b.color.h;
  let h2 = b.color.h ?? a.color.h;
  /** @type {number | null} */
  let h = null;
  if (h1 !== null && h2 !== null) {
    if (h2 - h1 > 180) h1 += 360;
    else if (h2 - h1 < -180) h2 += 360;
    h = (((h1 * p1 + h2 * p2) % 360) + 360) % 360;
  }
  /** @param {"l" | "c"} key */
  const mix = (key) =>
    alpha === 0
      ? 0
      : (a.color[key] * a.color.alpha * p1 +
          b.color[key] * b.color.alpha * p2) /
        alpha;
  return { l: mix("l"), c: mix("c"), h, alpha: alpha * alphaScale };
};

/**
 * @param {string} value
 * @param {Environment} env
 * @returns {OklchColor}
 */
const evaluateColor = (value, env) => {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return parseHex(trimmed);
  if (trimmed === "black") return srgbToOklch(0, 0, 0, 1);
  if (trimmed === "white") return srgbToOklch(1, 1, 1, 1);
  if (trimmed === "transparent") return srgbToOklch(0, 0, 0, 0);

  const call = functionCall(trimmed);
  if (call?.name === "var") return env.color(env.variable(call.args));
  if (call?.name === "oklch") return evaluateOklch(call.args, env);
  if (call?.name === "color-mix") return evaluateColorMix(call.args, env);
  throw new Unsupported(`not a colour this export can resolve: ${trimmed}`);
};

/** @param {number} value @param {number} digits */
const round = (value, digits) => Number(value.toFixed(digits));

/** @param {OklchColor} color */
const hexOf = (color) => {
  const { r, g, b } = oklchToSrgb(color.l, color.c, color.h ?? 0);
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(channel * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

/**
 * A DTCG color value. The sRGB hex is a gamut-clipped fallback, as DTCG
 * allows; the oklch components are the value.
 *
 * @param {OklchColor} color
 */
const dtcgColor = (color) => ({
  colorSpace: "oklch",
  components: [
    round(color.l, 4),
    round(color.c, 4),
    color.h === null ? "none" : round(color.h, 2),
  ],
  alpha: round(color.alpha, 4),
  hex: hexOf(color),
});

// --- Other DTCG types -------------------------------------------------

const DIMENSION = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem)$/;
const NUMBER = /^-?(?:\d+\.?\d*|\.\d+)$/;

/** @param {string} value */
const dimension = (value) => {
  if (value === "0") return { value: 0, unit: "px" };
  const match = value.match(DIMENSION);
  return match ? { value: Number.parseFloat(match[1]), unit: match[2] } : null;
};

/** @param {string} value */
const cubicBezier = (value) => {
  if (value === "linear") return [0, 0, 1, 1];
  const call = functionCall(value);
  if (call?.name !== "cubic-bezier") return null;
  const points = splitTopLevel(call.args, ",").map(Number);
  return points.length === 4 && points.every(Number.isFinite) ? points : null;
};

// --- Conversion -------------------------------------------------------

/**
 * @param {Map<string, string>} declared
 * @param {string} [prefix]
 * @returns {{ tokens: Map<string, Token>, unrepresented: Map<string, Unrepresented> }}
 */
const convertScheme = (declared, prefix = DEFAULT_PREFIX) => {
  /** @type {Map<string, Token | Unrepresented>} */
  const done = new Map();
  /** @type {Set<string>} */
  const visiting = new Set();

  /**
   * @param {string} name
   * @returns {Token | Unrepresented}
   */
  const convert = (name) => {
    const cached = done.get(name);
    if (cached) return cached;
    const css = declared.get(name);
    if (css === undefined)
      throw new Unsupported(`${prefix}${name} is not declared on the root`);
    if (visiting.has(name))
      throw new Unsupported(`${prefix}${name} refers to itself`);

    visiting.add(name);
    /** @type {Token | Unrepresented} */
    let result;
    try {
      result = convertValue(name, css);
    } catch (error) {
      if (!(error instanceof Unsupported)) throw error;
      result = { css, reason: error.message };
    } finally {
      visiting.delete(name);
    }
    done.set(name, result);
    return result;
  };

  /** @param {string} name */
  const tokenOf = (name) => {
    const result = convert(name);
    if (!("$type" in result)) {
      throw new Unsupported(
        `refers to ${prefix}${name}, which has no DTCG type`,
      );
    }
    return result;
  };

  /** @type {Environment} */
  const env = {
    variable: (args) => variableName(args, prefix),
    color: (name) => {
      const css = declared.get(name);
      if (css === undefined)
        throw new Unsupported(`${prefix}${name} is not declared`);
      tokenOf(name); // the referenced token must itself be a colour
      return evaluateColor(css, env);
    },
    number: (name) => {
      const token = tokenOf(name);
      if (token.$type !== "number")
        throw new Unsupported(`${prefix}${name} is not a number`);
      const css = declared.get(name) ?? "";
      return NUMBER.test(css)
        ? Number.parseFloat(css)
        : env.number(env.variable(functionCall(css)?.args ?? ""));
    },
  };

  /**
   * @param {string} name
   * @param {string} css
   * @returns {Token}
   */
  const convertValue = (name, css) => {
    /** @param {string} type @param {unknown} value @param {boolean} [resolved] */
    const token = (type, value, resolved = false) => ({
      $type: type,
      $value: value,
      ...(resolved ? { $extensions: { [EXTENSION]: { css } } } : {}),
    });

    const call = functionCall(css);
    if (call?.name === "light-dark") {
      throw new Unsupported(
        "light-dark() does not hold exactly two arguments, so no scheme value can be read from it",
      );
    }

    // A bare reference is an alias: the relationship survives the export.
    if (call?.name === "var") {
      const target = env.variable(call.args);
      return { $type: tokenOf(target).$type, $value: `{${target}}` };
    }

    if (name.startsWith("font-family")) {
      const families = splitTopLevel(css, ",").flatMap((part) => {
        const reference = functionCall(part);
        if (reference?.name === "var") {
          const value = tokenOf(env.variable(reference.args)).$value;
          return Array.isArray(value) ? value : [value];
        }
        return [part.replace(/^["']|["']$/g, "")];
      });
      return token("fontFamily", families, css.includes("var("));
    }

    if (name.startsWith("ease-")) {
      const points = cubicBezier(css);
      if (points) return token("cubicBezier", points);
    }

    const duration = css.match(/^(\d*\.?\d+)(ms|s)$/);
    if (duration) {
      return token("duration", {
        value: Number.parseFloat(duration[1]),
        unit: duration[2],
      });
    }

    if (name.startsWith("font-weight") && NUMBER.test(css)) {
      return token("fontWeight", Number.parseFloat(css));
    }

    const length = dimension(css);
    if (length) return token("dimension", length);

    if (NUMBER.test(css)) return token("number", Number.parseFloat(css));

    try {
      const literal =
        /^(#[0-9a-f]+|black|white|transparent|oklch\((?!from)[^()]*\))$/i.test(
          css,
        );
      return token("color", dtcgColor(evaluateColor(css, env)), !literal);
    } catch (error) {
      if (!(error instanceof Unsupported)) throw error;
    }

    // DTCG lets a composite value refer to other tokens, so a shadow
    // built from `var()`s keeps those references too.
    /** @param {string} part @param {string} type */
    const referenceTo = (part, type) => {
      const reference = functionCall(part);
      if (reference?.name !== "var") return null;
      const target = env.variable(reference.args);
      return tokenOf(target).$type === type ? `{${target}}` : null;
    };
    const shadows = splitTopLevel(css, ",").map((layer) => {
      const parts = splitTopLevel(layer, " ");
      const inset = parts[0] === "inset";
      const lengths = (inset ? parts.slice(1) : parts)
        .slice(0, -1)
        .map((part) => dimension(part) ?? referenceTo(part, "dimension"));
      if (
        lengths.length < 2 ||
        lengths.length > 4 ||
        lengths.some((part) => !part)
      ) {
        throw new Unsupported("no DTCG type holds this CSS value");
      }
      const color = parts[parts.length - 1];
      return {
        color:
          referenceTo(color, "color") ?? dtcgColor(evaluateColor(color, env)),
        offsetX: lengths[0],
        offsetY: lengths[1],
        blur: lengths[2] ?? { value: 0, unit: "px" },
        spread: lengths[3] ?? { value: 0, unit: "px" },
        ...(inset ? { inset: true } : {}),
      };
    });
    return token("shadow", shadows.length === 1 ? shadows[0] : shadows);
  };

  /** @type {Map<string, Token>} */
  const tokens = new Map();
  /** @type {Map<string, Unrepresented>} */
  const unrepresented = new Map();
  for (const name of declared.keys()) {
    const result = convert(name);
    if ("$type" in result) tokens.set(name, result);
    else unrepresented.set(name, result);
  }
  return { tokens, unrepresented };
};

/**
 * The DTCG documents for both schemes, keyed by scheme.
 *
 * @param {string} css the expanded dist/cirth.css
 * @param {string} version the package version the tokens belong to
 * @param {string} [prefix] the custom property prefix used by the build
 */
const buildTokenDocuments = (css, version, prefix = DEFAULT_PREFIX) => {
  const schemes = readSchemes(css, prefix);

  return Object.fromEntries(
    /** @type {Scheme[]} */ (["light", "dark"]).map((scheme) => {
      const { tokens, unrepresented } = convertScheme(schemes[scheme], prefix);
      const sorted = [...tokens.keys()].sort();
      return [
        scheme,
        {
          $description:
            `Cirth ${version} design tokens, ${scheme} scheme. Generated from ` +
            `dist/cirth.css; token names drop the ${prefix} prefix.`,
          $extensions: {
            [EXTENSION]: {
              version,
              scheme,
              prefix,
              unrepresented: Object.fromEntries(
                [...unrepresented.keys()]
                  .sort()
                  .map((name) => [
                    name,
                    /** @type {Unrepresented} */ (unrepresented.get(name)),
                  ]),
              ),
            },
          },
          ...Object.fromEntries(sorted.map((name) => [name, tokens.get(name)])),
        },
      ];
    }),
  );
};

module.exports = {
  EXTENSION,
  buildTokenDocuments,
  readSchemes,
};
