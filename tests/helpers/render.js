const { expect } = require("@playwright/test");

// One doorway for every document these specs build by hand.
//
// `page.setContent()` writes exactly what it is handed. A fragment that
// starts at `<style>` has no doctype, and a document with no doctype is
// parsed in quirks mode — `document.compatMode === "BackCompat"` — which is
// a rendering mode no page served by a real site has been in for twenty
// years. It is not a harmless difference. Measured on the same table under
// the same stylesheet: in quirks mode a `<table>` does not inherit
// `line-height`, so the computed value read `normal` instead of `24px` and
// a three-row table stood 140px tall instead of 164px. Every rule this
// suite pins about tables, line-height, typographic rhythm or intrinsic
// sizing was being checked against numbers no reader would ever see.
//
// So the doctype is not left to each spec to remember. `setContent` adds it
// and then *proves* the document came up in standards mode, on every single
// call, which is the only place the guarantee cannot drift out of: a spec
// added tomorrow gets it by importing the same function.
const DOCTYPE = "<!doctype html>";

/**
 * Set a page's content as a standards-mode document, and assert it.
 *
 * @param {import("@playwright/test").Page | import("@playwright/test").Frame} page
 * @param {string} html
 * @param {Parameters<import("@playwright/test").Page["setContent"]>[1]} [options]
 */
const setContent = async (page, html, options) => {
  const hasDoctype = html.trimStart().slice(0, 9).toLowerCase() === "<!doctype";

  await page.setContent(hasDoctype ? html : `${DOCTYPE}${html}`, options);
  await expectStandardsMode(page);
};

/**
 * `CSS1Compat` is standards mode; `BackCompat` is quirks. Exported on its
 * own so a spec that navigates to a URL — the built docs site, an example
 * file — can make the same assertion about a document it did not compose.
 *
 * @param {import("@playwright/test").Page | import("@playwright/test").Frame} page
 */
const expectStandardsMode = async (page) => {
  expect(
    await page.evaluate(() => document.compatMode),
    "document is in quirks mode: it is missing a doctype",
  ).toBe("CSS1Compat");
};

module.exports = { DOCTYPE, expectStandardsMode, setContent };
