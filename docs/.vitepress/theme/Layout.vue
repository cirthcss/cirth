<script setup lang="ts">
import { PhMoon, PhSun } from "@phosphor-icons/vue";
import { Content, useData, useRoute, withBase } from "vitepress";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import HomeDemo from "./components/HomeDemo.vue";
import { useCirthTheme } from "./composables/theme";

const { site, theme, page, frontmatter } = useData();
const route = useRoute();
const { toggle, init } = useCirthTheme();

onMounted(() => {
	init();

	// Copy-to-clipboard for the code blocks VitePress's markdown renderer
	// emits (the button element ships with the markup; the default theme's
	// handler doesn't, since we replace that theme entirely).
	document.addEventListener("click", (event) => {
		const button = (event.target as HTMLElement).closest?.("button.copy");
		if (!button) return;
		const pre = button.parentElement?.querySelector("pre");
		if (!pre?.textContent) return;
		navigator.clipboard.writeText(pre.textContent).then(() => {
			button.classList.add("copied");
			setTimeout(() => button.classList.remove("copied"), 2000);
		});
	});
});

const nav = computed(() => theme.value.nav ?? []);
const sidebar = computed(() => theme.value.sidebar?.["/"] ?? []);
const github = computed(
	() =>
		(theme.value.socialLinks ?? []).find(
			(social: { icon: string }) => social.icon === "github",
		)?.link,
);
const isHome = computed(() => frontmatter.value.layout === "home");
const footerLinks = computed(() => theme.value.footerLinks ?? []);

const normalize = (link: string) => withBase(link).replace(/\.html$/, "");
const isActive = (link?: string) => !!link && normalize(link) === route.path;

// Only the sidebar group containing the current page starts open
const groupHasActive = (group: { items?: { link?: string }[] }) =>
	(group.items ?? []).some((item) => isActive(item.link));

// Per-page outline ("On this page"). Headers come from the markdown
// pipeline (config.mts enables level 2–3 extraction), so the list is
// server-rendered; only the scroll-spy highlight is client-side. The
// plugin nests h3s under their h2 as `children` — flatten for rendering.
interface PageHeader {
	level: number;
	title: string;
	slug: string;
	children?: PageHeader[];
}

const flattenHeaders = (headers: PageHeader[]): PageHeader[] =>
	headers.flatMap((header) => [
		header,
		...flattenHeaders(header.children ?? []),
	]);

const pageHeaders = computed(() =>
	flattenHeaders(page.value.headers ?? []).filter(
		(header) => header.level === 2 || header.level === 3,
	),
);
const activeSlug = ref("");

const updateActiveSlug = () => {
	const headings = Array.from(
		document.querySelectorAll<HTMLElement>(".docs-content :is(h2, h3)[id]"),
	);
	let current = "";
	for (const heading of headings) {
		// 96px offset: the heading counts as "reached" slightly before it
		// touches the top edge, matching where the eye lands after a jump.
		if (heading.getBoundingClientRect().top <= 96) current = heading.id;
		else break;
	}
	activeSlug.value = current || (headings[0]?.id ?? "");
};

onMounted(() => {
	window.addEventListener("scroll", updateActiveSlug, { passive: true });
	updateActiveSlug();
});

watch(
	() => route.path,
	async () => {
		await nextTick();
		updateActiveSlug();
	},
);

const flatPages = computed(() =>
	sidebar.value
		.flatMap((group: { items?: { link?: string }[] }) => group.items ?? [])
		.filter((item: { link?: string }) => item.link),
);
const pageIndex = computed(() =>
	flatPages.value.findIndex((item: { link: string }) => isActive(item.link)),
);
const prevPage = computed(() =>
	pageIndex.value > 0 ? flatPages.value[pageIndex.value - 1] : null,
);
const nextPage = computed(() =>
	pageIndex.value > -1 && pageIndex.value < flatPages.value.length - 1
		? flatPages.value[pageIndex.value + 1]
		: null,
);
</script>

