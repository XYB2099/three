/* ============ 主题切换（浅色 / 深色） ============ */
/* 自包含脚本，尽早执行以避免闪烁；在 <head> 中于样式表之前引入。 */
(function () {
  function get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function set(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* 忽略 */ }
  }

  var KEY = "xyb_theme";

  function detect() {
    var saved = get(KEY);
    if (saved === "dark" || saved === "light") return saved;
    return (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }

  function current() {
    return document.documentElement.getAttribute("data-theme") || detect();
  }

  function updateToggles(t) {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      var icon = btn.querySelector(".theme-toggle__icon");
      if (icon) icon.textContent = t === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", t === "dark" ? "切换到浅色模式" : "切换到深色模式");
    });
  }

  function apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    set(KEY, t);
    updateToggles(t);
  }

  apply(detect());

  function bind() {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(current() === "dark" ? "light" : "dark");
      });
    });
    updateToggles(current());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
