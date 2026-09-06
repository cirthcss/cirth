// The box an overlay actually fills, and the one a width media query is
// evaluated against.
//
// `window.innerWidth` is not that box. It is the window's content area,
// classic scrollbar included. On a platform that draws overlay scrollbars —
// macOS, and every phone — the two are the same number, and using either
// works by accident. On a platform that draws classic ones — the GTK
// Chromium that runs CI — the window is about 15px wider than the layout
// viewport, and every assertion that compared a fixed-position box against
// `innerWidth` was 15px out. That is what `modal.spec.js` and two tests in
// `shell-overlays.spec.js` had been failing on since 2026-09-03.
//
// `document.documentElement.clientWidth` is the layout viewport: the
// initial containing block, what `inset: 0` and `width: 100%` resolve
// against, and what media queries are evaluated against. It is the right
// reference on both platforms, so the fix is not a tolerance — the
// assertions stay exact, against the box they were always about.

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<{ height: number, width: number }>}
 */
const layoutViewport = (page) =>
	page.evaluate(() => ({
		height: document.documentElement.clientHeight,
		width: document.documentElement.clientWidth,
	}));

// A classic scrollbar's inline size, as Chromium draws it on the Linux
// runner. Nothing reads this at runtime: it is the offset used to build a
// second, narrower viewport for every overlay assertion below.
const classicScrollbar = 15;

// Overlay scrollbars cannot be turned off in a Playwright browser on macOS
// — not with a launch flag, not with `::-webkit-scrollbar`, not with
// `scrollbar-gutter` — so the Linux geometry cannot be reproduced here
// directly. It does not have to be. A classic scrollbar's only effect is
// to make the layout viewport narrower than the window, and layout and
// media queries both see nothing but the layout viewport. So a window of
// `width - 15` with no scrollbar and a window of `width` with one are the
// same document, and testing at both widths tests both platforms.
/** @param {number} width */
const withAndWithoutScrollbar = (width) => [width, width - classicScrollbar];

module.exports = { classicScrollbar, layoutViewport, withAndWithoutScrollbar };
