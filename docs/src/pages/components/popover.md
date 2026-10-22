---
layout: docs.njk
description: Present non-modal transient content with the native popover attribute and Cirth's overlay surface.
---

# Popover

`popover` is an HTML attribute that turns an element into non-modal transient
content. The browser can place the open element in the top layer, dismiss it and
connect it to an invoking button. Cirth styles its overlay surface.

{% demo "popover" %}

```html
<button type="button" popovertarget="passphrase-hint"
        aria-describedby="passphrase-hint">
  Passphrase requirements
</button>

<span id="passphrase-hint" popover>
  Use at least twelve characters.
</span>
```

`popovertarget` points to the popover's `id`. Activating the native button
toggles the popover with pointer or keyboard input. `aria-describedby` points
to the same text so assistive technology can use it as a description of the
button. That ARIA relationship is useful for this hint pattern, but it is not
required for every kind of popover.

## Browser behavior and the top layer

An open popover enters the top layer, a browser-managed plane above ordinary
document stacking. It can escape an ancestor's clipping and does not need a
larger `z-index` than the rest of the page. Unlike a modal dialog, it does not
make the background inert.

A bare `popover` attribute means `popover="auto"`. Auto popovers support light
dismiss, so clicking outside or pressing Escape closes them. The browser also
manages the invoker relationship and `:popover-open` state.

`popovertargetaction` can request `show`, `hide` or `toggle`; toggle is the
default. Application code can alternatively use `showPopover()`,
`hidePopover()` and `togglePopover()`.

## What else it is for

Cirth styles the surface without deciding what content belongs inside it.

An action list can remove the surface padding because its rows provide their
own:

```html
<button type="button" popovertarget="row-actions">Actions</button>

<ul id="row-actions" popover style="padding: 0">
  <li><a href="/edit">Edit</a></li>
  <li><a href="/duplicate">Duplicate</a></li>
  <li><a href="/archive">Archive</a></li>
</ul>
```

A filter panel can contain an ordinary form:

```html
<button type="button" popovertarget="filters">Filters</button>

<form id="filters" popover>
  <label>
    Status
    <select name="status">
      <option value="">Any</option>
      <option value="open">Open</option>
    </select>
  </label>
  <label><input type="checkbox" name="mine"> Only mine</label>
  <button type="submit">Apply</button>
</form>
```

These remain a list of links and a form. The `popover` attribute does not turn
their contents into an ARIA menu or dialog.

## Popover modes

Cirth styles only these values:

- an empty value, as produced by the bare `popover` attribute;
- `popover="auto"`;
- `popover="hint"`.

`popover="manual"` is left untouched. A manual popover is entirely controlled
by application code and may be a toast, tool overlay or other surface whose
presentation Cirth cannot infer. Browser support for `hint` behavior is newer
than support for `auto`; check [Compatibility](/compatibility) before making it
essential.

`dialog[popover]` also keeps the dialog component's presentation.

## Behavior

Cirth hides supported popover modes until `:popover-open`, including in a
browser that does not recognise the HTML attribute. This fail-closed behavior
prevents supplementary content from leaking into the page, so essential
instructions must also remain available outside the popover.

An open popover receives the overlay surface, container radius, border,
padding, shadow and a width cap of `--cirth-popover-max-width`. Text size and
layout inside are unchanged. Cirth centres the surface with `inset: 0` and
automatic margins. Trigger-relative placement requires your own positioning
rules.

The surface fades with discrete transitions where supported. Reduced-motion
preferences remove that transition.

## Positioning

The default centred placement works for a small panel, but a contextual hint
may overlap its trigger. Use CSS anchor positioning or application positioning
only after checking the target browsers. When overriding placement, set the
popover's inset or anchor properties and margins together so unrelated layout
rules do not leave one automatic side and move the panel unexpectedly.

Because Cirth is in a cascade layer, an unlayered application rule wins. Keep
broad rules such as `:last-child { margin-bottom: 0 }` from matching popovers
unless moving the overlay is intentional.

## Accessibility

- Keep hint content supplementary. Essential instructions belong in the page.
- Add `aria-describedby` when a hint describes its trigger. Do not add it to a
  menu or form merely because they use a popover.
- Use `type="button"` for an invoker inside a form unless it should also submit.
- Give a separate trigger to supplementary information instead of attaching
  `popovertarget` to a destructive or submit action.
- Keep the semantics of the content inside. Links, buttons and form controls
  still need their normal labels and behavior.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-popover-background-color` | Overlay surface |
| `--cirth-popover-border-color` | Surface edge |
| `--cirth-popover-color` | Text colour |
| `--cirth-popover-box-shadow` | Overlay elevation |
| `--cirth-popover-max-width` | Width cap |
| `--cirth-card-border-radius` | Surface radius |

## Common mistakes

- Assuming `popover` makes content modal.
- Using a hidden popover for instructions required to complete a form.
- Styling or scripting a manual popover as if it had auto light-dismiss.
- Adding menu roles without implementing the corresponding keyboard model.
- Expecting Cirth to anchor the panel to its trigger.

## Related

- [Modal](/components/modal), for a blocking interaction.
- [Dropdown](/components/dropdown), for a disclosure-based action list.
- [Compatibility](/compatibility)
