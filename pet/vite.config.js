import { defineConfig } from "vite";

// 贝塔桌宠 — Vite 配置
// 支持本地运行 (pnpm dev) 与热重载 (HMR)
export default defineConfig({
  base: "./",
  root: ".",
  server: {
    host: "0.0.0.0",
    port: 5174,
    open: false,
    // 静态资源从 pet/public 读取；同时允许访问上级 assets（音频）
    fs: { strict: false }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2019"
  }
});
