export const themeData = JSON.parse("{\"logo\":\"/images/波吉01.jpg\",\"repo\":\"ZHaHa-orz/blog\",\"docsDir\":\"docs\",\"docsBranch\":\"main\",\"editLink\":false,\"lastUpdated\":true,\"contributors\":true,\"navbar\":[{\"text\":\"🏠 首页\",\"link\":\"/\"},{\"text\":\"📚 导航\",\"link\":\"/guide/\",\"activeMatch\":\"^/guide/\"},{\"text\":\"💡 前端\",\"link\":\"/frontend/\",\"activeMatch\":\"^/frontend/\"},{\"text\":\"🔧 项目\",\"children\":[{\"text\":\"Project 1\",\"link\":\"/projects/project1\"},{\"text\":\"Project 2\",\"link\":\"/projects/project2\"}]},{\"text\":\"📝 关于我\",\"link\":\"https://zhaha-orz.github.io/\"}],\"sidebar\":{\"/guides/\":[{\"text\":\"Getting Started\",\"collapsible\":true,\"children\":[\"/guides/\"]},{\"text\":\"Advanced\",\"collapsible\":true,\"children\":[\"/guides/\"]}]},\"locales\":{\"/\":{\"selectLanguageName\":\"English\"}},\"colorMode\":\"auto\",\"colorModeSwitch\":true,\"selectLanguageText\":\"Languages\",\"selectLanguageAriaLabel\":\"Select language\",\"sidebarDepth\":2,\"editLinkText\":\"Edit this page\",\"lastUpdatedText\":\"Last Updated\",\"contributorsText\":\"Contributors\",\"notFound\":[\"There's nothing here.\",\"How did we get here?\",\"That's a Four-Oh-Four.\",\"Looks like we've got some broken links.\"],\"backToHome\":\"Take me home\",\"openInNewWindow\":\"open in new window\",\"toggleColorMode\":\"toggle color mode\",\"toggleSidebar\":\"toggle sidebar\"}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateThemeData) {
    __VUE_HMR_RUNTIME__.updateThemeData(themeData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ themeData }) => {
    __VUE_HMR_RUNTIME__.updateThemeData(themeData)
  })
}
