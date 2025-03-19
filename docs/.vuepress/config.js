import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
    lang: 'en-US',
    title: '庄哈哈',
    description: 'Vue-powered Static Site Generator',
    base: '/blog/',
    bundler: viteBundler(),
    theme: defaultTheme({
        repo: 'vuepress/vuepress-next',
        docsDir: 'docs',
        docsBranch: 'main',
        editLink: true,
        editLinkText: 'Edit this page',
        lastUpdated: true,
    })
})