/* ============================================================
 * main.js — 主逻辑入口
 * - 文章列表渲染
 * - Markdown 懒加载（点击标题后再 fetch）
 * - 视图切换（列表 / 文章 / 关于 / 联系）
 * - 音乐播放器（点击播放，默认暂停）
 * - 移动端汉堡菜单
 * - 主题 & 语言按钮绑定
 * ============================================================ */

(function () {
  "use strict";

  /* ---------- 状态 ---------- */
  let articles = [];
  let tweets = [];
  const articleCache = new Map(); // file -> rendered html

  /* ---------- DOM 引用 ---------- */
  const $ = (id) => document.getElementById(id);

  /* ---------- 工具函数 ---------- */

  /** 格式化日期：根据语言返回不同格式 */
  function fmtDate(iso, lang) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    if (lang === "en") {
      return d.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });
    }
    return d.toLocaleDateString("zh-CN", {
      year: "numeric", month: "long", day: "numeric"
    });
  }

  /** 简易 HTML 转义，用于插入来自 JSON 的文本字段 */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** 相对时间（用于碎碎念） */
  function relTime(iso, lang) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return lang === "en" ? "just now" : "刚刚";
    if (min < 60) return lang === "en" ? `${min}m ago` : `${min} 分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return lang === "en" ? `${hr}h ago` : `${hr} 小时前`;
    const day = Math.floor(hr / 24);
    if (day < 30) return lang === "en" ? `${day}d ago` : `${day} 天前`;
    return fmtDate(iso, lang);
  }

  /* ---------- 渲染：文章列表 ---------- */
  function renderPostList(list) {
    const wrap = $("postList");
    if (!list.length) {
      wrap.innerHTML = `<div class="empty">${esc(t("status.empty"))}</div>`;
      return;
    }
    const lang = getLang();
    wrap.innerHTML = list
      .map(
        (a) => `
        <article class="post-card" data-file="${esc(a.file)}">
          <h2 class="post-card-title">${esc(a.title[lang] || a.title.zh)}</h2>
          <p class="post-card-summary">${esc(a.summary[lang] || a.summary.zh)}</p>
          <div class="post-card-meta">
            <span class="post-card-tag">${esc(a.tag[lang] || a.tag.zh || "")}</span>
            <time>${fmtDate(a.date, lang)}</time>
          </div>
        </article>`
      )
      .join("");

    // 绑定点击 → 进入文章详情
    wrap.querySelectorAll(".post-card").forEach((card) => {
      card.addEventListener("click", () => openArticle(card.dataset.file));
    });
  }

  /* ---------- 渲染：碎碎念 ---------- */
  function renderTweets(list) {
    const wrap = $("tweetList");
    if (!list.length) {
      wrap.innerHTML = `<li class="empty">${esc(t("status.empty"))}</li>`;
      return;
    }
    const lang = getLang();
    const latest = list.slice(0, 3); // 最新 3 条
    wrap.innerHTML = latest
      .map(
        (tw) => `
        <li class="tweet-item">
          <p class="tweet-text">${esc(tw.text[lang] || tw.text.zh)}</p>
          <span class="tweet-time">${relTime(tw.time, lang)}</span>
        </li>`
      )
      .join("");
  }

  /* ---------- 加载：文章详情（懒加载） ---------- */
  async function openArticle(file) {
    const wrap = $("articleWrap");
    const view = $("articleView");

    // 切换视图
    showView("article");
    wrap.innerHTML = `<div class="loading">${esc(t("article.loading"))}</div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      let html;
      if (articleCache.has(file)) {
        html = articleCache.get(file);
      } else {
        const res = await fetch(`posts/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();

        // 使用 marked 解析 markdown
        if (window.marked) {
          marked.setOptions({ breaks: true, gfm: true });
          html = marked.parse(md);
        } else {
          // marked 还没加载完：最简 fallback，用 pre 包裹
          html = `<pre><code>${esc(md)}</code></pre>`;
        }
        articleCache.set(file, html);
      }

      const meta = articles.find((a) => a.file === file);
      const lang = getLang();
      const title = meta ? esc(meta.title[lang] || meta.title.zh) : "";
      const date = meta ? fmtDate(meta.date, lang) : "";

      wrap.innerHTML = `
        <header class="article-head">
          <h1 class="article-title">${title}</h1>
          <time class="article-date">${date}</time>
        </header>
        <div class="article-body">${html}</div>`;

      // 代码高亮
      if (window.hljs) {
        wrap.querySelectorAll("pre code").forEach((b) => {
          try { window.hljs.highlightElement(b); } catch (e) { /* 忽略 */ }
        });
      }
    } catch (err) {
      wrap.innerHTML = `<div class="empty">${esc(t("article.notFound"))}</div>`;
      console.error("[openArticle] failed:", err);
    }
  }

  /* ---------- 视图切换 ---------- */
  function showView(name) {
    const views = {
      list: "listView",
      article: "articleView",
      about: "aboutView",
      contact: "contactView"
    };
    Object.entries(views).forEach(([k, id]) => {
      const el = $(id);
      if (k === name) el.hidden = false;
      else el.hidden = true;
    });
    // 关闭移动端菜单
    closeMobileMenu();
  }

  /* ---------- 音乐播放器 ---------- */
  function initMusicPlayer() {
    const audio = $("bgAudio");
    const btn = $("musicPlayBtn");
    if (!audio || !btn) return;

    audio.volume = 0.7;

    btn.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
          btn.classList.add("playing");
        } else {
          audio.pause();
          btn.classList.remove("playing");
        }
      } catch (err) {
        console.error("[music] play failed:", err);
      }
    });

    // 播放结束（loop 时一般不会触发，但保险起见）
    audio.addEventListener("ended", () => btn.classList.remove("playing"));
  }

  /* ---------- 移动端菜单 ---------- */
  function toggleMobileMenu() {
    const menu = $("navMenu");
    const btn = $("hamburger");
    const open = menu.classList.toggle("open");
    btn.classList.toggle("active", open);
    btn.setAttribute("aria-expanded", String(open));
  }
  function closeMobileMenu() {
    const menu = $("navMenu");
    const btn = $("hamburger");
    if (menu.classList.contains("open")) {
      menu.classList.remove("open");
      btn.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
    }
  }

  /* ---------- 数据加载 ---------- */
  async function loadArticles() {
    try {
      const res = await fetch("data/articles.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      articles = await res.json();
      renderPostList(articles);
    } catch (err) {
      console.error("[loadArticles] failed:", err);
      $("postList").innerHTML =
        `<div class="empty">${esc(t("status.empty"))}</div>`;
    }
  }

  async function loadTweets() {
    try {
      const res = await fetch("data/tweets.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      tweets = await res.json();
      renderTweets(tweets);
    } catch (err) {
      console.error("[loadTweets] failed:", err);
      $("tweetList").innerHTML =
        `<li class="empty">${esc(t("status.empty"))}</li>`;
    }
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    // 主题切换
    $("themeToggle").addEventListener("click", toggleTheme);

    // 语言切换
    $("langToggle").addEventListener("click", toggleLang);

    // 汉堡菜单
    $("hamburger").addEventListener("click", toggleMobileMenu);

    // 导航 action（统一委托）
    document.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const act = el.dataset.action;
        switch (act) {
          case "home":
            showView("list");
            window.scrollTo({ top: 0, behavior: "smooth" });
            break;
          case "articles":
            // 若已在首页，平滑滚动到文章区；否则先切回首页再滚动
            showView("list");
            setTimeout(() => {
              const posts = $("postsSection");
              if (posts) {
                const top = posts.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }, 60);
            break;
          case "about":
            showView("about");
            window.scrollTo({ top: 0, behavior: "smooth" });
            break;
          case "contact":
            showView("contact");
            window.scrollTo({ top: 0, behavior: "smooth" });
            break;
        }
      });
    });

    // 侧栏联系按钮 → 联系页
    $("contactBtn").addEventListener("click", () => {
      showView("contact");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 返回列表
    $("backBtn").addEventListener("click", () => {
      showView("list");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // ESC 关闭移动菜单
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileMenu();
    });

    // 语言切换后重渲染动态内容
    document.addEventListener("langchange", () => {
      renderPostList(articles);
      renderTweets(tweets);
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    // 应用初始主题（在 head 已设默认 light，这里覆盖为真实偏好）
    applyTheme(getInitialTheme());
    // 应用初始语言
    applyLang(currentLang);
    // 绑定事件
    bindEvents();
    // 初始化音乐播放器（默认暂停）
    initMusicPlayer();
    // 加载数据
    loadArticles();
    loadTweets();
  }

  // DOM 就绪后启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
