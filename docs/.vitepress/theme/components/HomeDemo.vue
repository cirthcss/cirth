<script setup lang="ts">
// Homepage signature: plain semantic HTML is typed on the left and the
// rendered result materializes on the right, one element at a time.
// The full final state is server-rendered, so no-JS visitors, search
// engines, and screen readers always get the complete content; the
// animation is a purely visual layer applied after mount, and skipped
// entirely under prefers-reduced-motion.
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

const typed = ref(fullSource);
const preview = ref(finalSnapshot);
const playing = ref(false);
let timers: ReturnType<typeof setTimeout>[] = [];

const clearTimers = () => {
	for (const timer of timers) clearTimeout(timer);
	timers = [];
};

const play = () => {
	clearTimers();
	playing.value = true;
	typed.value = "";
	preview.value = "";
	let charDelay = 0;
	for (const [index, segment] of segments.entries()) {
		for (const char of segment.src) {
			charDelay += char === "\n" ? 60 : 18;
			timers.push(
				setTimeout(() => {
					typed.value += char;
				}, charDelay),
			);
		}
		charDelay += 240;
		timers.push(
			setTimeout(() => {
				preview.value = segment.snapshot;
				if (index === segments.length - 1) playing.value = false;
			}, charDelay),
		);
	}
};

onMounted(() => {
	const reduceMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	if (!reduceMotion) {
		timers.push(setTimeout(play, 600));
	}
});

onBeforeUnmount(clearTimers);
</script>

<template>
	<div class="home-demo" aria-label="Live example: semantic HTML rendered by Cirth">
		<div class="home-demo-code">
			<div class="home-demo-code-bar">
				<span class="home-demo-filename">index.html — no classes</span>
				<button
					type="button"
					class="outline secondary home-demo-replay"
					:disabled="playing"
					@click="play"
				>
					Replay
				</button>
			</div>
			<pre aria-hidden="true"><code>{{ typed }}<span v-if="playing" class="home-demo-cursor"></span></code></pre>
			<!-- Full source for assistive tech and no-JS, independent of the
			     visual typing state above. -->
			<pre class="visually-hidden"><code>{{ fullSource }}</code></pre>
		</div>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="home-demo-preview" v-html="preview" />
	</div>
</template>
