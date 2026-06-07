module.exports = {
	extends: ["stylelint-config-standard-scss"],
	rules: {
		// Prettier owns formatting, spacing, and small notation choices.
		"alpha-value-notation": null,
		"at-rule-empty-line-before": null,
		"color-function-alias-notation": null,
		"color-function-notation": null,
		"color-hex-length": null,
		"comment-empty-line-before": null,
		"declaration-block-no-redundant-longhand-properties": null,
		"declaration-empty-line-before": null,
		"keyframe-selector-notation": null,
		"length-zero-no-unit": null,
		"rule-empty-line-before": null,
		"selector-pseudo-element-colon-notation": null,
		"scss/dollar-variable-empty-line-before": null,
		"scss/double-slash-comment-empty-line-before": null,
		"scss/no-global-function-names": null,
		"scss/operator-no-newline-after": null,
		"value-keyword-case": null,

		// Cirth keeps selectors, custom properties, vendor prefixes, and legacy fallbacks as API surface.
		"at-rule-no-vendor-prefix": null,
		"custom-property-pattern": null,
		"no-descending-specificity": null,
		"property-no-deprecated": null,
		"property-no-vendor-prefix": null,
		"selector-class-pattern": null,
		"selector-id-pattern": null,
	},
};
