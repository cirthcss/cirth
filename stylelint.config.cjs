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
		// not laziness. Each one targets a native control quirk (search/file
		// input appearance, focus ring reset, tap highlight, Firefox text
		// size adjust) with no unprefixed equivalent inside the Browserslist
		// floor. See forms/_basics.scss, layout/_document.scss,
		// forms/_checkbox-radio-switch.scss.
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
