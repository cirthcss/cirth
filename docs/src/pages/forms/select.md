---
layout: docs.njk
description: The native select in Cirth. A chevron, a placeholder option, option groups, and multiple selection, all from the standard element.
---

# Select

A `select` looks like the text fields beside it, with a chevron at the end.
It stays the browser's own control, so the list that opens is the
platform's, with its keyboard and touch behaviour.

{% demo "forms-select" %}

```html
<label>
  Country
  <select name="country" autocomplete="country" required>
    <option value="" selected disabled>Choose a country…</option>
    <option value="it">Italy</option>
    <option value="fr">France</option>
  </select>
</label>

<label>
  Time zone
  <select name="timezone">
    <optgroup label="Europe">
      <option>Rome</option>
      <option selected>London</option>
    </optgroup>
  </select>
</label>

<label>
  Notify me about
  <select name="topics" multiple size="4">
    <option selected>Releases</option>
    <option>Security advisories</option>
  </select>
</label>
```

## A placeholder option

An empty, `disabled`, `selected` first option on a `required` select reads
as a prompt: while it is chosen, the select is invalid, and Cirth paints its
text in the placeholder colour. It does not turn red while it has focus: a
select that is still being chosen from is not an error yet.

## Multiple selection and size

With `multiple` or a `size` above one, the select shows its options as a
list instead of a menu. The chevron goes, and chosen options take
`--cirth-form-element-selected-background-color`.

## States

A select has the same focus, disabled and validation states as a
[text input](/forms/text-inputs#states). It grows with its longest option
and never drops below 44px, whatever its font size.

## Accessibility

- Label every select, and use `optgroup` labels to structure long lists.
- For two or three options, radios are faster to scan and need no opening:
  see [Checkbox, radio and switch](/forms/checkbox-radio-switch), including
  the segmented control.
- A multiple select is hard to use with a pointer alone; a list of
  checkboxes is often the better control.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-chevron` | The chevron, one per colour scheme |
| `--cirth-form-element-selected-background-color` | A chosen option in a list |
| `--cirth-form-element-placeholder-color` | The prompt option |

The surface, edge and focus tokens are shared with
[text inputs](/forms/text-inputs#tokens).

## Related

- [Dropdown](/components/dropdown), for a menu of actions or links rather
  than a form value.
- [Validation and states](/forms/validation).
