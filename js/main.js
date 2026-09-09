/* ============================================================
 * main.js — 主逻辑入口
 * - 首页：置顶文章 + 最新文章
 * - 文章分类页（按分类筛选）
 * - Markdown 懒加载（点击标题后再 fetch）
 * - 视图切换（首页 / 文章分类 / 文章详情 / 关于 / 联系）
 * - 音乐播放器（播放/暂停 + 进度条 + 音量 + 播放列表切换）
 * - 滚动渐显（IntersectionObserver）
 * - 移动端汉堡菜单
 * - 主题 & 语言按钮绑定
 * ============================================================ */

(function () {
  "use strict";

  /* ---------- 状态 ---------- */
  let articles = [];
  let tweets = [];
  let currentCategory = "all";
  let articleSourceView = "list"; // 进入文章详情前的来源视图：list(首页) | articles(分类页)
  const articleCache = new Map(); // file -> rendered html

  /**
   * 播放列表 —— 后期上传新音乐后，在此数组追加即可自动出现在列表中。
   * 每项格式：{ title: "曲名", artist: "歌手", src: "assets/xxx.mp3" }
   */
  const playlist = [
    { title: "森の小さなレストラン", artist: "手嶌葵", src: "assets/森の小さなレストラン.mp3" },
    { title: "Kiss The Rain", artist: "Yiruma", src: "assets/Kiss The Rain.mp3" },
    { title: "The Rain", artist: "久石让", src: "assets/The Rain.mp3" },
    { title: "風になる", artist: "つじあやの", src: "assets/風になる.mp3" },
    { title: "いつも何度でも", artist: "宗次郎", src: "assets/いつも何度でも.mp3" },
    { title: "午后柠檬树下的阳光", artist: "Depapepe", src: "assets/午后柠檬树下的阳光.mp3" },
    { title: "Subwoofer Lullaby", artist: "C418", src: "assets/Subwoofer Lullaby.mp3" },
    { title: "Minecraft", artist: "C418", src: "assets/Minecraft.mp3" },
    { title: "Zombies on Your Lawn", artist: "Laura Shigihara", src: "assets/Zombies on Your Lawn.mp3" },
    { title: "愛にできることはまだあるかい", artist: "RADWIMPS", src: "assets/愛にできることはまだあるかい.mp3" }
  ];
  let currentSongIndex = 0;

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

  /** 简易 HTML 转义 */
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

  /** 秒 → mm:ss */
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /** 生成单篇文章卡片 HTML */
  function articleCardHTML(a, lang) {
    return `
      <article class="post-card" data-file="${esc(a.file)}">
        <h2 class="post-card-title">${esc(a.title[lang] || a.title.zh)}</h2>
        <p class="post-card-summary">${esc(a.summary[lang] || a.summary.zh)}</p>
        <div class="post-card-meta">
          <span class="post-card-tag">${esc(a.tag[lang] || a.tag.zh || "")}</span>
          <time>${fmtDate(a.date, lang)}</time>
        </div>
      </article>`;
  }

  /** 为一组文章卡片绑定点击事件 */
  function bindCardClicks(container) {
    container.querySelectorAll(".post-card").forEach((card) => {
      card.addEventListener("click", () => openArticle(card.dataset.file));
    });
  }

  /* ---------- 渲染：首页文章（置顶 + 最新） ---------- */
  function renderHomeArticles() {
    const lang = getLang();
    // 按日期降序排序
    const sorted = [...articles].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const pinned = sorted.filter((a) => a.pinned);
    const latest = sorted.filter((a) => !a.pinned);

    const pinnedWrap = $("pinnedList");
    const pinnedSection = $("pinnedSection");
    const latestWrap = $("latestList");

    if (pinned.length) {
      pinnedSection.hidden = false;
      pinnedWrap.innerHTML = pinned.map((a) => articleCardHTML(a, lang)).join("");
      bindCardClicks(pinnedWrap);
    } else {
      pinnedSection.hidden = true;
    }

    if (latest.length) {
      latestWrap.innerHTML = latest.map((a) => articleCardHTML(a, lang)).join("");
    } else {
      latestWrap.innerHTML = `<div class="empty">${esc(t("status.empty"))}</div>`;
    }
    bindCardClicks(latestWrap);
  }

  /* ---------- 渲染：分类页文章列表 ---------- */
  function renderArticlesList() {
    const lang = getLang();
    const wrap = $("articlesList");
    const sorted = [...articles].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const filtered =
      currentCategory === "all"
        ? sorted
        : sorted.filter((a) => (a.category && a.category[lang]) === currentCategory);

    if (!filtered.length) {
      wrap.innerHTML = `<div class="empty">${esc(t("status.empty"))}</div>`;
      return;
    }
    wrap.innerHTML = filtered.map((a) => articleCardHTML(a, lang)).join("");
    bindCardClicks(wrap);
  }

  /* ---------- 渲染：分类标签 ---------- */
  function renderCategoryTabs() {
    const lang = getLang();
    const tabsWrap = $("categoryTabs");
    // 收集所有分类
    const cats = new Set();
    articles.forEach((a) => {
      if (a.category && a.category[lang]) cats.add(a.category[lang]);
    });

    // 保留 "全部" 按钮，移除旧的分类按钮（除了第一个 .all）
    tabsWrap.querySelectorAll(".cat-tab[data-cat]:not([data-cat='all'])")
      .forEach((n) => n.remove());

    cats.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "cat-tab";
      btn.dataset.cat = cat;
      btn.textContent = cat;
      tabsWrap.appendChild(btn);
    });

    // 绑定分类切换
    tabsWrap.querySelectorAll(".cat-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        tabsWrap.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentCategory = tab.dataset.cat;
        renderArticlesList();
      });
    });
  }

  /* ---------- 渲染：碎碎念 ---------- */
  // 碎碎念展开状态（展开后显示全部，收起只显示前3条）
  let tweetsExpanded = false;

  function renderTweets(list) {
    const wrap = $("tweetList");
    const moreBtn = $("tweetMore");
    if (!list.length) {
      wrap.innerHTML = `<li class="empty">${esc(t("status.empty"))}</li>`;
      if (moreBtn) moreBtn.hidden = true;
      return;
    }
    const lang = getLang();
    const shown = tweetsExpanded ? list : list.slice(0, 3);
    wrap.innerHTML = shown
      .map(
        (tw) => `
        <li class="tweet-item">
          <p class="tweet-text">${esc(tw.text[lang] || tw.text.zh)}</p>
          <span class="tweet-time">${relTime(tw.time, lang)}</span>
        </li>`
      )
      .join("");

    // 超过3条才显示切换按钮
    if (moreBtn) {
      if (list.length > 3) {
        moreBtn.hidden = false;
        moreBtn.textContent = tweetsExpanded ? t("sidebar.showLess") : t("sidebar.showMore");
        moreBtn.setAttribute("aria-expanded", String(tweetsExpanded));
      } else {
        moreBtn.hidden = true;
      }
    }
  }

  /* ---------- 加载：文章详情（懒加载） ---------- */
  async function openArticle(file) {
    const wrap = $("articleWrap");

    // 记录来源视图（当前可见的列表类视图），用于面包屑返回
    const listView = $("listView");
    const articlesView = $("articlesView");
    if (articlesView && !articlesView.hidden) {
      articleSourceView = "articles";
    } else if (listView && !listView.hidden) {
      articleSourceView = "list";
    }

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

        if (window.marked) {
          marked.setOptions({ breaks: true, gfm: true });
          html = marked.parse(md);
        } else {
          html = `<pre><code>${esc(md)}</code></pre>`;
        }
        articleCache.set(file, html);
      }

      const meta = articles.find((a) => a.file === file);
      const lang = getLang();
      const title = meta ? esc(meta.title[lang] || meta.title.zh) : "";
      const date = meta ? fmtDate(meta.date, lang) : "";

      // 更新面包屑当前节点文字
      const crumbCurrent = $("crumbCurrent");
      if (crumbCurrent) crumbCurrent.textContent = meta ? (meta.title[lang] || meta.title.zh) : "";

      wrap.innerHTML = `
        <header class="article-head">
          <h1 class="article-title">${title}</h1>
          <time class="article-date">${date}</time>
        </header>
        <div class="article-body">${html}</div>`;

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
      articles: "articlesView",
      article: "articleView",
      about: "aboutView",
      contact: "contactView"
    };
    Object.entries(views).forEach(([k, id]) => {
      const el = $(id);
      if (el) el.hidden = k !== name;
    });
    closeMobileMenu();
  }

  /* ---------- 音乐播放器（完整版） ---------- */
  function initMusicPlayer() {
    const audio = $("bgAudio");
    const playBtn = $("musicPlayBtn");
    const seek = $("musicSeek");
    const timeEl = $("musicTime");
    const volBtn = $("musicVolBtn");
    const volSlider = $("musicVolume");
    const plBtn = $("musicPlaylistBtn");
    const plPanel = $("musicPlaylist");
    const plList = $("playlistList");
    const titleEl = $("musicTitle");
    const artistEl = $("musicArtist");

    if (!audio || !playBtn) return;

    let lastVolume = 0.7;

    /** 加载指定索引的歌曲 */
    function loadSong(index) {
      currentSongIndex = index;
      const song = playlist[index];
      audio.src = song.src;
      titleEl.textContent = song.title;
      artistEl.textContent = song.artist;
      renderPlaylist();
      // 下一帧检测标题是否溢出，决定是否启用滚动
      requestAnimationFrame(updateTitleMarquee);
    }

    /** 歌曲名过长时启用滚动动画 */
    function updateTitleMarquee() {
      const meta = titleEl.parentElement;
      if (!meta) return;
      // 判断标题文字宽度是否超过可用空间
      const textWidth = titleEl.scrollWidth;
      const availWidth = meta.clientWidth - (artistEl.offsetWidth + 16);
      const overflow = textWidth > availWidth + 1;
      if (overflow) {
        if (!titleEl.classList.contains("marquee")) {
          // 首次启用：将文字包裹进 marquee-inner span
          const text = titleEl.textContent;
          titleEl.classList.add("marquee");
          titleEl.innerHTML = '<span class="marquee-inner">' + esc(text) + "</span>";
        }
      } else {
        if (titleEl.classList.contains("marquee")) {
          // 恢复：取出 marquee-inner 内的文字
          const inner = titleEl.querySelector(".marquee-inner");
          titleEl.classList.remove("marquee");
          titleEl.textContent = inner ? inner.textContent : titleEl.textContent;
        }
      }
    }
    window.addEventListener("resize", updateTitleMarquee);

    /** 渲染播放列表 */
    function renderPlaylist() {
      plList.innerHTML = playlist
        .map(
          (s, i) => `
          <li class="playlist-item ${i === currentSongIndex ? "active" : ""}" data-index="${i}">
            <span class="pl-index">${String(i + 1).padStart(2, "0")}</span>
            <span class="pl-info">
              <span class="pl-title">${esc(s.title)}</span>
              <span class="pl-artist">${esc(s.artist)}</span>
            </span>
            ${i === currentSongIndex ? '<span class="pl-playing">♪</span>' : ""}
          </li>`
        )
        .join("");

      plList.querySelectorAll(".playlist-item").forEach((item) => {
        item.addEventListener("click", () => {
          const idx = parseInt(item.dataset.index, 10);
          if (idx === currentSongIndex) {
            // 同一首：切换播放
            togglePlay();
          } else {
            loadSong(idx);
            audio.play().catch(() => {});
          }
        });
      });
    }

    /** 切换播放/暂停 */
    async function togglePlay() {
      try {
        if (audio.paused) {
          // 若尚未缓冲，显示加载态
          if (audio.readyState < 2) playBtn.classList.add("loading");
          await audio.play();
          playBtn.classList.remove("loading");
          playBtn.classList.add("playing");
        } else {
          audio.pause();
          playBtn.classList.remove("playing");
        }
      } catch (err) {
        playBtn.classList.remove("loading");
        console.error("[music] play failed:", err);
      }
    }

    playBtn.addEventListener("click", togglePlay);

    // 缓冲不足时显示加载态，可播放时移除
    audio.addEventListener("waiting", () => playBtn.classList.add("loading"));
    audio.addEventListener("playing", () => playBtn.classList.remove("loading"));
    audio.addEventListener("canplay", () => playBtn.classList.remove("loading"));

    // 元数据加载 → 显示总时长
    audio.addEventListener("loadedmetadata", () => {
      timeEl.textContent = fmtTime(audio.currentTime) + "/" + fmtTime(audio.duration);
    });

    let seeking = false;

    // 时间更新 → 进度条 + 时间显示（拖动时不覆盖）
    audio.addEventListener("timeupdate", () => {
      if (!seeking && audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 1000;
        seek.value = String(pct);
      }
      timeEl.textContent = fmtTime(audio.currentTime) + "/" + fmtTime(audio.duration);
    });

    // 播放结束 → 暂停 3 秒后播放下一首
    audio.addEventListener("ended", () => {
      playBtn.classList.remove("playing");
      setTimeout(() => {
        const nextIdx = (currentSongIndex + 1) % playlist.length;
        loadSong(nextIdx);
        audio.play().then(() => playBtn.classList.add("playing")).catch(() => {});
      }, 3000);
    });

    // 拖动进度条开始
    seek.addEventListener("pointerdown", () => { seeking = true; });
    seek.addEventListener("input", () => {
      if (audio.duration) {
        audio.currentTime = (parseFloat(seek.value) / 1000) * audio.duration;
        timeEl.textContent = fmtTime(audio.currentTime) + "/" + fmtTime(audio.duration);
      }
    });
    // 拖动结束 → 跳到对应时间播放
    seek.addEventListener("pointerup", () => {
      seeking = false;
      if (audio.duration) {
        audio.currentTime = (parseFloat(seek.value) / 1000) * audio.duration;
      }
    });
    seek.addEventListener("change", () => { seeking = false; });

    // 音量滑块
    volSlider.addEventListener("input", () => {
      const v = parseInt(volSlider.value, 10) / 100;
      audio.volume = v;
      audio.muted = v === 0;
      updateVolIcon();
      updateVolFill();
    });

    /** 同步音量滑块轨道的已填充比例（CSS 变量 --vol） */
    function updateVolFill() {
      const pct = Math.round((audio.muted ? 0 : audio.volume) * 100);
      volSlider.style.setProperty("--vol", pct + "%");
    }

    // 音量区域（桌面端 hover 展开 + 拖动时保持展开；移动端点击展开）
    const volWrap = $("musicVolumeWrap");
    const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

    // 桌面端：拖动音量滑块时保持展开，松开后由 hover 决定是否隐藏
    if (volWrap && !isTouch) {
      volSlider.addEventListener("pointerdown", () => volWrap.classList.add("vol-open"));
      document.addEventListener("pointerup", () => {
        volWrap.classList.remove("vol-open");
        volSlider.blur();
      });
      volWrap.addEventListener("mouseleave", () => volSlider.blur());
    }

    // 音量按钮：桌面端点击切换静音；移动端点击展开/收起滑块
    volBtn.addEventListener("click", () => {
      if (isTouch && volWrap) {
        volWrap.classList.toggle("vol-open");
        return;
      }
      if (audio.muted || audio.volume === 0) {
        audio.muted = false;
        audio.volume = lastVolume || 0.7;
        volSlider.value = String(Math.round(audio.volume * 100));
      } else {
        lastVolume = audio.volume;
        audio.muted = true;
        volSlider.value = "0";
      }
      updateVolIcon();
      updateVolFill();
    });

    // 移动端：点击外部收起滑块
    if (isTouch && volWrap) {
      document.addEventListener("click", (e) => {
        if (volWrap && !volWrap.contains(e.target)) {
          volWrap.classList.remove("vol-open");
        }
      });
    }

    /** 更新音量图标状态（4 档） */
    function updateVolIcon() {
      volBtn.classList.remove("muted", "low", "mid", "high");
      if (audio.muted || audio.volume === 0) volBtn.classList.add("muted");
      else if (audio.volume <= 0.33) volBtn.classList.add("low");
      else if (audio.volume <= 0.66) volBtn.classList.add("mid");
      else volBtn.classList.add("high");
    }

    // 播放列表开关
    plBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      plPanel.hidden = !plPanel.hidden;
    });
    // 点击外部关闭播放列表
    document.addEventListener("click", (e) => {
      if (!$("musicPlayer").contains(e.target)) plPanel.hidden = true;
    });

    // 初始化
    audio.volume = 0.7;
    loadSong(0);
    updateVolIcon();
    updateVolFill();
    // 页面空闲后后台预加载音频，减少首次点击播放的等待
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => audio.load());
    } else {
      setTimeout(() => audio.load(), 800);
    }
  }

  /* ---------- 滚动渐显/渐隐（IntersectionObserver） ---------- */
  function initRevealObserver() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          } else {
            // 滚出视口时移除 visible，实现渐隐 + 下次进入再渐显
            entry.target.classList.remove("visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
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
      renderHomeArticles();
      renderCategoryTabs();
      renderArticlesList();
    } catch (err) {
      console.error("[loadArticles] failed:", err);
      $("latestList").innerHTML =
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

    // 导航 action
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
            showView("articles");
            window.scrollTo({ top: 0, behavior: "smooth" });
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

    // 碎碎念「显示更多」按钮 → 切换展开/收起
    const tweetMore = $("tweetMore");
    if (tweetMore) {
      tweetMore.addEventListener("click", () => {
        tweetsExpanded = !tweetsExpanded;
        renderTweets(tweets);
      });
    }

    // 返回列表
    // 面包屑「文章」节点 → 返回上一层级（首页 / 分类页）
    const crumbBack = $("crumbBack");
    if (crumbBack) {
      crumbBack.addEventListener("click", (e) => {
        e.preventDefault();
        // 根据来源返回到对应层级
        const target = articleSourceView === "articles" ? "articles" : "list";
        showView(target);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // ESC 关闭移动菜单
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileMenu();
    });

    // 语言切换后重渲染动态内容
    document.addEventListener("langchange", () => {
      renderHomeArticles();
      renderTweets(tweets);
      renderCategoryTabs();
      renderArticlesList();
      // 若当前在文章详情视图，刷新面包屑当前节点文字
      const av = $("articleView");
      const cc = $("crumbCurrent");
      if (av && !av.hidden && cc) {
        const wrap = $("articleWrap");
        const active = wrap && wrap.querySelector(".article-title");
        if (active) cc.textContent = active.textContent;
      }
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    applyTheme(getInitialTheme());
    applyLang(currentLang);
    bindEvents();
    initMusicPlayer();
    loadArticles();
    loadTweets();
    // 在内容渲染后初始化渐显观察（延迟一帧确保 DOM 就绪）
    requestAnimationFrame(initRevealObserver);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
