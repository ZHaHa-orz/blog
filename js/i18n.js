/* ============================================================
 * i18n.js — 中英文词典 & 语言切换
 * 依赖：所有带 data-i18n 的元素会在此处被遍历更新
 * ============================================================ */

const I18N = {
  zh: {
    "brand":            "庄哈哈",
    "nav.home":         "首页",
    "nav.articles":     "文章",
    "nav.about":        "关于",
    "nav.contact":      "联系",

    "lang.label":       "中",

    "hero.greeting":    "Hi, I am 庄哈哈 (Zhaha) 👋",
    "hero.intro":       "自律上瘾中 | 终身学习者 | 审美在线",
    "hero.postsBtn":    "博客文章",
    "hero.githubBtn":   "GitHub",

    "home.title":       "最近文章",
    "home.subtitle":    "记录生活、技术与一些碎碎念",
    "home.pinned":      "置顶文章",
    "home.latest":      "最新文章",

    "articles.title":   "全部文章",
    "articles.subtitle":"按分类浏览所有文章",
    "articles.all":     "全部",
    "articles.tagsTitle":"标签分类",

    "breadcrumb.home":     "首页",
    "breadcrumb.articles":  "文章",

    "sidebar.tweets":     "最近碎碎念",
    "sidebar.contact":    "联系我",
    "sidebar.contactDesc":"想聊点什么？随时找我。",
    "sidebar.contactBtn": "查看联系方式",

    "article.back":     "返回列表",
    "article.loading":  "正在加载文章…",
    "article.notFound": "文章未找到或加载失败。",

    "about.title":      "关于我",
    "about.body":       "你好，我是庄哈哈。这里是我的个人小空间，写一些技术笔记，也记一些生活的碎片。喜欢在文字与代码之间来回踱步，相信温暖的好奇心是最好的引擎。",
    "about.mbti":       "MBTI",
    "about.zodiac":     "星座",
    "about.birth":      "出生",
    "about.location":   "坐标",
    "about.tags":       "身份标签",

    "contact.title":    "联系我",
    "contact.subtitle": "想聊点什么？通过下面任一方式找到我。",
    "contact.wechat":   "微信",
    "contact.phone":    "电话",
    "contact.email":    "邮箱",

    "footer.copy":      "© 2026 庄哈哈. 由温暖与好奇心驱动.",

    "status.loading":   "加载中…",
    "status.empty":     "暂时还没有内容。"
  },

  en: {
    "brand":            "Zhaha",
    "nav.home":         "Home",
    "nav.articles":     "Articles",
    "nav.about":        "About",
    "nav.contact":      "Contact",

    "lang.label":       "EN",

    "hero.greeting":    "Hi, I am 庄哈哈 (Zhaha) 👋",
    "hero.intro":       "Self-discipline Addict | Lifelong Learner | Aesthetic On Point",
    "hero.postsBtn":    "Posts",
    "hero.githubBtn":   "GitHub",

    "home.title":       "Recent Posts",
    "home.subtitle":    "Notes on life, code, and little thoughts",
    "home.pinned":      "Pinned",
    "home.latest":      "Latest",

    "articles.title":   "All Posts",
    "articles.subtitle":"Browse all posts by category",
    "articles.all":     "All",
    "articles.tagsTitle":"Tags",

    "breadcrumb.home":     "Home",
    "breadcrumb.articles":  "Articles",

    "sidebar.tweets":     "Recent Tweets",
    "sidebar.contact":    "Contact Me",
    "sidebar.contactDesc":"Want to chat? Find me anytime.",
    "sidebar.contactBtn": "View Contact",

    "article.back":     "Back to List",
    "article.loading":  "Loading article…",
    "article.notFound": "Article not found or failed to load.",

    "about.title":      "About Me",
    "about.body":       "Hi, I'm Zhaha. This is my little space for tech notes and slices of life. I like to pace between words and code, and I believe warm curiosity is the best engine.",
    "about.mbti":       "MBTI",
    "about.zodiac":     "Zodiac",
    "about.birth":      "Born",
    "about.location":   "Location",
    "about.tags":       "Identity Tags",

    "contact.title":    "Contact Me",
    "contact.subtitle": "Want to chat? Reach out via any of the ways below.",
    "contact.wechat":   "WeChat",
    "contact.phone":    "Phone",
    "contact.email":    "Email",

    "footer.copy":      "© 2026 Zhaha. Powered by warmth & curiosity.",

    "status.loading":   "Loading…",
    "status.empty":     "Nothing here yet."
  }
};

/** 当前语言：zh / en */
let currentLang = localStorage.getItem("blog-lang") || "zh";

/**
 * 应用某种语言：遍历所有 [data-i18n] 元素并替换 textContent
 * @param {("zh"|"en")} lang
 */
function applyLang(lang) {
  currentLang = lang;
  const dict = I18N[lang] || I18N.zh;
  localStorage.setItem("blog-lang", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.textContent = dict[key];
  });

  // 语言按钮显示当前语言标签
  const langBtn = document.getElementById("langToggle");
  if (langBtn) {
    const label = langBtn.querySelector("[data-i18n]");
    if (label) label.textContent = lang === "zh" ? "中" : "EN";
  }

  // 派发事件，让 main.js 等其他模块重新渲染动态内容
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

/** 切换中英文 */
function toggleLang() {
  applyLang(currentLang === "zh" ? "en" : "zh");
}

/** 获取当前语言下的翻译文本 */
function t(key) {
  return (I18N[currentLang] || I18N.zh)[key] || key;
}

/** 获取当前语言 */
function getLang() {
  return currentLang;
}

// 暴露到全局
window.I18N = I18N;
window.applyLang = applyLang;
window.toggleLang = toggleLang;
window.t = t;
window.getLang = getLang;
