# Input date

`[type="date"]`, `[type="datetime-local"]`, `[type="month"]`,
`[type="time"]`, and `[type="week"]` share the same field chrome as other
text inputs, plus a calendar/clock icon.

<Demo src="input-date" />

```html
<input type="date">
<input type="time">
<input type="datetime-local">
```

The native calendar picker indicator is kept but made transparent and
shifted to overlay Cirth's own icon, so only one icon is visible. In
Firefox, where the picker indicator can't be hidden this way, the icon is
dropped instead and normal input padding is restored. In `[dir="rtl"]`,
text aligns right.
