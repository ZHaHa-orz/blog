import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
    // 基础配置（GitHub Pages 子路径部署）
    base: '/blog/',
    head: [
        ['link', { rel: 'icon', href: '/images/波吉02.jpg' }],
        ['meta', { name: 'keywords', content: '前端技术博客,Vue,JavaScript,TypeScript' }],
        // Open Graph 协议
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:image', content: '/images/波吉l01.png' }],
        // Twitter 卡片
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ],

    // 多语言配置
    locales: {
        '/': {
            lang: 'zh-CN',
            title: '庄哈哈',
            description: '前端开发的学习笔记与个人博客',
        },
        '/en/': {
            lang: 'en-US',
            title: 'Zhaha',
            description: 'Frontend notes and personal blog',
        },
    },

    // 插件配置
    plugins: [],

    bundler: viteBundler(),

    // 主题配置
    theme: defaultTheme({
        // 主题组件配置
        logo: '/images/波吉01.jpg',
        repo: 'ZHaHa-orz/blog',
        docsDir: 'docs',
        docsBranch: 'main',
        editLink: false,
        lastUpdated: true,
        contributors: true,

        // 顶部导航栏配置
        navbar: [
            { text: '🏠 主页', link: 'https://zhaha-orz.github.io/' },
            { text: '📝 博客', link: '/' },
            {
                text: '📚 导航',
                link: '/guide/',
                activeMatch: '^/guide/',
            },
            {
                text: '💡 前端',
                link: '/frontend/',
                activeMatch: '^/frontend/',
            },
        ],

        // 侧边栏配置（自动生成）
        sidebar: 'auto',
    }),

})