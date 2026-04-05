import type { FriendLink, FriendsPageConfig } from "../types/config";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 显示列数：2列或3列
	columns: 2,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "维护中",
		imgurl: "https://q1.qlogo.cn/g?b=qq&nk=2180327166&s=640",
		desc: "暂未开启，但是如果愿意的话可以先把你的相关信息交给我，改完就放进来",
		siteurl: "",
		tags: ["Blog"],
		weight: 10, // 权重，数字越大排序越靠前
		enabled: false, // 是否启用
	},
	{
		title: "Candlest 的博客",
		imgurl: "https://blog.candlest.cc/favicon/favicon.ico",
		desc: "Candlest 的个人博客，记录技术、系统、安全、AI 与生活",
		siteurl: "https://blog.candlest.cc/",
		tags: ["Blog"],
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
];

// 获取启用的友链并按权重排序
export const getEnabledFriends = (): FriendLink[] => {
	return friendsConfig
		.filter((friend) => friend.enabled)
		.sort((a, b) => b.weight - a.weight);
};
