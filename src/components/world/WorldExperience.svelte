<script lang="ts">
	import { onMount } from "svelte";
	import { storyNodes, type CharacterExpression, type StoryChoice } from "@/data/world/story";

	type Phase = "title" | "story" | "transition" | "world";
	type PanelId = "blog" | "github" | "about" | "archive" | "guestbook" | "window" | "music";

	interface StorySave {
		nodeId: string;
		lineIndex: number;
	}

	interface Hotspot {
		id: PanelId;
		label: string;
		icon: string;
		x: number;
		y: number;
		w: number;
		h: number;
		mx: number;
		my: number;
		mw: number;
		mh: number;
	}

	interface PanelInfo {
		eyebrow: string;
		title: string;
		description: string;
		primaryLabel?: string;
		primaryHref?: string;
		external?: boolean;
		secondaryLabel?: string;
		secondaryHref?: string;
	}

	const SAVE_KEY = "air-world-story-save-v1";
	const COMPLETE_KEY = "air-world-intro-completed-v1";

	const characterImages: Record<CharacterExpression, string> = {
		neutral: "/world/characters/host-neutral.webp",
		happy: "/world/characters/host-happy.webp",
		thinking: "/world/characters/host-thinking.webp",
		surprised: "/world/characters/host-surprised.webp",
	};

	const hotspots: Hotspot[] = [
		{ id: "blog", label: "Blog", icon: "✦", x: 22, y: 26, w: 15, h: 21, mx: 20, my: 25, mw: 18, mh: 13 },
		{ id: "github", label: "GitHub", icon: "⌘", x: 23, y: 44, w: 19, h: 11, mx: 22, my: 34, mw: 27, mh: 10 },
		{ id: "music", label: "音乐", icon: "♪", x: 40, y: 31, w: 7, h: 15, mx: 39, my: 27, mw: 13, mh: 11 },
		{ id: "about", label: "关于我", icon: "◇", x: 18, y: 8, w: 16, h: 22, mx: 16, my: 9, mw: 21, mh: 16 },
		{ id: "window", label: "窗外", icon: "☾", x: 59, y: 3, w: 28, h: 42, mx: 57, my: 3, mw: 32, mh: 30 },
		{ id: "archive", label: "归档", icon: "▤", x: 42, y: 5, w: 14, h: 44, mx: 38, my: 7, mw: 19, mh: 26 },
		{ id: "guestbook", label: "留言", icon: "☁", x: 0, y: 7, w: 12, h: 60, mx: 0, my: 4, mw: 14, mh: 50 },
	];

	const panels: Record<Exclude<PanelId, "window" | "music">, PanelInfo> = {
		blog: {
			eyebrow: "桌面上的记录",
			title: "Blog",
			description: "人工智能、计算机视觉、深度学习与论文阅读笔记，也有学习过程中的思考和日常随想。",
			primaryLabel: "进入 Blog",
			primaryHref: "/blog/",
			secondaryLabel: "查看文章归档",
			secondaryHref: "/archive/",
		},
		github: {
			eyebrow: "终端仍在运行",
			title: "GitHub",
			description: "项目、实验和一些仍在慢慢生长的代码。链接会在新标签页打开。",
			primaryLabel: "打开 GitHub",
			primaryHref: "https://github.com/air3912",
			external: true,
		},
		about: {
			eyebrow: "相框背面的小字",
			title: "关于淡Air",
			description: "如果你更喜欢普通网页，这里保留了一份不需要游玩的个人介绍。",
			primaryLabel: "查看关于我",
			primaryHref: "/about/",
		},
		archive: {
			eyebrow: "书架上的分类索引",
			title: "文章归档",
			description: "按时间、分类与标签翻找过去写下的内容。",
			primaryLabel: "翻开归档",
			primaryHref: "/archive/",
		},
		guestbook: {
			eyebrow: "窗边留下的便签",
			title: "留言板",
			description: "如果你来过这里，也可以留下几句话。",
			primaryLabel: "写一张便签",
			primaryHref: "/guestbook/",
		},
	};

	const windowLines = [
		"今晚的萤火虫比平时多了一点。",
		"远处还有灯亮着。也许有人和我一样，还没有结束今天。",
		"月亮没有回答任何问题，但至少让房间安静了下来。",
		"有些想法适合写进文章，有些只适合留在夜里。",
	];

	let phase: Phase = "title";
	let nodeId = "opening";
	let lineIndex = 0;
	let hasSave = false;
	let hasCompleted = false;
	let showExitConfirm = false;
	let activePanel: PanelId | null = null;
	let transitionText = "故事之外，还有一间房间。";
	let windowLine = windowLines[0];
	let hintsVisible = true;
	let transitionTimer: ReturnType<typeof setTimeout> | undefined;

	$: currentNode = storyNodes[nodeId];
	$: currentLine = currentNode.lines[lineIndex];
	$: awaitingChoice = lineIndex === currentNode.lines.length - 1 && Boolean(currentNode.choices?.length);

	onMount(() => {
		hasCompleted = localStorage.getItem(COMPLETE_KEY) === "true";
		hasSave = readSave() !== null;
		return () => {
			if (transitionTimer) clearTimeout(transitionTimer);
		};
	});

	function readSave(): StorySave | null {
		try {
			const raw = localStorage.getItem(SAVE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as StorySave;
			if (!storyNodes[parsed.nodeId]) return null;
			return parsed;
		} catch {
			return null;
		}
	}

	function saveProgress(nextNodeId = nodeId, nextLineIndex = lineIndex) {
		localStorage.setItem(SAVE_KEY, JSON.stringify({ nodeId: nextNodeId, lineIndex: nextLineIndex }));
		hasSave = true;
	}

	function startStory(resume = false) {
		if (resume) {
			const saved = readSave();
			if (saved) {
				nodeId = saved.nodeId;
				lineIndex = Math.min(saved.lineIndex, storyNodes[saved.nodeId].lines.length - 1);
			} else {
				nodeId = "opening";
				lineIndex = 0;
			}
		} else {
			nodeId = "opening";
			lineIndex = 0;
			saveProgress("opening", 0);
		}
		showExitConfirm = false;
		phase = "story";
	}

	function advanceStory() {
		if (awaitingChoice || showExitConfirm) return;

		if (lineIndex < currentNode.lines.length - 1) {
			lineIndex += 1;
			saveProgress(nodeId, lineIndex);
			return;
		}

		if (currentNode.next) {
			nodeId = currentNode.next;
			lineIndex = 0;
			saveProgress(nodeId, 0);
			return;
		}

		if (currentNode.ending) finishStory();
	}

	function choose(choice: StoryChoice) {
		nodeId = choice.next;
		lineIndex = 0;
		saveProgress(choice.next, 0);
	}

	function finishStory() {
		localStorage.setItem(COMPLETE_KEY, "true");
		localStorage.removeItem(SAVE_KEY);
		hasCompleted = true;
		hasSave = false;
		enterWorld("序章结束，房间的灯亮了起来。", true);
	}

	function enterWorld(message = "故事可以暂停，房间一直都在。", animate = true) {
		showExitConfirm = false;
		activePanel = null;
		if (!animate) {
			phase = "world";
			return;
		}
		transitionText = message;
		phase = "transition";
		transitionTimer = setTimeout(() => {
			phase = "world";
		}, 1350);
	}

	function openHotspot(id: PanelId) {
		hintsVisible = false;
		if (id === "window") {
			const currentIndex = windowLines.indexOf(windowLine);
			windowLine = windowLines[(currentIndex + 1) % windowLines.length];
		}
		activePanel = id;
	}

	function replayStory() {
		activePanel = null;
		startStory(false);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			if (activePanel) activePanel = null;
			else if (showExitConfirm) showExitConfirm = false;
			else if (phase === "story") showExitConfirm = true;
		}
		if ((event.key === "Enter" || event.key === " ") && phase === "story" && !awaitingChoice) {
			const target = event.target as HTMLElement;
			if (target.tagName !== "BUTTON" && target.tagName !== "A") advanceStory();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="experience" data-phase={phase}>
	{#if phase === "title"}
		<section class="scene title-scene" aria-label="游戏标题画面">
			<picture class="scene-picture">
				<source media="(max-width: 720px), (orientation: portrait)" srcset="/world/backgrounds/room-mobile.webp" />
				<img src="/world/backgrounds/room-title.webp" alt="月光照进安静的房间" fetchpriority="high" />
			</picture>
			<div class="scene-shade title-shade"></div>
			<div class="fireflies" aria-hidden="true">
				<span></span><span></span><span></span><span></span><span></span><span></span>
			</div>

			<div class="title-content">
				<p class="kicker">A QUIET CORNER ON THE WEB</p>
				<h1><span>淡Air</span>的世界</h1>
				<p class="subtitle">一段简短的故事，以及藏在房间里的个人主页。</p>
				<div class="title-actions">
					<button class="primary-button" onclick={() => startStory(false)}>开始故事</button>
					{#if hasSave}
						<button class="glass-button" onclick={() => startStory(true)}>继续上次进度</button>
					{/if}
					<button class="text-button" onclick={() => enterWorld("", false)}>
						{hasCompleted ? "进入房间" : "暂时跳过，进入主页"}
					</button>
				</div>
			</div>
			<p class="title-footnote">点击开始 · 剧情中可随时退出</p>
		</section>
	{:else if phase === "story"}
		<section class="scene story-scene" aria-label="视觉小说序章">
			<picture class="scene-picture">
				<source media="(max-width: 720px), (orientation: portrait)" srcset="/world/backgrounds/room-mobile.webp" />
				<img src="/world/backgrounds/room-desktop.webp" alt="淡紫色的夜间房间" />
			</picture>
			<div class="scene-shade story-shade"></div>

			<button class="exit-story" onclick={() => (showExitConfirm = true)} aria-label="退出故事">
				<span>退出故事</span><b>×</b>
			</button>

			<img
				class="story-character"
				src={characterImages[currentLine.expression]}
				alt={`淡Air，${currentLine.expression}表情`}
			/>

			<div class="story-ui">
				{#if awaitingChoice}
					<div class="choices" aria-label="请选择回答">
						{#each currentNode.choices ?? [] as choice}
							<button onclick={() => choose(choice)}>{choice.label}<span>›</span></button>
						{/each}
					</div>
				{/if}

				<button class="dialogue" onclick={advanceStory} disabled={awaitingChoice} aria-live="polite">
					<span class="speaker">{currentLine.speaker}</span>
					{#key `${nodeId}-${lineIndex}`}
						<span class="dialogue-text">{currentLine.text}</span>
					{/key}
					{#if !awaitingChoice}<span class="next-mark" aria-hidden="true">⌄</span>{/if}
				</button>
				<div class="story-progress" aria-label="剧情操作提示">
					<span>Enter / 点击继续</span>
					<span>进度自动保存在浏览器中</span>
				</div>
			</div>

			{#if showExitConfirm}
				<div class="modal-backdrop" role="presentation">
					<section class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="exit-title">
						<p class="panel-kicker">PAUSE THE STORY</p>
						<h2 id="exit-title">要先去房间里看看吗？</h2>
						<p>故事进度会保留，下次仍然可以从这里继续。</p>
						<div class="confirm-actions">
							<button class="primary-button" onclick={() => enterWorld()}>进入主页</button>
							<button class="glass-button" onclick={() => (showExitConfirm = false)}>继续故事</button>
						</div>
					</section>
				</div>
			{/if}
		</section>
	{:else if phase === "transition"}
		<section class="transition-scene" aria-live="polite">
			<div class="transition-orb"></div>
			<p>{transitionText}</p>
		</section>
	{:else}
		<section class="scene world-scene" aria-label="淡Air的互动房间">
			<picture class="scene-picture">
				<source media="(max-width: 720px), (orientation: portrait)" srcset="/world/backgrounds/room-mobile.webp" />
				<img src="/world/backgrounds/room-desktop.webp" alt="可以自由探索的夜间房间" />
			</picture>
			<div class="scene-shade world-shade"></div>

			<header class="world-header">
				<div>
					<p>DIGITAL ROOM</p>
					<h1>淡Air的房间</h1>
				</div>
				<nav aria-label="房间操作">
					<a href="/blog/">Blog</a>
					<button onclick={replayStory}>重温故事</button>
				</nav>
			</header>

			<div class="hotspots" aria-label="房间内可以互动的物品">
				{#each hotspots as spot}
					<button
						class="hotspot"
						style={`--x:${spot.x}%;--y:${spot.y}%;--w:${spot.w}%;--h:${spot.h}%;--mx:${spot.mx}%;--my:${spot.my}%;--mw:${spot.mw}%;--mh:${spot.mh}%;`}
						onclick={() => openHotspot(spot.id)}
						aria-label={`查看${spot.label}`}
					>
						<span class="hotspot-dot">{spot.icon}</span>
						<span class="hotspot-label">{spot.label}</span>
					</button>
				{/each}
			</div>

			<button class="character-hotspot" onclick={replayStory} aria-label="与淡Air交谈，重新开始故事">
				<img class="world-character" src={characterImages.happy} alt="站在房间里的淡Air" />
				<span>再聊一会儿？</span>
			</button>

			{#if hintsVisible}
				<div class="explore-hint">
					<span class="pulse-dot"></span>
					点击房间里发光的物品自由探索
				</div>
			{/if}

			<div class="world-footer">
				<span>ROOM 3912</span>
				<span>所有链接都可以随时返回这里</span>
			</div>

			{#if activePanel}
				<div
					class="modal-backdrop world-modal"
					role="presentation"
					onclick={(event) => event.target === event.currentTarget && (activePanel = null)}
				>
					<section class="object-card" role="dialog" aria-modal="true" aria-labelledby="panel-title">
						<button class="close-panel" onclick={() => (activePanel = null)} aria-label="关闭">×</button>
						{#if activePanel === "window"}
							<p class="panel-kicker">A THOUGHT BY THE WINDOW</p>
							<h2 id="panel-title">窗外</h2>
							<p class="panel-description">{windowLine}</p>
							<button class="small-action" onclick={() => openHotspot("window")}>再看一会儿</button>
						{:else if activePanel === "music"}
							<p class="panel-kicker">NOW PLAYING, SOMEDAY</p>
							<h2 id="panel-title">耳机</h2>
							<p class="panel-description">这里会放一首适合夜晚的音乐。原型阶段先让房间保持安静。</p>
							<span class="coming-soon">音乐播放器 · 待接入</span>
						{:else}
							{@const panel = panels[activePanel]}
							<p class="panel-kicker">{panel.eyebrow}</p>
							<h2 id="panel-title">{panel.title}</h2>
							<p class="panel-description">{panel.description}</p>
							<div class="panel-actions">
								{#if panel.primaryHref}
									<a class="primary-button" href={panel.primaryHref} target={panel.external ? "_blank" : undefined} rel={panel.external ? "noreferrer" : undefined}>
										{panel.primaryLabel}<span>↗</span>
									</a>
								{/if}
								{#if panel.secondaryHref}
									<a class="glass-button" href={panel.secondaryHref}>{panel.secondaryLabel}</a>
								{/if}
							</div>
						{/if}
					</section>
				</div>
			{/if}
		</section>
	{/if}
</main>

<style>
	:global(body) {
		overscroll-behavior: none;
	}

	.experience,
	.scene,
	.transition-scene {
		--night: #17233d;
		--deep-night: #111a2e;
		--mist-blue: #667f9f;
		--soft-blue: #8198b3;
		--cream: #f7f0e5;
		--gold: #e8be72;
		position: relative;
		width: 100vw;
		height: 100dvh;
		min-height: 560px;
		overflow: hidden;
		color: #fff;
		background: var(--night);
	}

	.scene-picture,
	.scene-picture img,
	.scene-shade {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.scene-picture img {
		object-fit: cover;
		object-position: center;
	}

	.scene-shade {
		pointer-events: none;
	}

	.title-shade {
		background:
			radial-gradient(circle at 68% 31%, transparent 0 18%, rgba(23, 35, 61, 0.14) 62%),
			linear-gradient(90deg, rgba(17, 26, 46, 0.79), rgba(37, 53, 80, 0.24) 55%, rgba(32, 43, 66, 0.2));
	}

	.title-content {
		position: absolute;
		z-index: 3;
		left: clamp(28px, 8vw, 136px);
		top: 50%;
		width: min(590px, calc(100vw - 56px));
		transform: translateY(-50%);
		animation: title-in 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	.kicker,
	.panel-kicker,
	.world-header p {
		margin: 0 0 12px;
		font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #f4d596;
	}

	.title-content h1 {
		margin: 0;
		font-family: Georgia, "Songti SC", "STSong", serif;
		font-size: clamp(52px, 7vw, 104px);
		font-weight: 500;
		line-height: 0.98;
		letter-spacing: -0.055em;
		text-shadow: 0 10px 38px rgba(14, 10, 39, 0.42);
	}

	.title-content h1 span {
		color: var(--gold);
	}

	.subtitle {
		max-width: 440px;
		margin: 22px 0 34px;
		font-size: clamp(14px, 1.4vw, 17px);
		line-height: 1.8;
		letter-spacing: 0.04em;
		color: rgba(255, 255, 255, 0.78);
	}

	.title-actions,
	.confirm-actions,
	.panel-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.primary-button,
	.glass-button,
	.text-button,
	.small-action {
		border: 0;
		border-radius: 999px;
		cursor: pointer;
		text-decoration: none;
		transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
	}

	.primary-button,
	.glass-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 46px;
		padding: 0 22px;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.primary-button {
		color: #28364d;
		background: linear-gradient(135deg, #fffaf2, #e7edf5);
		box-shadow: 0 12px 30px rgba(21, 31, 50, 0.25);
	}

	.glass-button {
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.28);
		background: rgba(28, 43, 68, 0.45);
		backdrop-filter: blur(14px);
	}

	.text-button {
		padding: 12px 10px;
		color: rgba(255, 255, 255, 0.75);
		background: transparent;
	}

	.primary-button:hover,
	.glass-button:hover,
	.text-button:hover,
	.small-action:hover {
		transform: translateY(-2px);
	}

	.primary-button:focus-visible,
	.glass-button:focus-visible,
	.text-button:focus-visible,
	.hotspot:focus-visible,
	.exit-story:focus-visible,
	.dialogue:focus-visible,
	.choices button:focus-visible,
	.character-hotspot:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 4px;
	}

	.title-footnote {
		position: absolute;
		z-index: 3;
		left: clamp(28px, 8vw, 136px);
		bottom: max(24px, env(safe-area-inset-bottom));
		margin: 0;
		font-size: 11px;
		letter-spacing: 0.13em;
		color: rgba(255, 255, 255, 0.48);
	}

	.fireflies span {
		position: absolute;
		z-index: 2;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #f7d88d;
		box-shadow: 0 0 14px 5px rgba(232, 190, 114, 0.55);
		animation: drift 5s ease-in-out infinite alternate;
	}

	.fireflies span:nth-child(1) { left: 46%; top: 38%; animation-delay: -1s; }
	.fireflies span:nth-child(2) { left: 57%; top: 29%; animation-delay: -3s; }
	.fireflies span:nth-child(3) { left: 65%; top: 46%; animation-delay: -2s; }
	.fireflies span:nth-child(4) { left: 73%; top: 34%; animation-delay: -4s; }
	.fireflies span:nth-child(5) { left: 51%; top: 54%; animation-delay: -2.5s; }
	.fireflies span:nth-child(6) { left: 81%; top: 56%; animation-delay: -0.5s; }

	.story-shade {
		background: linear-gradient(180deg, rgba(20, 31, 51, 0.05), rgba(20, 31, 51, 0.02) 48%, rgba(17, 26, 46, 0.62));
	}

	.story-character {
		position: absolute;
		z-index: 2;
		right: clamp(2%, 7vw, 11%);
		bottom: -8vh;
		height: min(96vh, 980px);
		max-width: 58vw;
		object-fit: contain;
		filter: drop-shadow(0 24px 36px rgba(48, 45, 40, 0.3));
		animation: character-in 500ms ease-out both;
	}

	.exit-story {
		position: absolute;
		z-index: 6;
		top: max(22px, env(safe-area-inset-top));
		right: 28px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 9px 8px 15px;
		border: 1px solid rgba(255, 255, 255, 0.24);
		border-radius: 999px;
		color: rgba(255, 255, 255, 0.84);
		background: rgba(22, 34, 55, 0.48);
		backdrop-filter: blur(14px);
		cursor: pointer;
	}

	.exit-story b {
		display: grid;
		place-items: center;
		width: 25px;
		height: 25px;
		border-radius: 50%;
		font-size: 18px;
		font-weight: 400;
		background: rgba(255, 255, 255, 0.13);
	}

	.story-ui {
		position: absolute;
		z-index: 5;
		left: 50%;
		bottom: max(24px, env(safe-area-inset-bottom));
		width: min(1050px, calc(100vw - 64px));
		transform: translateX(-50%);
	}

	.dialogue {
		position: relative;
		display: block;
		width: 100%;
		min-height: 154px;
		padding: 38px 58px 30px;
		border: 1px solid rgba(255, 255, 255, 0.24);
		border-radius: 22px;
		text-align: left;
		color: white;
		background: linear-gradient(135deg, rgba(23, 35, 61, 0.93), rgba(64, 84, 113, 0.86));
		box-shadow: 0 22px 70px rgba(17, 26, 46, 0.4), inset 0 1px rgba(255, 255, 255, 0.16);
		backdrop-filter: blur(24px) saturate(1.2);
		cursor: pointer;
	}

	.dialogue:disabled {
		cursor: default;
	}

	.speaker {
		position: absolute;
		left: 34px;
		top: -18px;
		min-width: 116px;
		padding: 9px 20px;
		border: 1px solid rgba(255, 255, 255, 0.32);
		border-radius: 999px;
		font-size: 14px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-align: center;
		color: #2c3a50;
		background: linear-gradient(135deg, #fffaf2, #ead8b3);
		box-shadow: 0 8px 24px rgba(31, 40, 58, 0.26);
	}

	.dialogue-text {
		display: block;
		font-size: clamp(16px, 1.55vw, 20px);
		line-height: 1.9;
		letter-spacing: 0.035em;
		animation: line-in 260ms ease both;
	}

	.next-mark {
		position: absolute;
		right: 28px;
		bottom: 17px;
		font-size: 25px;
		color: #f4d596;
		animation: next-bounce 800ms ease-in-out infinite alternate;
	}

	.story-progress {
		display: flex;
		justify-content: space-between;
		padding: 9px 12px 0;
		font-size: 10px;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.5);
	}

	.choices {
		display: grid;
		gap: 10px;
		width: min(620px, 80%);
		margin: 0 0 22px auto;
	}

	.choices button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 50px;
		padding: 0 20px 0 24px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 14px;
		text-align: left;
		color: white;
		background: rgba(28, 43, 68, 0.86);
		box-shadow: 0 12px 32px rgba(17, 26, 46, 0.25);
		backdrop-filter: blur(15px);
		cursor: pointer;
		transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
	}

	.choices button:hover {
		transform: translateX(-8px);
		border-color: rgba(240, 211, 152, 0.78);
		background: rgba(76, 99, 131, 0.94);
	}

	.choices button span {
		font-size: 26px;
		color: #f4d596;
	}

	.modal-backdrop {
		position: absolute;
		z-index: 20;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 24px;
		background: rgba(17, 26, 46, 0.56);
		backdrop-filter: blur(12px);
		animation: fade-in 180ms ease both;
	}

	.confirm-card,
	.object-card {
		position: relative;
		width: min(500px, 100%);
		padding: 38px;
		border: 1px solid rgba(255, 255, 255, 0.22);
		border-radius: 26px;
		background: linear-gradient(145deg, rgba(37, 53, 80, 0.97), rgba(19, 31, 52, 0.96));
		box-shadow: 0 30px 100px rgba(11, 18, 32, 0.48), inset 0 1px rgba(255, 255, 255, 0.13);
		animation: card-in 260ms ease-out both;
	}

	.confirm-card h2,
	.object-card h2 {
		margin: 0 0 13px;
		font-family: Georgia, "Songti SC", serif;
		font-size: clamp(28px, 5vw, 42px);
		font-weight: 500;
	}

	.confirm-card > p:not(.panel-kicker),
	.panel-description {
		margin: 0 0 27px;
		font-size: 15px;
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.7);
	}

	.transition-scene {
		display: grid;
		place-items: center;
		background: radial-gradient(circle at center, #667f9f, #17233d 66%);
	}

	.transition-scene p {
		position: relative;
		z-index: 2;
		margin: 0;
		font-family: Georgia, "Songti SC", serif;
		font-size: clamp(17px, 2vw, 24px);
		letter-spacing: 0.13em;
		color: rgba(255, 255, 255, 0.85);
		animation: transition-text 1.25s ease both;
	}

	.transition-orb {
		position: absolute;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #f6d994;
		box-shadow: 0 0 60px 24px rgba(232, 190, 114, 0.3);
		animation: transition-orb 1.3s ease-in-out both;
	}

	.world-shade {
		background: linear-gradient(180deg, rgba(17, 26, 46, 0.36), transparent 24%, transparent 72%, rgba(17, 26, 46, 0.42));
	}

	.world-header {
		position: absolute;
		z-index: 8;
		top: max(24px, env(safe-area-inset-top));
		left: clamp(24px, 4vw, 64px);
		right: clamp(24px, 4vw, 64px);
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		pointer-events: none;
	}

	.world-header h1 {
		margin: 0;
		font-family: Georgia, "Songti SC", serif;
		font-size: clamp(25px, 3vw, 42px);
		font-weight: 500;
		text-shadow: 0 4px 22px rgba(9, 7, 26, 0.54);
	}

	.world-header nav {
		display: flex;
		gap: 9px;
		pointer-events: auto;
	}

	.world-header nav a,
	.world-header nav button {
		padding: 10px 16px;
		border: 1px solid rgba(255, 255, 255, 0.23);
		border-radius: 999px;
		color: white;
		text-decoration: none;
		background: rgba(27, 41, 65, 0.46);
		backdrop-filter: blur(13px);
		cursor: pointer;
	}

	.hotspots {
		position: absolute;
		z-index: 4;
		inset: 0;
	}

	.hotspot {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--w);
		height: var(--h);
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
	}

	.hotspot-dot {
		position: absolute;
		left: 50%;
		top: 50%;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 1px solid rgba(255, 255, 255, 0.68);
		border-radius: 50%;
		font-size: 14px;
		color: #fffce0;
		background: rgba(43, 61, 88, 0.54);
		box-shadow: 0 0 0 7px rgba(255, 255, 255, 0.09), 0 0 25px 8px rgba(232, 190, 114, 0.24);
		backdrop-filter: blur(7px);
		transform: translate(-50%, -50%);
		animation: hotspot-pulse 1.8s ease-in-out infinite alternate;
		transition: transform 180ms ease, background 180ms ease;
	}

	.hotspot-label {
		position: absolute;
		left: 50%;
		top: calc(50% + 28px);
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		white-space: nowrap;
		color: white;
		background: rgba(24, 37, 60, 0.78);
		backdrop-filter: blur(8px);
		opacity: 0;
		transform: translate(-50%, 5px);
		transition: opacity 180ms ease, transform 180ms ease;
	}

	.hotspot:hover .hotspot-dot,
	.hotspot:focus-visible .hotspot-dot {
		background: rgba(94, 119, 151, 0.82);
		transform: translate(-50%, -50%) scale(1.13);
	}

	.hotspot:hover .hotspot-label,
	.hotspot:focus-visible .hotspot-label {
		opacity: 1;
		transform: translate(-50%, 0);
	}

	.character-hotspot {
		position: absolute;
		z-index: 5;
		right: 5%;
		bottom: -7vh;
		width: min(31vw, 430px);
		height: min(77vh, 790px);
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
	}

	.world-character {
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: bottom center;
		filter: drop-shadow(0 22px 34px rgba(40, 37, 32, 0.34));
		transition: transform 220ms ease, filter 220ms ease;
	}

	.character-hotspot span {
		position: absolute;
		left: 50%;
		top: 24%;
		padding: 8px 13px;
		border-radius: 999px;
		font-size: 11px;
		white-space: nowrap;
		color: white;
		background: rgba(24, 37, 60, 0.78);
		backdrop-filter: blur(10px);
		opacity: 0;
		transform: translate(-50%, 8px);
		transition: opacity 180ms ease, transform 180ms ease;
	}

	.character-hotspot:hover .world-character {
		filter: drop-shadow(0 24px 42px rgba(232, 190, 114, 0.3));
		transform: translateY(-5px);
	}

	.character-hotspot:hover span,
	.character-hotspot:focus-visible span {
		opacity: 1;
		transform: translate(-50%, 0);
	}

	.explore-hint {
		position: absolute;
		z-index: 8;
		left: 50%;
		bottom: 38px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 16px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 999px;
		font-size: 12px;
		letter-spacing: 0.05em;
		background: rgba(24, 37, 60, 0.68);
		backdrop-filter: blur(14px);
		transform: translateX(-50%);
		animation: hint-in 500ms 1.2s ease both;
	}

	.pulse-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #f5d58c;
		box-shadow: 0 0 12px 4px rgba(232, 190, 114, 0.44);
	}

	.world-footer {
		position: absolute;
		z-index: 3;
		left: clamp(24px, 4vw, 64px);
		right: clamp(24px, 4vw, 64px);
		bottom: max(22px, env(safe-area-inset-bottom));
		display: flex;
		justify-content: space-between;
		font-family: ui-monospace, monospace;
		font-size: 10px;
		letter-spacing: 0.13em;
		color: rgba(255, 255, 255, 0.48);
		pointer-events: none;
	}

	.world-modal {
		z-index: 30;
	}

	.object-card {
		width: min(540px, 100%);
		padding: 42px;
	}

	.close-panel {
		position: absolute;
		top: 18px;
		right: 18px;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 50%;
		font-size: 21px;
		color: rgba(255, 255, 255, 0.74);
		background: rgba(255, 255, 255, 0.06);
		cursor: pointer;
	}

	.panel-actions .primary-button span {
		margin-left: 8px;
	}

	.small-action {
		padding: 10px 15px;
		color: #fff5df;
		background: rgba(255, 255, 255, 0.1);
	}

	.coming-soon {
		display: inline-block;
		padding: 8px 12px;
		border: 1px dashed rgba(255, 255, 255, 0.25);
		border-radius: 9px;
		font-family: ui-monospace, monospace;
		font-size: 11px;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.55);
	}

	@keyframes title-in {
		from { opacity: 0; transform: translateY(calc(-50% + 24px)); }
		to { opacity: 1; transform: translateY(-50%); }
	}

	@keyframes character-in {
		from { opacity: 0; transform: translateX(20px); }
		to { opacity: 1; transform: translateX(0); }
	}

	@keyframes line-in {
		from { opacity: 0; transform: translateY(5px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes next-bounce {
		to { transform: translateY(4px); }
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes card-in {
		from { opacity: 0; transform: translateY(15px) scale(0.98); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	@keyframes drift {
		from { transform: translate(-7px, 4px); opacity: 0.45; }
		to { transform: translate(9px, -10px); opacity: 1; }
	}

	@keyframes transition-text {
		0%, 100% { opacity: 0; }
		30%, 72% { opacity: 1; }
	}

	@keyframes transition-orb {
		0% { opacity: 0; transform: scale(0.2); }
		35% { opacity: 1; }
		100% { opacity: 0; transform: scale(38); }
	}

	@keyframes hotspot-pulse {
		to { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0.05), 0 0 32px 11px rgba(232, 190, 114, 0.32); }
	}

	@keyframes hint-in {
		from { opacity: 0; transform: translate(-50%, 10px); }
		to { opacity: 1; transform: translate(-50%, 0); }
	}

	@media (max-width: 720px), (orientation: portrait) {
		.experience,
		.scene,
		.transition-scene {
			min-height: 520px;
		}

		.scene-picture img {
			object-position: center;
		}

		.title-shade {
			background: linear-gradient(180deg, rgba(19, 30, 50, 0.28), rgba(29, 44, 68, 0.1) 43%, rgba(17, 26, 46, 0.74));
		}

		.title-content {
			left: 24px;
			top: auto;
			bottom: max(90px, calc(env(safe-area-inset-bottom) + 68px));
			width: calc(100vw - 48px);
			transform: none;
		}

		.title-content h1 {
			font-size: clamp(48px, 16vw, 72px);
		}

		.subtitle {
			margin: 16px 0 24px;
			line-height: 1.65;
		}

		.title-actions {
			align-items: stretch;
			flex-direction: column;
			width: min(320px, 100%);
		}

		.title-actions .text-button {
			align-self: center;
		}

		.title-footnote {
			left: 24px;
			bottom: max(18px, env(safe-area-inset-bottom));
		}

		.story-character {
			right: -7vw;
			bottom: 18vh;
			height: 66vh;
			max-width: 96vw;
		}

		.exit-story {
			top: max(14px, env(safe-area-inset-top));
			right: 14px;
		}

		.exit-story span {
			display: none;
		}

		.story-ui {
			bottom: max(16px, env(safe-area-inset-bottom));
			width: calc(100vw - 24px);
		}

		.dialogue {
			min-height: 150px;
			padding: 34px 25px 26px;
			border-radius: 18px;
		}

		.speaker {
			left: 18px;
			top: -16px;
			min-width: 96px;
			padding: 8px 15px;
		}

		.dialogue-text {
			font-size: 15px;
			line-height: 1.75;
		}

		.story-progress {
			display: none;
		}

		.choices {
			width: 100%;
			margin-bottom: 17px;
		}

		.choices button {
			min-height: 46px;
			padding-left: 17px;
			font-size: 13px;
		}

		.confirm-card,
		.object-card {
			padding: 32px 25px;
			border-radius: 21px;
		}

		.confirm-actions,
		.panel-actions {
			align-items: stretch;
			flex-direction: column;
		}

		.world-header {
			top: max(17px, env(safe-area-inset-top));
			left: 18px;
			right: 18px;
		}

		.world-header nav a {
			display: none;
		}

		.world-header nav button {
			padding: 9px 12px;
			font-size: 11px;
		}

		.hotspot {
			left: var(--mx);
			top: var(--my);
			width: var(--mw);
			height: var(--mh);
		}

		.hotspot-dot {
			width: 30px;
			height: 30px;
		}

		.hotspot-label {
			opacity: 1;
			transform: translate(-50%, 0);
		}

		.character-hotspot {
			right: -5%;
			bottom: -6vh;
			width: 65vw;
			height: 60vh;
		}

		.explore-hint {
			bottom: max(24px, env(safe-area-inset-bottom));
			width: max-content;
			max-width: calc(100vw - 36px);
			font-size: 11px;
		}

		.world-footer {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation-duration: 1ms !important;
			animation-iteration-count: 1 !important;
			scroll-behavior: auto !important;
		}
	}
</style>
