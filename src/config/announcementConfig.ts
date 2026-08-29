import type { AnnouncementConfig } from "../types/config";

export const announcementConfig: AnnouncementConfig = {
	// 简介标题
	title: "关于我",

	// 简介内容
	content:
		"这里是淡Air，中山大学2025级计算机科学与技术在读。\n关注计算机视觉、强化学习与 Test-Time Training，记录学习与思考。",

	// 简介卡片固定显示
	closable: false,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "更多关于我",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
