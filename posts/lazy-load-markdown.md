# 用原生 JS 实现 Markdown 懒加载

> 不用框架，也能让博客又快又轻。

## 思路

文章列表只存元数据（标题、摘要、日期、文件名），正文 `.md` 文件在**用户点击标题后**才发起 `fetch` 请求，并用 `marked` 解析、`highlight.js` 高亮，最后缓存进 `Map`。

```javascript
async function openArticle(file) {
  if (cache.has(file)) return cache.get(file);
  const res = await fetch(`posts/${file}`);
  const md  = await res.text();
  const html = marked.parse(md);
  cache.set(file, html);
  return html;
}
```

## 关键点

1. **懒加载**：首屏只加载一个 `articles.json`（几 KB），不预取任何 `.md`。
2. **缓存**：用 `Map` 缓存已渲染的 HTML，二次打开零网络。
3. **降级**：若 `marked` 还没就绪，先用 `<pre><code>` 兜底，保证内容可见。

## 代码高亮适配深浅色

主题切换时动态替换 `highlight.js` 的样式表：

```javascript
function syncCodeTheme(theme) {
  const href = theme === "dark"
    ? ".../atom-one-dark.min.css"
    : ".../atom-one-light.min.css";
  document.getElementById("hljs-theme").href = href;
}
```

这样代码块在浅色下是清爽的浅底，在深色下是暖黑底，永远不刺眼。

## 小结

整个交互链路没有引入任何前端框架，文件结构也很干净：

```text
/
├── index.html
├── css/style.css
├── js/
│   ├── i18n.js
│   ├── theme.js
│   └── main.js
├── data/
│   ├── articles.json
│   └── tweets.json
└── posts/
    └── *.md
```

够轻、够快、够暖。这就够了。
