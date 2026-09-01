// The four semantic-HTML snippets the home page's source → output demo
// switches between, in one place.
//
// They used to live twice: once in the Nunjucks template (rendered as the
// initial, escaped-but-unhighlighted contents of the <pre>) and once again
// as a JavaScript object literal in the same file, which the build switcher
// assigned with `source.textContent = …`. Two consequences, both visible:
// the two copies could drift, and every path — the server-rendered one
// included — produced plain text, so the panel this project puts at the top
// of its own home page was the only code block on the site with no syntax
// highlighting at all (0 highlight spans against 203 in a docs page's
// prose). `textContent` would have erased the markup even if the template
// had emitted it.
//
// Stated once here, highlighted at build time by the same highlight.js pass
// the markdown pipeline uses (docs/eleventy.config.js), and swapped in as
// pre-rendered HTML. No new dependency, no client-side highlighter, and the
// build switcher keeps working.
const form = (indent) => {
	const pad = " ".repeat(indent);
	return `${pad}<h2>Sign in</h2>
${pad}<!-- Components: form controls -->
${pad}<form>
${pad}  <label>
${pad}    Email
${pad}    <input type="email" name="email" autocomplete="email">
${pad}  </label>
${pad}  <label>
${pad}    Password
${pad}    <input type="password" name="password" autocomplete="current-password">
${pad}  </label>
${pad}  <label><input type="checkbox" checked> Remember this device</label>
${pad}  <button type="button">Sign in</button>
${pad}</form>`;
};

module.exports = {
	default: `<!-- Layout: container -->
<main class="container">
  <!-- Component: card -->
  <article>
${form(4)}
  </article>
</main>`,
	classless: `<!-- Layout: document flow -->
<main>
  <!-- Component: card -->
  <article>
${form(4)}
  </article>
</main>`,
	scoped: `<!-- Scope: .cirth -->
<div class="cirth">
  <!-- Layout: container -->
  <main class="container">
    <!-- Component: card -->
    <article>
${form(6)}
    </article>
  </main>
</div>`,
	"scoped-classless": `<!-- Scope: .cirth -->
<div class="cirth">
  <!-- Layout: document flow -->
  <main>
    <!-- Component: card -->
    <article>
${form(6)}
    </article>
  </main>
</div>`,
};
