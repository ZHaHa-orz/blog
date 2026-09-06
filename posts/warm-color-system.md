# 暖色系博客的色彩系统

> 奶油白、焦糖棕、暖杏色——一套温柔却实用的配色。

## 色板

| 用途 | 浅色 | 深色 |
|------|------|------|
| 背景 | `#FDF8F4` 奶油白 | `#1E1816` 暖黑 |
| 卡片 | `#FFFFFF` | `#2A221F` |
| 标题 | `#3D2C26` 深棕 | `#F0E3DA` 暖白 |
| 正文 | `#5A4A44` 中棕 | `#C6B2A8` |
| 强调 | `#D68C6A` 暖杏 | `#E8A98A` 亮杏 |

## CSS 变量挂载

所有颜色都挂在 `[data-theme]` 选择器下，切换主题只需改 `<html>` 的属性：

```css
[data-theme="light"] {
  --bg: #FDF8F4;
  --accent: #D68C6A;
}
[data-theme="dark"] {
  --bg: #1E1816;
  --accent: #E8A98A;
}
body { background: var(--bg); }
```

## 三个原则

1. **暖，不刺眼**：浅色背景偏奶白而非纯白，深色背景带一点棕调而非冷黑。
2. **对比达标**：正文与背景对比度均在 `WCAG AA` 以上，长时间阅读不累。
3. **强调色克制**：杏色只用于链接、标签、按钮，不当大面积铺色。

## 记忆用户偏好

主题存 `localStorage`，首次访问读 `prefers-color-scheme`，系统切换且用户未手动设置时跟随系统：

```javascript
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  applyTheme("dark");
}
```

这样既尊重用户，又不打扰。

## 小结

配色像温度，**合适比惊艳重要**。这套暖色让博客像一杯温拿铁，而不是一盏霓虹灯。
