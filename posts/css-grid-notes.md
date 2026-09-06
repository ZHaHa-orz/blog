# CSS Grid 实战笔记：从布局到响应式

> 记录几个真实项目里用到的 Grid 技巧。

## 1. auto-fill 与 auto-fit

`auto-fill` 会保留空轨道，`auto-fit` 会拉伸已有项填满空间。

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
```

这一行代码就实现了**自适应卡片网格**：容器够宽就多列，不够就自动换列。

## 2. 子网格（subgrid）

让子项的轨道对齐父网格，适合复杂嵌套布局：

```css
.parent { display: grid; grid-template-columns: repeat(3, 1fr); }
.child  { grid-column: span 3; display: grid; grid-template-columns: subgrid; }
```

## 3. 断点策略

不要用固定像素断点，而是用容器尺寸（Container Queries）或 `minmax` 自动适配。

```css
@media (min-width: 768px) {
  .layout { grid-template-columns: 70% 30%; }
}
```

## 小结

Grid 不是 Flex 的替代品，而是**二维布局**的利器。结合 `minmax`、`auto-fit`、`subgrid`，大多数布局都能优雅解决。
