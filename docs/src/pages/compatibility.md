---
layout: docs.njk
description: Check Cirth's browser floor, required CSS features, build-pipeline risks and boundaries with existing styles.
---

# Compatibility

Use this page to decide whether Cirth can run unchanged in your browsers and
CSS pipeline. Loading instructions belong to [Installation](/installation/);
package entry points belong to [Package and builds](/package).

## Browser support

{{ browsers.sentence }}.

This list is the `browserslist` target in `package.json`. Lightning CSS
uses it when compiling the distributed stylesheets. A repository check keeps
desktop and mobile engines aligned, including the Chromium versions used by
Opera and Samsung Internet.

The browser floor is a compilation contract, not a claim that every listed
floor release is launched in CI. Automated behavior tests run in the current
Playwright builds of Chromium, Firefox and WebKit. The built documentation is
also checked with axe in its supported themes and tested states.

### Below the floor

Older browsers are unsupported. There is no legacy bundle.

CSS fails declaration by declaration or rule by rule. A browser may apply
parts it understands and ignore other parts, so the result is not a
predictable reduced version of Cirth. It may have incorrect colours, missing
states or incomplete layout. Test the real browser if your audience requires
an older version.

## Modern CSS requirements

Cirth uses modern platform features as part of its normal output:

| Feature | Where Cirth uses it | What is at risk without it |
| --- | --- | --- |
| Cascade layers | Every shipped rule is inside `@layer cirth` | The stylesheet's cascade contract |
| `light-dark()`, relative OKLCh and `color-mix()` | Theme colours and derived states | Theme colours and contrast relationships |
| `:has()` | Relational component and state selectors | Some layout and state rules |
| `:user-invalid` | Form validation after user interaction | The timed invalid-state styling |
| Top-layer selectors | Modal dialogs and popovers | Overlay presentation and related styling |
| `@starting-style` and discrete transitions | Entry and exit motion | Animation; the underlying control can still work |
| `lh` and dynamic viewport units | Sizing and viewport-bound surfaces | Exact sizing and overflow behavior |

Some features are enhancements rather than prerequisites for the underlying
HTML control. For example, a browser can open a supported `dialog` even if
it cannot perform Cirth's exit transition. Component pages document those
specific limits.

## If your build transpiles CSS

Cirth is already compiled for the browser floor above. It should normally
pass through your pipeline without being lowered again.

Some tools target older browsers by default and rewrite `light-dark()`.
The page can still follow the system scheme after that rewrite, but a
`data-theme` attribute on a nested element may fail to force the
opposite scheme. A dark panel inside a light page is a common case.

The integration fixtures were checked between
{{ frameworks.checkedBetween[0] | longDate }} and
{{ frameworks.checkedBetween[1] | longDate }}. This matrix records the
observed category; each linked guide owns the exact setting and tested
versions.

| Observed pipeline behavior | Tools |
| --- | --- |
| Lowers modern colour syntax unless configured for Cirth's browser floor | {% for guide in frameworks.pipelines.lowers %}<a href="{{ guide.link }}">{{ guide.name }}</a>{% if not loop.last %}, {% endif %}{% endfor %} |
| Keeps the required syntax in the verified starter | {% for guide in frameworks.pipelines.keeps %}<a href="{{ guide.link }}">{{ guide.name }}</a>{% if not loop.last %}, {% endif %}{% endfor %} |
| Serves or copies the distributed file without a CSS transform | {% for guide in frameworks.pipelines.asIs %}<a href="{{ guide.link }}">{{ guide.name }}</a>{% if not loop.last %}, {% endif %}{% endfor %} |

If a tool is not listed, inspect the production CSS rather than assuming its
development behavior is the same. Search for `light-dark(` in the emitted
file and verify a nested `data-theme` region in the opposite scheme.

## Bundlers and CSS pipelines

Any tool that accepts a global CSS import can consume the package. Cirth does
not require Sass, PostCSS or a JavaScript plugin.

The important distinction is whether the tool:

1. resolves the package's CSS export;
2. preserves Cirth's supported-browser target;
3. loads the result once as global CSS;
4. keeps the import order you intended for presets and overrides.

Use the [framework guides](/framework-guides) for verified configuration.
If your stack is not listed, follow its documented global-CSS mechanism and
then perform the checks above.

## Beside your own CSS

The normal build styles matching elements across the document. The scoped
build places those component and content selectors inside a `.cirth`
subtree. Both builds keep their rules in the `cirth` cascade layer, so
unlayered application CSS normally takes priority.

<span id="excluding-a-third-party-component"></span>
<span id="normal-and-scoped-builds"></span>

The `.no-cirth` marker provides a partial component opt-out. It is not a full
style boundary. The scoped build also cannot apply the normal build's
document-root scroll lock while a modal dialog is open.

Read [Using Cirth with existing CSS](/guides/existing-css) for the scoped
wrapper, cascade-layer ordering, the exact exclusion boundary, third-party
widgets and stronger isolation with Shadow DOM. The
[package page](/package#screen-builds) owns the build names and import paths.

## Feature-specific limits

- Dialog exit animation uses the `overlay` transition where the browser
  implements it. The dialog still closes when that transition is absent.
- `::details-content` enhances accordion animation where supported. The
  native `details` disclosure remains the interaction.
- Declarative `command` and `commandfor` controls have a newer browser
  support floor than Cirth itself. The [Modal](/components/modal) page
  provides progressive-enhancement guidance.
- Non-dialog popover styling targets the standard auto and hint modes.
  Manual popovers need deliberate application styling.

These limits are local to the feature. Follow the linked component page
instead of treating them as requirements for every Cirth page.

## What the package contains

[Package and builds](/package) is the authoritative inventory of exports,
physical files, presets and token JSON.

## Delivering the stylesheet

[Delivery and deployment](/delivery) covers version-pinned CDN URLs,
Subresource Integrity, self-hosting, caching and compression.

### Every build from the CDN

Use the maintained snippets on [Delivery and deployment](/delivery#cdn-files).
Do not combine a URL from one version with an integrity hash from another.

### Compression

Compression is a server concern, not a different Cirth build. See
[Compression](/delivery#compression) for verification commands and
deployment guidance.

### Print

Browser support for the print rules is documented with their behavior on
the [Print](/utilities/print) page.

## Before adopting Cirth

- Confirm that your supported browsers meet the floor.
- Build production CSS and verify that required syntax remains intact.
- Choose normal or scoped ownership for the page.
- Test any third-party widget at its actual integration boundary.
- Exercise dialogs, popovers and form validation in the browsers your users
  rely on.
