---
layout: docs.njk
description: Integrate Cirth with an existing stylesheet, component library or third-party widget by choosing the right build and boundary.
---

# Using Cirth with existing CSS

Use the default build when Cirth owns the document. Use a scoped build when
only one region should opt in. Use `.no-cirth` for a bounded component that
must avoid Cirth's guarded component rules.

These mechanisms solve different problems. A scoped build defines where
Cirth begins. `.no-cirth` defines a partial exclusion inside an area Cirth
already styles.

## Start with the ownership boundary

For a new Cirth page, load the default build:

```js
import "@cirthcss/cirth";
```

For an existing application shell, load the scoped build and wrap the region
that Cirth should own:

```js
import "@cirthcss/cirth/scoped";
```

```html
<div class="existing-application">
  <main class="cirth">
    <h1>Account</h1>
    <button type="button">Save changes</button>
  </main>
</div>
```

The scoped selectors require a `.cirth` ancestor. The class does not
initialize JavaScript. It is simply the selector boundary compiled into that
build.

## What the scoped build contains

The scoped build places Cirth's rules and theme roots inside the `.cirth`
subtree. Elements outside that wrapper do not opt in to those rules.

Set regional tokens on the wrapper:

```css
.cirth {
  --cirth-primary: oklch(54% 0.18 255);
  --cirth-font-family: Inter, system-ui, sans-serif;
}
```

A modal dialog or popover remains a DOM descendant when the browser presents
it in the top layer. The top layer is a browser-managed painting layer above
ordinary page content; it does not move the element to a different DOM
parent. Scoped selectors can therefore continue to match it.

Some document-root behavior cannot be expressed from a subtree. The normal
build locks the root scrollbar while a modal `dialog` is open. The scoped
build does not apply that root lock. Test long pages with open dialogs and
decide whether the host application should manage scrolling.

## Cascade layers

All Cirth rules live in `@layer cirth`. This makes ordinary unlayered
application CSS take priority without a specificity contest. It is an
override mechanism, while the scoped build and `.no-cirth` define selector
boundaries. The [Customization guide](/customization#cascade-layers) owns
layer ordering, import examples and preset placement.

## Excluding a third-party component

Add `.no-cirth` to the widget's root when its own CSS should control its
content:

```html
<section class="cirth">
  <h2>Location</h2>

  <div class="no-cirth" id="map">
    <!-- Markup owned by the map library -->
  </div>
</section>
```

Cirth's guarded content, form and component selectors do not target the
boundary or its descendants. This applies in normal, classless, scoped and
classless scoped screen builds.

The marker is an opt-out from those component declarations. It is not a
reset and not complete isolation. The subtree may still receive:

- inherited font and colour values;
- global reset behavior;
- theme custom properties;
- layout and utility rules;
- accessibility and reduced-motion rules;
- the separately loaded print stylesheet.

A selector whose subject is outside the boundary may also react to an
excluded descendant through `:has()`, or to an excluded sibling. Inspect
the integrated result when the widget changes nearby host markup.

There is no re-entry marker inside `.no-cirth`. A nested `.cirth` does not
turn guarded component styles back on.

## When to use Shadow DOM

Shadow DOM creates a browser-enforced style boundary for a component. Use it
when a widget requires stronger isolation than `.no-cirth` provides and the
component supports being mounted in a shadow root.

Cirth styles do not cross into a shadow tree unless that tree loads its own
stylesheet or exposes intentional styling hooks. Likewise, most component
styles inside the shadow tree do not escape to the host page.

Shadow DOM changes more than CSS. Events, focus handling, form participation
and testing may need component-specific work. Do not introduce it only to
avoid one simple override.

## Component libraries

A component library can coexist with Cirth when ownership is explicit:

- Put a Cirth page inside `.cirth` when the host library owns the rest.
- Put a library widget inside `.no-cirth` when Cirth owns the page.
- Use the library's supported theme API for its internals.
- Avoid loading two broad element resets over the same unbounded document.

Inspect rendered HTML before choosing a boundary. A library that renders
native `button`, `input` and `table` elements without style isolation
will match a normal Cirth build.

## Classless is not isolation

The classless build removes Cirth's optional layout, component and utility
class selectors. It still styles semantic elements globally. Choose it to
enforce an HTML-first authoring style, not to protect an existing
application from Cirth.

Use a scoped build for spatial ownership. Combine scoped and classless only
if both requirements apply. Exact entry points are on
[Package and builds](/package#screen-builds).

## Common mistakes

### Loading both normal and scoped builds

They overlap and do not compose into a stronger boundary. Load one screen
build.

### Treating `.no-cirth` as browser defaults

The marker stops a documented selector group. It does not undo inheritance,
the reset or CSS from other sources.

### Overriding tokens outside a scoped root

The scoped build establishes its token values on `.cirth`. Put overrides
on that wrapper or below it so they participate in the same subtree.

### Solving cascade order with longer selectors

Choose the correct layer order first. Add specificity only when the selector
needs to describe a more precise state or structure.

## Integration checklist

- Identify which stylesheet owns each page region.
- Load one Cirth screen build.
- Establish the project's layer order.
- Place scoped token overrides on or inside `.cirth`.
- Use `.no-cirth` only for the documented partial exclusion.
- Test inheritance, focus, forced colours, reduced motion, print and open
  top-layer controls at each third-party boundary.
