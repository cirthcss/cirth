---
layout: docs.njk
---


# Input date

`[type="date"]`, `[type="datetime-local"]`, `[type="month"]`,
`[type="time"]`, and `[type="week"]` share the same field chrome as other
text inputs, plus a calendar/clock icon.

{% demo "input-date" %}

```html
<input type="date">
<input type="time">
<input type="datetime-local">
```

The native calendar picker indicator is kept but made transparent and
shifted to overlay Cirth's own icon, so only one icon is visible. In
Firefox, where the picker indicator can't be hidden this way, the icon is
dropped instead and normal input padding is restored. In `[dir="rtl"]`,
text aligns right. In Safari/WebKit, the internal date/time segments are
also reset to inherit text alignment and drop their default vertical
padding, avoiding the centered/misaligned rendering iOS otherwise applies.
Date-like controls can also shrink as flex items, so paired ranges remain
on one row inside grouped grid columns.
