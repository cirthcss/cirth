import { ref } from "vue";

// Light/dark is driven by Cirth's own mechanism: a data-theme attribute on
// the root element. An inline script in <head> (see config.mts) sets it
// before first paint; this composable keeps a reactive mirror of it and
// persists the user's explicit choice.
const isDark = ref(false);

export function useCirthTheme() {
	const init = () => {
		isDark.value =
			document.documentElement.getAttribute("data-theme") === "dark";
	};

	const toggle = () => {
		isDark.value = !isDark.value;
		const theme = isDark.value ? "dark" : "light";
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("cirth-theme", theme);
	};

	return { isDark, init, toggle };
}
