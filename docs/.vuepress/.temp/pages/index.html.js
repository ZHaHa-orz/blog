import comp from "D:/code/Zhaha/blog/docs/.vuepress/.temp/pages/index.html.vue"
const data = JSON.parse("{\"path\":\"/\",\"title\":\"主页\",\"lang\":\"zh-CN\",\"frontmatter\":{\"home\":true,\"title\":\"主页\",\"titleTemplate\":\"zhaha's blog\",\"heroImage\":\"/images/波吉01.jpg\",\"heroText\":\"随笔\",\"tagline\":\"一个博客\",\"actionText\":\"快速开始 →\",\"actionLink\":\"/en/guide/\",\"features\":[{\"title\":\"hi\",\"details\":\"你好\"},{\"title\":\"hello\",\"details\":\"大家好\"}],\"footer\":\"MIT Licensed | Copyright © 2020-present 随笔\"},\"headers\":[],\"git\":{\"updatedTime\":1742390408000,\"contributors\":[{\"name\":\"庄哈哈orz\",\"username\":\"\",\"email\":\"1669519973@qq.com\",\"commits\":1}],\"changelog\":[{\"hash\":\"363325c8defae15cf747abacbecefab5d631f7a2\",\"time\":1742390408000,\"email\":\"1669519973@qq.com\",\"author\":\"庄哈哈orz\",\"message\":\"first commit\"}]},\"filePathRelative\":\"README.md\"}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
