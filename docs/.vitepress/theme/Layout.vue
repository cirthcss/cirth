<script setup lang="ts">
import { Content, useData, useRoute, withBase } from "vitepress";
import { computed, onMounted } from "vue";
import { useCirthTheme } from "./composables/theme";

// Minimal stroke icons for the homepage feature grid. Inlined rather than
// imported so the docs site stays a plain static build with no icon
// package dependency; each one is deliberately tiny (feather-icon style).
const featureIcons: Record<string, string> = {
	code: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
	sliders:
		'<line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>',
	layers:
		'<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>',
	moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
	package:
		'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
	shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
};

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
						<img class="docs-logo docs-logo-light" :src="withBase('/logo_mono.svg')" alt="" width="28" height="28">
						<img class="docs-logo docs-logo-dark" :src="withBase('/logo_mono_dark.svg')" alt="" width="28" height="28">
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
						<span class="docs-theme-icon" aria-hidden="true"></span>
					</button>
				</li>
			</ul>
		</nav>
	</header>

	<main>
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
			<section class="docs-hero-panel" data-theme="dark">
				<div class="container docs-hero">
					<p v-if="frontmatter.hero.eyebrow" class="docs-hero-eyebrow">{{ frontmatter.hero.eyebrow }}</p>
					<hgroup>
						<h1>{{ frontmatter.hero.name }}</h1>
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
			</section>
			<div class="container">
				<section v-if="frontmatter.stats" class="docs-stats">
					<div v-for="stat in frontmatter.stats" :key="stat.label" class="docs-stat">
						<strong class="docs-stat-value">{{ stat.value }}</strong>
						<span class="docs-stat-label">{{ stat.label }}</span>
					</div>
				</section>
				<section class="docs-features">
					<article v-for="feature in frontmatter.features" :key="feature.title">
						<!-- eslint-disable-next-line vue/no-v-html -->
						<span v-if="feature.icon" class="docs-feature-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="featureIcons[feature.icon]"></svg>
						</span>
						<h3>{{ feature.title }}</h3>
						<!-- eslint-disable-next-line vue/no-v-html -->
						<p v-html="feature.details" />
					</article>
				</section>
			</div>
		</template>

		<template v-else>
			<div class="container docs-layout">
				<aside class="docs-sidebar">
					<nav aria-label="docs navigation">
						<details v-for="group in sidebar" :key="group.text" :open="!group.collapsed">
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
					<Content />
					<footer v-if="prevPage || nextPage" class="docs-prev-next">
						<a v-if="prevPage" :href="normalize(prevPage.link)" class="secondary">← {{ prevPage.text }}</a>
						<span v-else />
						<a v-if="nextPage" :href="normalize(nextPage.link)" class="secondary">{{ nextPage.text }} →</a>
					</footer>
				</div>
			</div>
		</template>
	</main>

	<footer class="docs-footer" data-theme="dark">
		<div class="container">
			<div class="docs-footer-top">
				<a :href="withBase('/')" class="docs-brand docs-footer-brand">
					<img class="docs-logo" :src="withBase('/logo_mono_dark.svg')" alt="" width="24" height="24">
					<strong>{{ site.title }}</strong>
				</a>
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
