const themeToggle = document.querySelector(".theme-toggle");
const storedTheme = localStorage.getItem("portfolio-theme");

function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute(
    "aria-label",
    isDark ? "Enable light mode" : "Enable dark mode",
  );
}

setTheme(storedTheme || (document.body.classList.contains("page-portfolio") ? "dark" : "light"));

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.classList.add("theme-animate");
  localStorage.setItem("portfolio-theme", nextTheme);
  setTheme(nextTheme);
});

if (document.body.classList.contains("page-portfolio")) {
  const updateHeader = () => document.body.classList.toggle("header-visible", scrollY > 32);
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("pageshow", updateHeader);
  updateHeader();
}
