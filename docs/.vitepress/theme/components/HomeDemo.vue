<script setup lang="ts">
// Homepage signature: plain semantic HTML is typed on the left and the
// rendered result materializes on the right, one element at a time. The
// animation runs as an endless cycle — type forward, hold, delete
// backward, hold, repeat. The full final state is server-rendered, so
// no-JS visitors, search engines, and screen readers always get the
// complete content; the animation is a purely visual layer applied after
// mount, and skipped entirely under prefers-reduced-motion.
import { onBeforeUnmount, onMounted, ref } from "vue";

interface Segment {
	/** Source text appended to the code pane (typed character by character). */
	src: string;
	/** Complete, well-formed markup for the preview once this segment lands. */
	snapshot: string;
}

const segments: Segment[] = [
	{
		src: "<article>\n  <h2>Sign in</h2>\n",
		snapshot: "<article><h2>Sign in</h2></article>",
	},
	{
		src: '  <form>\n    <label>\n      Email\n      <input type="email">\n    </label>\n',
		snapshot:
			'<article><h2>Sign in</h2><form><label>Email <input type="email"></label></form></article>',
	},
	{
		src: '    <label>\n      Password\n      <input type="password">\n    </label>\n',
		snapshot:
			'<article><h2>Sign in</h2><form><label>Email <input type="email"></label><label>Password <input type="password"></label></form></article>',
	},
	{
		src: '    <label>\n      <input type="checkbox" checked>\n      Remember me\n    </label>\n',
		snapshot:
			'<article><h2>Sign in</h2><form><label>Email <input type="email"></label><label>Password <input type="password"></label><label><input type="checkbox" checked> Remember me</label></form></article>',
	},
	{
		src: "    <button>Sign in</button>\n  </form>\n</article>",
		snapshot:
			'<article><h2>Sign in</h2><form><label>Email <input type="email"></label><label>Password <input type="password"></label><label><input type="checkbox" checked> Remember me</label><button>Sign in</button></form></article>',
	},
];

const fullSource = segments.map((segment) => segment.src).join("");
const finalSnapshot = segments[segments.length - 1].snapshot;

// Cumulative typed length at which each segment is complete; used to step
// the preview back while deleting.
const segmentEnds: number[] = [];
segments.reduce((acc, segment) => {
	const end = acc + segment.src.length;
	segmentEnds.push(end);
	return end;
}, 0);

const TYPE_MS = 18;
const NEWLINE_MS = 60;
const SEGMENT_RENDER_MS = 240;
const HOLD_FULL_MS = 3500;
const DELETE_MS = 9;
const HOLD_EMPTY_MS = 900;

const typed = ref(fullSource);
const preview = ref(finalSnapshot);
const animated = ref(false);
let timers: ReturnType<typeof setTimeout>[] = [];

const clearTimers = () => {
	for (const timer of timers) clearTimeout(timer);
	timers = [];
};

// One full cycle: type each segment (rendering its preview as it lands),
// hold the finished page, delete backward (the preview un-building the
// same way), hold the blank pane, then schedule the next cycle.
const cycle = () => {
	clearTimers();
	typed.value = "";
	preview.value = "";
	let at = 0;

	for (const segment of segments) {
		for (const char of segment.src) {
			at += char === "\n" ? NEWLINE_MS : TYPE_MS;
			timers.push(
				setTimeout(() => {
					typed.value += char;
				}, at),
			);
		}
		at += SEGMENT_RENDER_MS;
		timers.push(
			setTimeout(() => {
				preview.value = segment.snapshot;
			}, at),
		);
	}

	at += HOLD_FULL_MS;

	for (let length = fullSource.length - 1; length >= 0; length--) {
		at += DELETE_MS;
		const sliceTo = length;
		timers.push(
			setTimeout(() => {
				typed.value = fullSource.slice(0, sliceTo);
				const partial = segmentEnds.findIndex((end) => sliceTo < end);
				preview.value =
					partial <= 0 ? "" : segments[partial - 1].snapshot;
			}, at),
		);
	}

	at += HOLD_EMPTY_MS;
	timers.push(setTimeout(cycle, at));
};

onMounted(() => {
	const reduceMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	if (!reduceMotion) {
		animated.value = true;
		timers.push(setTimeout(cycle, 600));
	}
});

onBeforeUnmount(clearTimers);
</script>

<template>
	<div class="home-demo" aria-label="Live example: semantic HTML rendered by Cirth">
		<!-- The code pane is "the stone": it keeps Cirth's dark scheme in both
		     site themes, so the markup always reads as carved into dark
		     material while the rendered page sits on the site canvas. -->
		<div class="home-demo-code" data-theme="dark">
			<div class="home-demo-code-bar">
				<span class="home-demo-filename">index.html — no classes</span>
			</div>
			<pre aria-hidden="true"><code>{{ typed }}<span v-if="animated" class="home-demo-cursor"></span></code></pre>
			<!-- Full source for assistive tech and no-JS, independent of the
			     visual typing state above. -->
			<pre class="visually-hidden"><code>{{ fullSource }}</code></pre>
		</div>
		<!-- The rendered result is "the sheet": the inner <article> is a real
		     Cirth card, overlapping the stone panel. -->
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="home-demo-preview" v-html="preview" />
	</div>
</template>
