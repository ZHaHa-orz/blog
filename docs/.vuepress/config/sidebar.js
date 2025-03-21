// 侧边栏配置（支持多语言）
export const sidebarConfig = {
    '/': {
      '/guides/': [
        {
          text: '入门指南',
          collapsible: true,
          children: [
            '/guides/introduction.md',
            '/guides/installation.md',
            '/guides/configuration.md',
          ],
        },
        {
          text: '进阶主题',
          collapsible: true,
          children: [
            '/guides/performance.md',
            '/guides/deployment.md',
          ],
        }
      ],
      '/blog/': 'auto'
    },
    '/en/': {
      '/en/guides/': [
        {
          text: 'Getting Started',
          collapsible: true,
          children: [
            '/en/guides/introduction.md',
            '/en/guides/installation.md',
            '/en/guides/configuration.md',
          ],
        },
        // 其他英文侧边栏配置...
      ]
    }
  }