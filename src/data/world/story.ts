export type CharacterExpression = "neutral" | "happy" | "thinking" | "surprised";

export interface StoryLine {
	speaker: string;
	text: string;
	expression: CharacterExpression;
}

export interface StoryChoice {
	label: string;
	next: string;
}

export interface StoryNode {
	lines: StoryLine[];
	choices?: StoryChoice[];
	next?: string;
	ending?: boolean;
}

export const storyNodes: Record<string, StoryNode> = {
	opening: {
		lines: [
			{
				speaker: "？？？",
				text: "……嗯？这个时间，居然还有人会来到这里。",
				expression: "surprised",
			},
			{
				speaker: "淡Air",
				text: "晚上好。别紧张，这里只是一间藏在网络角落里的房间。",
				expression: "neutral",
			},
			{
				speaker: "淡Air",
				text: "你是怎么找到这里的？",
				expression: "thinking",
			},
		],
		choices: [
			{ label: "从你的 Blog 过来的", next: "fromBlog" },
			{ label: "只是随便逛逛", next: "wandering" },
			{ label: "先告诉我这里是什么", next: "where" },
		],
	},
	fromBlog: {
		lines: [
			{
				speaker: "淡Air",
				text: "原来如此。那些文章大多是学习留下的脚印，偶尔也混着一点生活。",
				expression: "happy",
			},
			{
				speaker: "淡Air",
				text: "不过只看笔记，很难真正认识一个人，所以才有了这间房间。",
				expression: "neutral",
			},
		],
		next: "secondChoice",
	},
	wandering: {
		lines: [
			{
				speaker: "淡Air",
				text: "随便逛逛也很好。网络上最有意思的相遇，往往都没有计划。",
				expression: "happy",
			},
			{
				speaker: "淡Air",
				text: "既然来了，就让我简单介绍一下这里吧。",
				expression: "neutral",
			},
		],
		next: "secondChoice",
	},
	where: {
		lines: [
			{
				speaker: "淡Air",
				text: "这里既不是纯粹的个人主页，也不完全是一场游戏。",
				expression: "thinking",
			},
			{
				speaker: "淡Air",
				text: "你可以把它看作我的数字房间——文章、代码、兴趣和一些小念头都放在里面。",
				expression: "neutral",
			},
		],
		next: "secondChoice",
	},
	secondChoice: {
		lines: [
			{
				speaker: "淡Air",
				text: "在我带你进去之前，你更想先知道哪一部分？",
				expression: "thinking",
			},
		],
		choices: [
			{ label: "你在研究什么？", next: "technology" },
			{ label: "房间里都有些什么？", next: "life" },
			{ label: "保持一点神秘，直接进去吧", next: "mystery" },
		],
	},
	technology: {
		lines: [
			{
				speaker: "淡Air",
				text: "目前主要在学习人工智能、计算机视觉和深度学习。很多没想明白的问题，最后都会变成 Blog 里的文章。",
				expression: "neutral",
			},
			{
				speaker: "淡Air",
				text: "电脑和书架会带你找到它们。至于写过的代码……终端大概比我更清楚。",
				expression: "happy",
			},
		],
		next: "ending",
	},
	life: {
		lines: [
			{
				speaker: "淡Air",
				text: "有学习笔记、动画、音乐，还有一些暂时说不清用途的小收藏。",
				expression: "happy",
			},
			{
				speaker: "淡Air",
				text: "你可以自由点击那些发光的地方。窗边偶尔也会出现不一样的东西。",
				expression: "neutral",
			},
		],
		next: "ending",
	},
	mystery: {
		lines: [
			{
				speaker: "淡Air",
				text: "不错的选择。说明书太长的话，探索本身就没意思了。",
				expression: "happy",
			},
		],
		next: "ending",
	},
	ending: {
		lines: [
			{
				speaker: "淡Air",
				text: "那么，序章就到这里。",
				expression: "neutral",
			},
			{
				speaker: "淡Air",
				text: "接下来不需要按既定路线走——剩下的，就由你自己发现吧。",
				expression: "happy",
			},
		],
		ending: true,
	},
};

