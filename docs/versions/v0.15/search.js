const trigger = document.querySelector("[data-docs-search-trigger]");
const dialog = document.querySelector("[data-docs-search-dialog]");
const input = document.querySelector("[data-docs-search-input]");
const closeButton = document.querySelector("[data-docs-search-close]");
const status = document.querySelector("[data-docs-search-status]");
const results = document.querySelector("[data-docs-search-results]");

if (
  trigger instanceof HTMLButtonElement &&
  dialog instanceof HTMLDialogElement &&
  input instanceof HTMLInputElement &&
  closeButton instanceof HTMLButtonElement &&
  status instanceof HTMLElement &&
  results instanceof HTMLOListElement &&
  typeof dialog.showModal === "function"
) {
  const modifier = document.querySelector("[data-docs-search-modifier]");
  const applePlatform = /Mac|iPhone|iPad/.test(navigator.platform);
  if (modifier) modifier.textContent = applePlatform ? "⌘" : "Ctrl";

  const baseUrl = (document.documentElement.dataset.base || "/").replace(
    /\/?$/,
    "/",
  );
  let pagefindPromise;
  let currentQuery = "";

  const loadPagefind = () => {
    pagefindPromise ??= import(`${baseUrl}pagefind/pagefind.js`).then(
      async (pagefind) => {
        await pagefind.options({ baseUrl, excerptLength: 18 });
        await pagefind.init();
        return pagefind;
      },
    );
    return pagefindPromise;
  };

  const resultLinks = () =>
    Array.from(results.querySelectorAll("[data-docs-search-result]"));

  const openSearch = () => {
    if (!dialog.open) dialog.showModal();
    trigger.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => input.focus());
    void loadPagefind().catch(() => {
      status.textContent = "Search is temporarily unavailable.";
    });
  };

  const closeSearch = () => {
    if (dialog.open) dialog.close();
  };

  const renderResults = (items, total) => {
    results.replaceChildren();
    status.textContent = total
      ? `${total} result${total === 1 ? "" : "s"}. Showing the first ${items.length}.`
      : "No matching documentation found.";

    for (const item of items) {
      const row = document.createElement("li");
      const link = document.createElement("a");
      const title = document.createElement("strong");
      const excerpt = document.createElement("span");
      const path = document.createElement("small");

      link.href = item.url;
      link.dataset.docsSearchResult = "";
      title.textContent = item.meta?.title || "Cirth documentation";
      excerpt.innerHTML = item.excerpt || "";
      path.textContent = new URL(item.url, window.location.origin).pathname;
      link.append(title, excerpt, path);
      row.append(link);
      results.append(row);
    }
  };

  const search = async () => {
    const query = input.value.trim();
    currentQuery = query;
    if (query.length < 2) {
      results.replaceChildren();
      status.textContent = "Type at least two characters to search.";
      return;
    }

    status.textContent = "Searching documentation…";
    try {
      const pagefind = await loadPagefind();
      const response = await pagefind.debouncedSearch(query, {}, 180);
      if (!response || currentQuery !== query) return;
      const items = await Promise.all(
        response.results.slice(0, 8).map((result) => result.data()),
      );
      if (currentQuery === query) renderResults(items, response.results.length);
    } catch {
      results.replaceChildren();
      status.textContent = "Search is temporarily unavailable.";
    }
  };

  trigger.hidden = false;
  trigger.addEventListener("click", openSearch);
  closeButton.addEventListener("click", closeSearch);
  input.addEventListener("input", () => void search());

  dialog.addEventListener("close", () => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeSearch();
  });
  dialog.addEventListener("keydown", (event) => {
    const links = resultLinks();
    const index = links.indexOf(document.activeElement);
    if (event.target === input && event.key === "Enter" && links[0]) {
      event.preventDefault();
      links[0].click();
      return;
    }
    if (event.target === input && event.key === "ArrowDown" && links[0]) {
      event.preventDefault();
      links[0].focus();
      return;
    }
    if (
      index < 0 ||
      !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? links.length - 1
          : event.key === "ArrowDown"
            ? (index + 1) % links.length
            : (index - 1 + links.length) % links.length;
    links[nextIndex]?.focus();
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const editing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);
    const command =
      (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
    const slash =
      event.key === "/" && !editing && !event.metaKey && !event.ctrlKey;
    if (!command && !slash) return;
    event.preventDefault();
    openSearch();
  });
}
