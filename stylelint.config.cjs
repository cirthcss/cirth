module.exports = {
	extends: ["stylelint-config-standard-scss"],
	rules: {
		"declaration-no-important": true,

		// Keywords whose written case is conventional, not enforceable by a
		// blanket lowercase rule: currentColor/optimizeLegibility are
		// case-insensitive per spec but universally written camelCase, and
		// font family names (system-ui stack, Georgia, SFMono-Regular, ...)
		// are proper nouns that read as typos in lowercase.
		"value-keyword-case": [
			"lower",
			{
				ignoreKeywords: ["currentColor", "optimizeLegibility"],
				ignoreProperties: ["/^font$/", "/font-family/"],
			},
		],

		// Genuinely necessary cross-browser workarounds — not API surface,
		// not laziness. What survives targets a native control quirk with no
		// unprefixed equivalent inside the Browserslist floor: the
		// non-standard `appearance` values (search and file inputs, buttons),
		// the range thumb pseudo-element, the color swatch focus ring, tap
		// highlight, and text fill color. See forms/_basics.scss,
		// forms/_input-range.scss, forms/_input-color.scss,
		// layout/_document.scss.
		// Prefixes the build already generates from the standard property
		// (backdrop-filter, mask-*, user-select, text-size-adjust,
		// print-color-adjust) are deliberately *not* written by hand:
		// Lightning CSS adds them per Browserslist, and duplicating them in
		// the source only suggests they are load-bearing.
		"property-no-vendor-prefix": null,
		// @-moz-document url-prefix() in forms/_input-date.scss: the only way
		// to feature-target Firefox in CSS, no standard alternative exists.
		"at-rule-no-vendor-prefix": null,

		// A more specific version of this already runs as its own check
		// (scripts/check-css-variables.js, part of `npm run lint`): it
		// requires the --cirth- prefix specifically, which this rule's
		// generic kebab-case pattern can't express. Enabling both would only
		// duplicate the same signal.
		"custom-property-pattern": null,

		// Deliberate formatting choice, not inconsistency: long calc() chains
		// break the line right after the operator so the continuation reads
		// as "still building this value" (see any --cirth-form-element-*
		// spacing calc). Applied consistently throughout src/ — reformatting
		// would be a large mechanical diff for a pure style preference with
		// no correctness upside, so left as the project's chosen convention
		// rather than the linter's default.
		"scss/operator-no-newline-after": null,
	},
};
