import type { ComponentChildren } from "preact";

// The only interactive bit is the click handler — which icon is visible is
// driven entirely by CSS ([data-theme="dark"] .docs-theme-icon-*, see
// styles/style.css), so both icons are passed in as static, build-time
// markup (see SiteHeader.astro) rather than rendered here. Keeps this
// island to the absolute minimum: no icon library in the client bundle.
export default function ThemeToggle({ children }: { children?: ComponentChildren }) {
	const toggle = () => {
		const next =
			document.documentElement.getAttribute("data-theme") === "dark"
				? "light"
				: "dark";
		document.documentElement.setAttribute("data-theme", next);
		localStorage.setItem("cirth-theme", next);
	};

	return (
		<button
			type="button"
			class="outline contrast docs-theme-toggle"
			aria-label="Toggle color scheme"
			onClick={toggle}
		>
			{children}
		</button>
	);
}
