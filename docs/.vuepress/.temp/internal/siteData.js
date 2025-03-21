export const siteData = JSON.parse("{\"base\":\"/blog/\",\"lang\":\"en-US\",\"title\":\"\",\"description\":\"\",\"head\":[[\"link\",{\"rel\":\"icon\",\"href\":\"/images/波吉02.jpg\"}],[\"meta\",{\"name\":\"keywords\",\"content\":\"前端技术博客,Vue,JavaScript,TypeScript\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"website\"}],[\"meta\",{\"property\":\"og:image\",\"content\":\"/images/波吉l01.png\"}],[\"meta\",{\"name\":\"twitter:card\",\"content\":\"summary_large_image\"}]],\"locales\":{\"/\":{\"lang\":\"zh-CN\",\"title\":\"庄哈哈\",\"description\":\"Vue 驱动的静态网站生成器\"},\"/en/\":{\"lang\":\"en-US\",\"title\":\"Zhaha\",\"description\":\"Vue-powered Static Site Generator\"}}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateSiteData) {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ siteData }) => {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  })
}
