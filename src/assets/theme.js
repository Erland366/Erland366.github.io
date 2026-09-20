// Apply the saved preference before paint.
(() => {
  let preference;
  try {
    preference = localStorage.getItem("erland-theme");
  } catch {
    /* Storage can be disabled by browser privacy settings. */
  }
  // White is the default; visitors can explicitly choose the dark theme.
  const dark = preference === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
})();
