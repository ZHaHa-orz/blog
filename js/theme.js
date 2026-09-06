/* ============================================================
 * theme.js — 深浅色模式切换
 * - 点击按钮切换 <html data-theme>
 * - 偏好存入 localStorage
 * - 首次访问读取系统 prefers-color-scheme
 * ============================================================ */

const THEME_KEY = "blog-theme";

/** 读取用户偏好，回退到系统设置 */
function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // 检测系统深色模式
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/** 应用主题 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  // 同步切换 highlight.js 代码高亮样式表
  syncCodeTheme(theme);

  // 派发事件，方便其他模块联动
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

/** 切换深浅色 */
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(cur === "light" ? "dark" : "light");
}

/**
 * 同步 highlight.js 的样式表到当前主题。
 * 浅色 → atom-one-light，深色 → atom-one-dark。
 */
function syncCodeTheme(theme) {
  const id = "hljs-theme";
  let link = document.getElementById(id);
  const href =
    theme === "dark"
      ? "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release/build/styles/atom-one-dark.min.css"
      : "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release/build/styles/atom-one-light.min.css";
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = href;
}

// 暴露到全局
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.getInitialTheme = getInitialTheme;

// 监听系统主题变化（用户未手动设置过时跟随）
if (window.matchMedia) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? "dark" : "light");
    }
  };
  if (mql.addEventListener) mql.addEventListener("change", handler);
  else if (mql.addListener) mql.addListener(handler); // 旧版 Safari
}
