# `data-theme` on a shadow host

| | |
| --- | --- |
| Issue | None: a known issue since 2026-10-03, found while building the home page's isolated copies |
| Status | Landed in v0.17.0: every acceptance check passed (2026-10-26) |
| Baseline | `9666e8537` on `feat/v0.17-finish` |
| Breaking | Yes, in selector structure: every build gains `:host()` branches. A themed shadow host now themes its tree; nothing else renders differently |

A web component, a Lit element or an embeddable widget that loads Cirth into
its shadow root is themed the way the documentation themes a subtree: an
attribute on the outer element, here the shadow host. It does not work. In
the default and classless builds, `data-theme="dark"` on the host matches
neither scheme block: the host gets no `color-scheme` and none of the derived
tokens, and cards and buttons come out transparent. In the scoped builds the
scheme is declared on the `.cirth` wrapper, so an attribute on the host is
ignored and the copy follows the system. After this change `data-theme` on a
shadow host themes everything inside that shadow root, in every build, and an
element inside with its own `data-theme` still wins for its subtree.

## Contract

After this lands, for a stylesheet loaded inside a shadow root:

- **Default and classless builds.** `data-theme="dark"` on the shadow host
  forces the dark scheme on the host and its tree:
  `:host(:where([data-theme="dark"]))` joins the forced dark block.
  `data-theme="light"` already forced light, and no attribute already
  followed `prefers-color-scheme`.
- **Scoped builds.** `data-theme` on the shadow host themes every `.cirth`
  wrapper in that shadow root that has no `data-theme` of its own:
  `:host(:where([data-theme="dark"])) .cirth:where(:not([data-theme]))` joins
  the forced dark block, and the matching light branch the light one, so a
  light host stays light under a dark system preference.
- **What wins.** An attribute closer to the content wins, as it does in the
  document: a `[data-theme]` element inside the shadow tree, or a `.cirth`
  wrapper with its own `data-theme`, keeps its scheme whatever the host says.
- Presets follow: they re-derive on the theme roots, the host and the wrapper
  among them.
- Every branch keeps the weight of its block: `:host(:where(…))` is (0,1,0),
  like `:root`, and the scoped one (0,2,0), which beats the wrapper's
  system-preference branch at (0,1,0).

It does **not** promise:

- that a scoped build follows a `data-theme` on the page outside its shadow
  root, or, in the light DOM, on an ancestor of `.cirth`. The scoped build
  stays isolated from its host page; the shadow host is the component's own
  element, which is why it counts;
- anything about a host the outer page styles with its own copy of Cirth:
  the outer stylesheet already reaches the host as a light-DOM element.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| A dark shadow host empties the tokens in the default and classless builds | Host `data-theme="dark"`, build loaded in its shadow root: `color-scheme: normal`, `--cirth-primary-text` empty, `<article>` and `<button>` transparent, under a light and a dark system scheme | `dist/cirth.css` and `dist/cirth.classless.css` at `9666e8537`, Chromium 149.0.7827.55, 2026-10-26; the same in 0.16.0 and in Firefox 151.0 and WebKit 26.5 on 2026-10-07 | Verified |
| The scoped builds ignore the host's attribute | Host `data-theme="dark"` under a light system scheme renders light; `data-theme="light"` under a dark one renders dark | `dist/cirth.scoped.css` and `dist/cirth.classless.scoped.css` at `9666e8537`, Chromium 149.0.7827.55, 2026-10-26 | Verified |
| `:host()` cannot be reached by `:where([data-theme="dark"])` from inside the tree | Selectors Level 4 and CSS Scoping: a shadow tree's rules reach its host only through `:host`, `:host()` and `:host-context()` | Specifications, not reproduced beyond the measurements above | Reported |
| Every build reads a themed shadow host | `tests/shadow-host-theme.spec.js`: four builds, host light, dark and unthemed, light and dark system: `color-scheme`, the accent text, the card and the button equal the same markup themed in the light DOM; an inner `data-theme` wins over the host; a preset follows a dark host. 87 cases | `dist/` built from this change, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-10-26 | Verified |
| The test catches the defect | With the new `:host()` selectors removed from the default and scoped builds, exactly the four cases they serve fail: a dark host in the default build under either system scheme, and in the scoped build a dark host under a light system and a light host under a dark one | Same build, Chromium 149.0.7827.55 | Verified |
| Folding the host branches into the existing blocks keeps the size | Separate blocks repeated both scheme mixins and put the scoped builds 219 and 248 B over budget; as extra selectors in the existing lists, `cirth.scoped.min.css` is 17646 B of 17750 B and `cirth.classless.scoped.min.css` 15420 B of 15550 B | `npm run check:size`, Node 24.18.0 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Honour the host in the scoped builds too | Design | The shadow host is the component's own element and its attribute is the component's API; ignoring it would make the scoped build the only one where a themed component does not theme |
| Rejected: `:host-context([data-theme])` | Constraint | It reaches the host's ancestors in the outer page, which breaks the scoped build's isolation, and Firefox does not support it |
| The closer attribute wins | Existing contract | A `[data-theme]` subtree inside a themed document already overrides the document; the same order holds inside a shadow root |

## Acceptance

- [x] A behavior test mounts every build in a shadow root with `data-theme`
      on the host (light, dark, none) under both system schemes, and checks
      `color-scheme`, a derived token, and the card and button backgrounds
      against the same markup themed in the light DOM, in Chromium, Firefox
      and WebKit. It also checks an inner `data-theme` and a preset.
      `tests/shadow-host-theme.spec.js`, 87 cases in three engines (ledger).
- [x] `check:dist` accepts the new selectors; `check:size` passes.
      Both pass; the token export reads the forced dark block's new selector.
- [x] Themes documents theming a shadow host; the Lit guide, which loads
      Cirth into a shadow root, says so; `CHANGELOG.md` records the fix.
      Themes, the Lit guide and Upgrading; the changelog under Fixed.
