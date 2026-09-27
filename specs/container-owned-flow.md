# Flow by relation, owned by containers

| | |
| --- | --- |
| Issue | None yet: technical-language foundations, `design/technical-language-system` |
| Status | Draft: the mechanism is a decision for the maintainer (Open questions, 1) |
| Baseline | `806fea7a` on `design/technical-language-system` |
| Breaking | 💥 Yes: every flow element loses its own outer margin |

Space between two things is decided by what the two things are to each
other and by the container they sit in, never by one of them carrying a
margin. Today every block, field and button carries a bottom margin
inherited from Pico, and the sums come out wrong: two fields in a form sit
24px apart while two fieldsets sit 16px apart, so a group is closer to the
next group than its own fields are to each other; stacked fields in a
`.grid` alternate 40px and 24px at 390px because the gap adds to the
labels' margins; a card or a modal has to cancel the trailing margin of
whatever it holds. After this change there is one spacing scale named by
distance of meaning (line, element, group, section, chapter), each relation
between siblings takes one step of it, a container's padding and gaps are
its own, and no element brings spacing of its own anywhere. Any page whose
layout relied on an element's own margin changes.

## Grammar and tuning

| Rule (grammar) | Value (tuning) |
| --- | --- |
| Five named steps, strictly increasing, by distance of meaning | Line 0.5×, element 1×, group 2×, section 3×, chapter 5× the flow knob: 8, 16, 32, 48, 80px at the default |
| The scale is derived from the one flow knob, `--cirth-spacing` | A preset that opens the flow (playroom's 20px) moves every step in proportion |
| An element never carries its own outer margin | Nothing to tune |
| The space between two siblings is the step of their relation, set on the second one as `margin-block-start`, at zero specificity | The relation table below |
| A heading is closer to what it introduces than to what precedes it | Before `h1` and `h2`: section. Before `h3` to `h6`: group. After any heading: line |
| A container owns its padding, and a layout container owns its gaps | `.grid`, `.row`, `.group`, a card's bands, a dialog's footer: children have no block margins inside them |

The progression is not linear (steps of +8, +16, +16, +32) and each step is
at least 1.5× the one below, so the eye reads a larger gap as a larger
distance of meaning rather than as a slightly different amount.

## Contract

### Scale

| Token | Default | Relation |
| --- | --- | --- |
| `--cirth-flow-line` | 0.5rem | `calc(var(--cirth-spacing) * 0.5)` |
| `--cirth-flow-element` | 1rem | `var(--cirth-spacing)` |
| `--cirth-flow-group` | 2rem | `calc(var(--cirth-spacing) * 2)` |
| `--cirth-flow-section` | 3rem | `calc(var(--cirth-spacing) * 3)` |
| `--cirth-flow-chapter` | 5rem | `calc(var(--cirth-spacing) * 5)` |

`--cirth-typography-spacing-vertical` stays, as an alias of
`--cirth-flow-element`. `--cirth-typography-spacing-top` is removed: a
heading's top space is its relation (see below). `--cirth-block-spacing-*`
stay, and mean what they already meant in a card: container padding.

### Relations

"Blocks" below means the flow elements Cirth styles: `p`, `ul`, `ol`, `dl`,
`pre`, `table`, `blockquote`, `figure`, `hr`, `address`, `details`,
`hgroup`, `form`, `fieldset`, `label`, `article`, `section`, `aside`,
`.grid`, `.group`, `progress`, `meter`, and fields (`input` other than
checkbox and radio, `select`, `textarea`).

| Relation | Step |
| --- | --- |
| block + block | element |
| label text and its field; a field and its help text | line |
| `li + li`; `dd + dt` | line |
| heading + anything | line |
| block + `h1`, `h2` | section |
| block + `h3`, `h4`, `h5`, `h6` | group |
| anything + `fieldset`; `fieldset` + anything | group |
| `article + article` | group |
| `section + section` | section |
| `main > section + section` | chapter |
| block + a button (`button`, `[type="submit"]`, `[type="reset"]`, `[type="button"]`, `[role="button"]`) | element |
| button + button | none: buttons in a row share its line |

Inside `.grid` the gap is the element step on both axes and children have no
block margins, so a grid of fields and a stack of fields are spaced
identically. Inside a card, a dialog or a popover, the first child starts at
the padding and the last child ends at it, with nothing to cancel.

### What this does not promise

- **Spacing inside a flex or grid container of your own.** A relation margin
  is `margin-block-start` on the second of two blocks; in a row that becomes
  a vertical offset of every item after the first. Cirth's own layout
  containers zero it. Yours need `gap` and `margin: 0` on their children,
  which the zero-specificity rules let any selector win.
- **Space after a `div`.** A `div` is not a block in this list, because it is
  the element consumers build rows from. A paragraph after a `div` gets no
  space from Cirth.
- **The old heading top spaces.** `h3` moves from 40px to the group step
  (32px); `h1` and `h2` keep 48px.

## Measurements

"Before" is `dist/cirth.css` at `806fea7a` alone, Chromium 149.0.7827.55,
1280px, a page of sections, headings, a form with two fieldsets and two
cards; the grid row is `/forms/text-inputs/` at 390px. "After" is the
contract above; it has not been prototyped, and the implementation measures
it on the rendered page.

| Relation | Before | After |
| --- | --- | --- |
| Label text → its field | 4px | 8px (line) |
| `li` → `li` | 4px | 8px (line) |
| Heading → first block | 8px | 8px (line) |
| Paragraph → paragraph | 16px | 16px (element) |
| Field → next field, stacked | 24px | 16px (element) |
| Field → next field, `.grid` at 390px | 40px and 24px, alternating | 16px (element) |
| Fieldset → fieldset | 16px | 32px (group) |
| Block → `h3` | 40px | 32px (group) |
| Card → card | 20px | 32px (group) |
| Block → `h1`, `h2` | 48px | 48px (section) |
| Section → section in `main` | 48px | 80px (chapter) |

Before, the group step (fieldset to fieldset, 16px) is smaller than the
element step inside a group (field to field, 24px). After, every step is
larger than the one below it.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Stacked fields at 390px alternate 40px and 24px | Input to input 68px and 52px; the label adds 28px above each input, leaving 40px and 24px between an input and the next label | `/forms/text-inputs/` at 390px, docs at `94f7c669`, Chromium 149.0.7827.55, `evidence/before-default.json` | Verified |
| The modal footer had 13px above its buttons and 28px below | Measured on the modal demo | Same run | Verified; fixed in `084bcec8` with `tests/modal.spec.js` |
| There is no group step distinct from the field step | `fieldset` margin 16px; fields 24px apart inside it | `dist/cirth.css` at `806fea7a`, Chromium 149 | Verified |
| The table of "before" values | Measured as described above | Same | Verified |
| The "after" values hold on a rendered page | Not prototyped | Implementation acceptance | Reported |
| A relation margin misaligns a consumer flex row of Cirth blocks | Follows from `margin-block-start` on the second item; not reproduced here | Implementation: a fixture in `tests/flow-spacing.spec.js` pins the documented behaviour | Reported |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| A relation sets the space, on the second sibling | Design | The space between two things is a property of the pair; carried by one of them it adds up with gaps, padding and the other's margin |
| Relations are typed on both sides and parent-agnostic | Design | A paragraph inside a consumer's `div` still gets its spacing; buttons and links never do, so a row of controls never offsets |
| Rejected: relations only inside named containers | Design | Every content wrapper a consumer writes as a `div` (a CMS body, a panel) would lose paragraph spacing |
| Rejected: `* + *` on every child of a container | Design | Reaches inline-level controls; the second of two buttons in a form would drop a line |
| Rejected: keep element margins and fix the three measured bugs | Design | The fixes are local exceptions (zero the label's margin in a grid, special-case the footer) and the next composition finds the next sum. It is the conservative fallback if the breaking change is not wanted |
| Rejected: making containers `display: flex` with `gap` | Existing contract | Changes the formatting context of `form`, `section` and `article`: floats, inline content and margin collapsing all change |
| Steps derived from `--cirth-spacing` | Existing contract | The knob already means "the flow"; a preset that sets it gets a proportional scale, as playroom does today for paragraphs |
| h3 to the group step | Design | Five steps, not six: a subsection is a group of paragraphs, and 40px was a value, not a step |

## Acceptance

- [ ] On a rendered page the five steps measure strictly increasing, and
      every relation in the table measures its step to ±1px:
      `tests/flow-spacing.spec.js`, rewritten around the relation table.
- [ ] Stacked fields at 390px equal to ±1px, in and out of `.grid`; group
      step > element step in a form.
- [ ] Card, dialog and popover: first child at the padding, last child at the
      padding, with no trailing-margin rule left in the source.
- [ ] Headings keep more space above than below at every level.
- [ ] `tests/native-element-defaults.spec.js`, `tests/list-nesting.spec.js` and
      `tests/layout.spec.js` updated where they encoded margins, each change
      explained.
- [ ] `npm run check:visual` differences reviewed page by page before any
      baseline is regenerated.
- [ ] `docs/src/pages/upgrading.md` carries the migration below;
      `docs/src/pages/customization.md` documents the scale.

## Migration

| If you | Then |
| --- | --- |
| Zeroed `margin-bottom` on a Cirth element to remove its space | Zero `margin-block-start` on the element after it, or `margin: 0` |
| Built a flex or grid row out of Cirth blocks (`article`, `label`, `fieldset`, fields) | Give the row `gap` and its children `margin: 0` |
| Relied on space after a `div` wrapper | Put the space on the wrapper, or use a block element |
| Set `--cirth-typography-spacing-top` on a heading | Set `margin-block-start` on it, or change `--cirth-flow-section` / `-group` |
| Relied on the 4px between list items | Set `--cirth-flow-line`, or `margin-block-start` on `li + li` |
| Set `--cirth-spacing` | Nothing: every step follows |

## Open questions

1. **Take the breaking change, or the conservative fallback?** The relation
   model is what the direction asks for and removes the class of bug; the
   fallback fixes the three measured bugs inside the Pico model with no
   migration. This is the one decision in the four specs that is the
   maintainer's rather than the design's.
2. **Should `div` be a block?** Including it restores spacing after
   wrappers and offsets every consumer row built from `div`s. Proposed: no.
3. **Nav, dropdown, segmented control and accordion** set their own internal
   spacing today. They are layout containers under this model and zero their
   children's block margins; each is checked at implementation.
