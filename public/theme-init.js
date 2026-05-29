/** Theme initialization script - runs before React hydration to prevent flash */
(function () {
  try {
    var raw = localStorage.getItem("coach-theme");
    var theme = null;
    if (raw) {
      var parsed = JSON.parse(raw);
      theme = parsed && parsed.state && parsed.state.theme;
    }
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    var root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  } catch (e) {}
})();
