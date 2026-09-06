// The box an overlay actually fills, and the one a width media query is
// evaluated against.
//
// Not `window.innerWidth`: that is the window's content area, classic
// scrollbar included. On a platform that draws overlay scrollbars — macOS,
// and every phone — the two are the same number, so using it works by
// accident; on the GTK Chromium that runs CI the window is about 15px
// wider than the box, and every assertion that compared a fixed-position
// element against it was 15px out.
//
// And not `document.documentElement.clientWidth` either, which is the
// obvious replacement and is also wrong. This library reserves the
// scrollbar's space permanently with `scrollbar-gutter: stable`, and while
// an overlay is open the framework's modal rule puts `overflow: hidden` on
// the root — so there is no scrollbar to subtract, `clientWidth` answers
// with the whole 390, and the reserved gutter has still taken 15px off the
// box the overlay is laid out in. CI failed on exactly that: expected 390,
// received 375.
//
// So ask the question in the terms the answer is given in — put a fixed
// element in the box and measure it. `popover.spec.js` has done this since
// it hit the same wall.

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<{ height: number, width: number }>}
 */
const layoutViewport = (page) =>
	page.evaluate(() => {
		const probe = document.createElement("div");
		probe.style.cssText =
			"position: fixed; inset: 0; visibility: hidden; pointer-events: none";
		document.body.append(probe);
		const { height, width } = probe.getBoundingClientRect();
		probe.remove();
		return { height, width };
	});

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
