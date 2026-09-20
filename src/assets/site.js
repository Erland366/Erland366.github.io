const themeButton = document.querySelector(".theme-toggle");
if (themeButton) {
  const updateLabel = () =>
    themeButton.setAttribute(
      "aria-label",
      document.documentElement.dataset.theme === "dark"
        ? "Use light theme"
        : "Use dark theme",
    );
  themeButton.hidden = false;
  updateLabel();
  themeButton.addEventListener("click", () => {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("erland-theme", next);
    } catch {
      /* Switching still works for this page when storage is disabled. */
    }
    updateLabel();
  });
}
const filters = document.querySelector(".publication-filters");
if (filters) {
  filters.hidden = false;
  const papers = [...document.querySelectorAll("[data-publication]")];
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    filters
      .querySelectorAll("button")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    papers.forEach((paper) => {
      paper.hidden =
        button.dataset.filter !== "all" &&
        paper.dataset.kind !== button.dataset.filter;
    });
    document.querySelector("#filter-status").textContent =
      `Showing ${papers.filter((paper) => !paper.hidden).length} publications.`;
  });
}
