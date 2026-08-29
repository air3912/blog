import type { AnnouncementConfig } from "../types/config";

export const announcementConfig: AnnouncementConfig = {
	// 简介标题
	title: "关于我",

	// 简介内容
	content:
		"2025级计算机科学与技术\nSpatial Intelligence ｜ Continual Learning",

	// 简介卡片固定显示
	closable: false,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "更多",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