<template>
	<header class="container docs-header">
		<nav aria-label="main navigation">
			<ul>
				<li>
					<a :href="withBase('/')" class="contrast docs-brand">
						<img class="docs-logo docs-logo-light" :src="withBase('/logo_brand.svg')" alt="" width="28" height="28">
						<img class="docs-logo docs-logo-dark" :src="withBase('/logo_brand_dark.svg')" alt="" width="28" height="28">
						<strong>{{ site.title }}</strong>
					</a>
				</li>
			</ul>
			<ul>
				<li v-for="item in nav" :key="item.text" class="docs-nav-item">
					<a v-if="item.link" :href="normalize(item.link)" :aria-current="isActive(item.link) ? 'page' : undefined">
						{{ item.text }}
					</a>
					<details v-else-if="item.items" class="dropdown">
						<summary>{{ item.text }}</summary>
						<ul dir="rtl">
							<li v-for="sub in item.items" :key="sub.text" dir="ltr">
								<a :href="sub.link.startsWith('http') ? sub.link : normalize(sub.link)">{{ sub.text }}</a>
							</li>
						</ul>
					</details>
				</li>
				<li v-if="github" class="docs-nav-item">
					<a :href="github" target="_blank" rel="noreferrer">GitHub</a>
				</li>
				<li>
					<button type="button" class="outline contrast docs-theme-toggle" aria-label="Toggle color scheme" @click="toggle">
						<PhSun class="docs-theme-icon-sun" :size="18" aria-hidden="true" />
						<PhMoon class="docs-theme-icon-moon" :size="18" aria-hidden="true" />
					</button>
				</li>
			</ul>
		</nav>
	</header>

	<main :class="{ 'docs-home': isHome }">
		<template v-if="page.isNotFound">
			<section class="container docs-hero">
				<hgroup>
					<h1>404</h1>
					<p>Page not found.</p>
				</hgroup>
				<p><a :href="withBase('/')" role="button" class="secondary">Back to home</a></p>
			</section>
		</template>

		<template v-else-if="isHome">
			<section class="docs-hero-panel">
				<div class="container docs-hero">
					<div class="docs-hero-copy">
						<p v-if="frontmatter.hero.eyebrow" class="docs-hero-eyebrow">{{ frontmatter.hero.eyebrow }}</p>
						<hgroup>
							<h1 class="docs-hero-title">
								<img class="docs-hero-mark docs-logo-light" :src="withBase('/logo_brand.svg')" alt="" width="52" height="52">
								<img class="docs-hero-mark docs-logo-dark" :src="withBase('/logo_brand_dark.svg')" alt="" width="52" height="52">
								<span>{{ frontmatter.hero.name }}</span>
							</h1>
							<p>{{ frontmatter.hero.text }}</p>
						</hgroup>
						<p class="docs-hero-tagline">{{ frontmatter.hero.tagline }}</p>
						<p class="docs-hero-actions">
							<a
								v-for="action in frontmatter.hero.actions"
								:key="action.text"
								:href="action.link.startsWith('http') ? action.link : normalize(action.link)"
								role="button"
								:class="action.theme === 'brand' ? undefined : 'outline secondary'"
							>
								{{ action.text }}
							</a>
						</p>
					</div>
					<HomeDemo class="docs-hero-demo" />
				</div>
			</section>
			<div class="container">
				<section v-if="frontmatter.stats" class="docs-stats">
					<div v-for="stat in frontmatter.stats" :key="stat.label" class="docs-stat">
						<strong class="docs-stat-value">{{ stat.value }}</strong>
						<span class="docs-stat-label">{{ stat.label }}</span>
					</div>
				</section>

				<section v-if="frontmatter.comparison" class="docs-compare">
					<header class="docs-section-header">
						<p class="docs-eyebrow">{{ frontmatter.comparison.eyebrow }}</p>
						<h2>{{ frontmatter.comparison.title }}</h2>
						<p class="docs-section-lede">{{ frontmatter.comparison.lede }}</p>
					</header>
					<div class="docs-compare-grid">
						<article
							v-for="side in frontmatter.comparison.sides"
							:key="side.label"
							class="docs-compare-side"
						>
							<header>
								<span>{{ side.label }}</span>
								<span class="docs-compare-count">{{ side.count }}</span>
							</header>
							<pre><code v-text="side.code" /></pre>
						</article>
					</div>
					<p class="docs-compare-note">{{ frontmatter.comparison.note }}</p>
				</section>

				<section class="docs-features">
					<header class="docs-section-header">
						<p class="docs-eyebrow">{{ frontmatter.featuresEyebrow }}</p>
						<h2>{{ frontmatter.featuresTitle }}</h2>
					</header>
					<dl class="docs-features-list">
						<div v-for="feature in frontmatter.features" :key="feature.title" class="docs-feature">
							<dt>{{ feature.title }}</dt>
							<!-- eslint-disable-next-line vue/no-v-html -->
							<dd v-html="feature.details" />
						</div>
					</dl>
				</section>
			</div>

			<section v-if="frontmatter.closing" class="docs-closing">
				<div class="container">
					<img
						class="docs-closing-mark docs-logo-light"
						:src="withBase('/logo_mono.svg')"
						alt=""
						width="40"
						height="40"
					>
					<img
						class="docs-closing-mark docs-logo-dark"
						:src="withBase('/logo_mono_dark.svg')"
						alt=""
						width="40"
						height="40"
					>
					<p class="docs-closing-text">{{ frontmatter.closing.text }}</p>
					<p class="docs-hero-actions">
						<a
							v-for="action in frontmatter.closing.actions"
							:key="action.text"
							:href="normalize(action.link)"
							role="button"
							class="outline secondary"
						>
							{{ action.text }}
						</a>
					</p>
				</div>
			</section>
		</template>

		<template v-else>
			<div class="container docs-layout">
				<aside class="docs-sidebar">
					<nav aria-label="docs navigation">
						<details v-for="group in sidebar" :key="group.text" :open="groupHasActive(group)">
							<summary>{{ group.text }}</summary>
							<ul>
								<li v-for="item in group.items" :key="item.link">
									<a :href="normalize(item.link)" :aria-current="isActive(item.link) ? 'page' : undefined">
										{{ item.text }}
									</a>
								</li>
							</ul>
						</details>
					</nav>
				</aside>
				<div class="docs-content">
					<nav v-if="pageHeaders.length > 1" class="docs-toc-top" aria-label="On this page">
						<strong>On this page</strong>
						<ul>
							<li v-for="header in pageHeaders" :key="header.slug" :class="`docs-toc-level-${header.level}`">
								<a :href="`#${header.slug}`">{{ header.title }}</a>
							</li>
						</ul>
					</nav>
					<Content />
					<footer v-if="prevPage || nextPage" class="docs-prev-next">
						<a v-if="prevPage" :href="normalize(prevPage.link)" class="secondary">← {{ prevPage.text }}</a>
						<span v-else />
						<a v-if="nextPage" :href="normalize(nextPage.link)" class="secondary">{{ nextPage.text }} →</a>
					</footer>
				</div>
				<aside v-if="pageHeaders.length > 1" class="docs-toc">
					<nav aria-label="On this page">
						<strong>On this page</strong>
						<ul>
							<li v-for="header in pageHeaders" :key="header.slug" :class="`docs-toc-level-${header.level}`">
								<a
									:href="`#${header.slug}`"
									:class="{ 'docs-toc-active': activeSlug === header.slug }"
									:aria-current="activeSlug === header.slug ? 'true' : undefined"
								>
									{{ header.title }}
								</a>
							</li>
						</ul>
					</nav>
				</aside>
			</div>
		</template>
	</main>

	<footer class="docs-footer">
		<div class="container">
			<div class="docs-footer-top">
				<div class="docs-footer-brand-block">
					<a :href="withBase('/')" class="docs-brand docs-footer-brand">
						<img class="docs-logo docs-logo-light" :src="withBase('/logo_brand.svg')" alt="" width="28" height="28">
						<img class="docs-logo docs-logo-dark" :src="withBase('/logo_brand_dark.svg')" alt="" width="28" height="28">
						<strong>{{ site.title }}</strong>
					</a>
					<p class="docs-footer-credit">
						Designed and built by Riccardo Pastori, with help from the
						<a href="https://github.com/cirthcss/cirth/graphs/contributors" target="_blank" rel="noreferrer">contributors</a>.
					</p>
					<ul class="docs-footer-social">
						<li><a href="https://github.com/cirthcss/cirth" target="_blank" rel="noreferrer">GitHub</a></li>
						<li><a href="https://www.npmjs.com/package/@cirthcss/cirth" target="_blank" rel="noreferrer">npm</a></li>
						<li><a href="https://github.com/cirthcss/cirth/blob/master/CHANGELOG.md" target="_blank" rel="noreferrer">Changelog</a></li>
					</ul>
				</div>
				<div class="docs-footer-columns">
					<div v-for="group in footerLinks" :key="group.title" class="docs-footer-column">
						<strong>{{ group.title }}</strong>
						<ul>
							<li v-for="item in group.items" :key="item.text">
								<a
									:href="item.link.startsWith('http') ? item.link : normalize(item.link)"
									:target="item.link.startsWith('http') ? '_blank' : undefined"
									:rel="item.link.startsWith('http') ? 'noreferrer' : undefined"
								>
									{{ item.text }}
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<hr>
			<small>
				<!-- eslint-disable-next-line vue/no-v-html -->
				<span v-if="theme.footer?.message" v-html="theme.footer.message" />
				<!-- eslint-disable-next-line vue/no-v-html -->
				<span v-if="theme.footer?.copyright" v-html="theme.footer.copyright" />
			</small>
		</div>
	</footer>
</template>
