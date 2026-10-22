---
layout: docs.njk
description: Use responsive images, inline SVG, audio, video, canvas, and iframe content with Cirth's small consistency fixes.
---

# Embedded content

Images and other embedded media keep their native browser behavior. Cirth
adds only the sizing, alignment, border, and color defaults needed for them to
fit consistently into a page.

{% demo "embedded" %}

```html
<figure>
  <img src="team.jpg"
       width="1200"
       height="800"
       alt="The support team standing outside the London office">
  <figcaption>The support team in London.</figcaption>
</figure>
```

The `width` and `height` attributes give the browser the image's intrinsic
dimensions before the file finishes loading. The browser can reserve the
correct aspect ratio and reduce layout movement. Cirth can still scale the
image down to fit its container.

## Native behavior and accessible names

- `<img>` embeds an image. Use meaningful `alt` text when the image conveys
  information. Use `alt=""` when it is purely decorative and nearby text
  already provides everything a reader needs.
- Inline `<svg>` draws vector content. A meaningful standalone SVG can use
  `role="img"` and `aria-label`, or `aria-labelledby` pointing to visible or
  embedded text. Decorative SVG should be hidden from assistive technology.
- `<audio>` and `<video>` use native playback controls when the `controls`
  attribute is present. The application supplies captions, transcripts, and
  alternative content appropriate to the media.
- `<iframe>` embeds another page. Give it a concise `title` that identifies
  the embedded content, such as `title="Map of the London office"`.
- `<canvas>` is a bitmap drawing surface controlled by script. Provide
  equivalent fallback content or another accessible representation when the
  drawing carries information.

ARIA describes content but does not create alternative text, captions, or
keyboard interaction. Those remain part of the page's content and application
logic.

## What Cirth adds

- Images use `max-width: 100%`, so a large file scales down instead of
  overflowing its container.
- When both dimension attributes are present, `height: auto` preserves the
  image's aspect ratio while it scales. A height-only image keeps that explicit
  height.
- `audio`, `canvas`, `iframe`, `img`, `svg`, and `video` align to the middle
  of the surrounding line, avoiding the inline baseline gap.
- Iframes have no default border.
- An inline SVG without its own `fill` uses `currentColor`, so a simple icon
  follows the surrounding text color.

Cirth does not make every media element full width and does not define an
aspect ratio for files whose dimensions are unknown.

## Common mistakes

- Do not omit `alt` from an image because a caption exists. A caption and an
  image alternative serve different purposes.
- Do not repeat the same wording in `alt` and `<figcaption>` unless both are
  necessary. Describe the image in `alt`; use the caption for context or a
  conclusion.
- Do not remove native audio or video controls without supplying an equally
  operable replacement.
- Do not rely on an iframe's visible surroundings as its only title.

## Related pages

- [Figure](/content/figure)
- [Screen-reader only](/utilities/sr-only)
- [Accessibility guide](/guides/accessibility)
