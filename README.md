# 庄哈哈的博客

基于 [VuePress 2](https://v2.vuepress.vuejs.org/) 构建的个人博客，部署在 GitHub Pages。

## 访问地址

- 博客：https://zhaha-orz.github.io/blog/
- 个人主页：https://zhaha-orz.github.io/

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm docs:dev

# 构建静态站点
pnpm docs:build
```

## 部署

通过 GitHub Actions（`.github/workflows/deploy-docs.yml`）自动构建并部署到 `gh-pages` 分支。
