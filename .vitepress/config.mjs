import {defineConfig} from 'vitepress'

export default defineConfig({
	base: '/majiang-server/',
	lang: 'zh-CN',
	title: "网络麻将游戏",
	description: "网络麻将游戏文档",
	head: [
		['link', {rel: 'icon', href: 'https://vitepress.dev/vitepress-logo-large.webp'}],
		["meta", {name: "referrer", content: "no-referrer"}],
	],
	themeConfig: {
		logo: 'https://vitepress.dev/vitepress-logo-large.webp',
		nav: [
			{text: '首页', link: '/'},
      {text: '快速开始', link: '/.vitepress/docs/introduction/index'},
		],
		sidebar: [
			{text: '快速开始', link: '/.vitepress/docs/introduction/index'},
		],

		socialLinks: [
			{icon: 'github', link: 'https://github.com/liumengniu/majiang-server'}
		]
	}
})
