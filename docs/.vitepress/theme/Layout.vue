<script setup lang="ts">
import { Content, useData, useRoute, withBase } from "vitepress";
import { computed, onMounted } from "vue";
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
						<img class="docs-logo docs-logo-light" src="/logo.svg" alt="" width="28" height="28">
						<img class="docs-logo docs-logo-dark" src="/logo-dark.svg" alt="" width="28" height="28">
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

	<main class="container">
		<template v-if="page.isNotFound">
			<section class="docs-hero">
				<hgroup>
					<h1>404</h1>
					<p>Page not found.</p>
				</hgroup>
				<p><a :href="withBase('/')" role="button" class="secondary">Back to home</a></p>
			</section>
		</template>

		<template v-else-if="isHome">
			<section class="docs-hero">
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
			</section>
			<section class="docs-features">
				<article v-for="feature in frontmatter.features" :key="feature.title">
					<h3>{{ feature.title }}</h3>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<p v-html="feature.details" />
				</article>
			</section>
		</template>

		<template v-else>
			<div class="docs-layout">
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

	<footer class="container docs-footer">
		<hr>
		<small>
			<!-- eslint-disable-next-line vue/no-v-html -->
			<span v-if="theme.footer?.message" v-html="theme.footer.message" />
			<!-- eslint-disable-next-line vue/no-v-html -->
			<span v-if="theme.footer?.copyright" v-html="theme.footer.copyright" />
		</small>
	</footer>
</template>
