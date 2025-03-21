// 导航栏配置（支持多语言）
export const navbarConfig = {
    '/': [
      { text: '🏠 首页', link: '/' },
      {
        text: '📚 指南',
        link: '/guides/',
        activeMatch: '^/guides/',
      },
      {
        text: '💡 博客',
        link: '/blog/',
        activeMatch: '^/blog/',
      },
      {
        text: '🔧 项目',
        children: [
          { text: '项目一', link: '/projects/project1' },
          { text: '项目二', link: '/projects/project2' },
        ],
      },
      { text: '📝 关于', link: '/about/' },
    ],
    '/en/': [
      { text: '🏠 Home', link: '/en/' },
      {
        text: '📚 Guides',
        link: '/en/guides/',
        activeMatch: '^/en/guides/',
      },
      // 其他英文导航项...
    ]
  }