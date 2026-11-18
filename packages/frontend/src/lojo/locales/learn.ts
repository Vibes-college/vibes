/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The profile page's 「学习」 tab (lojo/learn/, 2026-11-17: 「把学习格子和毕业作品放进个人资料页」) and the owner's page to
// hand in graduation works (pages/lojo/learn-manage.vue, /my/learn). What was done on a day, each line of 「我是怎么学的」
// and a work's 「怎么学出来的」 come written from the community backend (packages/backend/src/misc/lojo-learn.ts); they
// are content and are not translated here.
import { pickLang } from './lang.js';

const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const zh = {
	tab: '学习',
	empty: '还没有可以看的学习记录',

	// 能交毕业作品的专业（现在只有雅思）
	majors: {
		ielts: {
			name: '雅思',
			capstone: '一次完整的全真模考成绩单，加一份自己的错题复盘。',
			reflection: '错题复盘',
			reflectionHint: '这次模考错在哪、为什么错、下次怎么避开。写给看页的人。',
			score: '模考成绩单',
			scoreHint: '填了就会放到页上；不想放就空着。',
		},
	} as Record<string, { name: string; capstone: string; reflection: string; reflectionHint: string; score: string; scoreHint: string }>,
	half: (year: number, h: 1 | 2) => `${year} ${h === 1 ? '上半年' : '下半年'}`,

	// 本人看自己
	mePublic: '别人点你的头像，就能在这里看到你的学习格子、毕业作品和「我是怎么学的」。',
	mePrivate: '现在只有你自己看得到这一页。',
	meTakenDown: '这一页被管理员下架了，别人看不到。有疑问找管理员。',
	manage: '交 / 管理毕业作品',
	share: '保存分享图',

	// 本人还没交作品
	startTitle: '还没有毕业作品',
	start: (major: string, capstone: string) => `交一份毕业作品，就会置顶在这里。现在能交的是${major}毕业作品：${capstone}`,
	startButton: (major: string) => `去交${major}毕业作品`,
	startHint: '还没做过全真模考？先去闯关练着，每天学了什么都会记在下面的学习格子里。',
	startHintLink: '去闯关',

	studying: '正在学：',
	graduated: '已毕业：',
	graduatedItem: (major: string, when: string) => `${major}（${when}）`,
	listSep: '、',
	contact: '联系 TA',

	grid: '学习格子',
	gridLabel: '过去一年的学习格子',
	gridHint: '点一下格子，看那天做了什么。',
	gridLearned: (n: number) => `过去一年学了 ${n} 天`,
	gridLess: '少',
	gridMore: '多',
	noRecord: '没有记录',
	month: (m: number) => `${m}月`,
	day: (m: number, d: number) => `${m} 月 ${d} 日`,
	dayTip: (date: string, what: string) => `${date}：${what}`,

	works: '置顶的毕业作品',
	workKind: (major: string, when: string) => `${major} · 毕业作品 · ${when}`,
	open: '看作品',
	close: '收起',
	itemKinds: { link: '链接', video: '视频', file: '文件', image: '图片' } as Record<string, string>,
	before: '之前',
	after: '之后',
	beforeAfter: '做之前和做之后',
	journey: '怎么学出来的',
	journeyNote: '下面由系统按学习记录生成，本人改不了。',
	reflectionFallback: '复盘',
	scoreFallback: '成绩',

	how: '我是怎么学的',

	shareTitle: '分享图',
	shareSave: '长按图片，存到手机相册。',
	shareDownloaded: '已经下载到电脑上了。',
	sharePrivate: '现在别人扫码只看得到空页；想让别人看，先去「交 / 管理毕业作品」里打开公开。',
	shareClose: '关闭',
	shareScan: '扫码看作品',
	shareTitleFallback: (name: string) => `${name} 的学习`,
	shareMajorLine: (major: string, hasWork: boolean) => (hasWork ? `${major} · 毕业作品` : major),

	// 交 / 管理毕业作品（/my/learn）
	m: {
		tabTitle: '「学习」标签',
		tabIntro: '别人点你的头像，资料页第二个标签「学习」就是这里的内容：学习格子、置顶的毕业作品、「我是怎么学的」。',
		seeIt: '回「学习」标签看看',
		isPublic: '公开',
		publicOn: '别人点你的头像就能看到。',
		publicOff: '现在只有你自己看得到。',
		sources: '「我是怎么学的」里的「信息」',
		sourcesHint: '勾上的频道会写在「学习」标签上；一个都不勾就不显示这一行。',
		noChannels: '你在时间线上还没订阅频道。',
		contact: '联系方式',
		contactHint: '填邮箱或链接，「学习」标签上就会有「联系 TA」按钮；空着就不显示。',
		contactPlaceholder: '邮箱或 https:// 链接',
		saveSettings: '保存设置',
		saved: '保存好了',

		workTitle: (major: string) => `${major}毕业作品`,
		handedIn: '已交',
		need: (capstone: string) => `要交的：${capstone}`,
		title: '标题',
		titlePlaceholder: '比如：我的第一次雅思全真模考',
		oneLine: '一句话',
		oneLinePlaceholder: '写给看页的人，一句说清这是什么',
		items: '作品',
		itemsHint: '链接、截图、视频或文件，最多 8 项。',
		itemKind: '类型',
		itemUrl: '链接',
		itemLabel: '一句说明（可不填）',
		upload: '上传',
		uploadImage: '上传图片',
		removeItem: '去掉',
		addItem: '再加一项',
		scoreText: '成绩',
		scoreTextPlaceholder: '比如：模考总分和各项分数',
		image: '图片链接',
		beforeAfterHint: '可不填。比如第一次模考的错题和这次的对比。',
		journeyHint: '「怎么学出来的」（过了哪些关、用了多久）由系统按你的学习记录生成，不用填。',
		submit: '交作品',
		saveWork: '保存修改',
		deleteWork: '删除这份作品',
		deleteConfirm: '删除这份毕业作品？删了就找不回来，「学习」标签里也不再置顶。',
		workSaved: '作品已保存，置顶在「学习」标签里。',
		deleted: '删好了',
		chooseImage: '这里只能放图片。',

		needTitle: '标题和一句话不能空着。',
		needReflection: (label: string) => `${label}不能空着。`,
		emptyWork: '作品里至少要有一项链接、截图或文件，或者写一段复盘。',
		tooLong: (what: string, max: number) => `${what}最多 ${max} 个字。`,
		badLink: '链接要是 http:// 或 https:// 开头的。',
		failed: '没保存上，再试一次。',
	},
};

const en: typeof zh = {
	tab: 'Learning',
	empty: 'No learning record to show yet',

	majors: {
		ielts: {
			name: 'IELTS',
			capstone: 'the score report of one full mock test, plus your own review of what you got wrong.',
			reflection: 'Review of mistakes',
			reflectionHint: 'What went wrong in this mock test, why, and how to avoid it next time. Write it for the people who read your page.',
			score: 'Mock test score report',
			scoreHint: 'Shown on your page if filled in; leave it empty to keep it off.',
		},
	},
	half: (year: number, h: 1 | 2) => `H${h} ${year}`,

	mePublic: 'When people tap your avatar, they see your learning grid, graduation work and "How I learned" here.',
	mePrivate: 'Only you can see this page right now.',
	meTakenDown: 'An admin took this page down, so others can\'t see it. Ask an admin if you have questions.',
	manage: 'Hand in or manage graduation work',
	share: 'Save share image',

	startTitle: 'No graduation work yet',
	start: (major: string, capstone: string) => `Hand in a graduation work and it is pinned here. You can hand in a ${major} graduation work now: ${capstone}`,
	startButton: (major: string) => `Hand in ${major} graduation work`,
	startHint: 'No full mock test yet? Practise in Quests first; what you learn each day goes into the learning grid below.',
	startHintLink: 'Go to Quests',

	studying: 'Studying: ',
	graduated: 'Graduated: ',
	graduatedItem: (major: string, when: string) => `${major} (${when})`,
	listSep: ', ',
	contact: 'Contact',

	grid: 'Learning grid',
	gridLabel: 'Learning grid for the past year',
	gridHint: 'Tap a square to see what was done that day.',
	gridLearned: (n: number) => `Learned on ${n} ${n === 1 ? 'day' : 'days'} in the past year`,
	gridLess: 'Less',
	gridMore: 'More',
	noRecord: 'Nothing recorded',
	month: (m: number) => MONTH_EN[m - 1],
	day: (m: number, d: number) => `${MONTH_EN[m - 1]} ${d}`,
	dayTip: (date: string, what: string) => `${date}: ${what}`,

	works: 'Pinned graduation work',
	workKind: (major: string, when: string) => `${major} · Graduation work · ${when}`,
	open: 'View work',
	close: 'Collapse',
	itemKinds: { link: 'Link', video: 'Video', file: 'File', image: 'Image' },
	before: 'Before',
	after: 'After',
	beforeAfter: 'Before and after',
	journey: 'How it was learned',
	journeyNote: 'Written by the system from the learning record; the owner can\'t change it.',
	reflectionFallback: 'Review',
	scoreFallback: 'Score',

	how: 'How I learned',

	shareTitle: 'Share image',
	shareSave: 'Press and hold the image to save it to your photos.',
	shareDownloaded: 'It has been downloaded to your computer.',
	sharePrivate: 'Right now, scanning the code shows an empty page. To let others see it, make it public in "Hand in or manage graduation work".',
	shareClose: 'Close',
	shareScan: 'Scan to see the work',
	shareTitleFallback: (name: string) => `${name}'s learning`,
	shareMajorLine: (major: string, hasWork: boolean) => (hasWork ? `${major} · Graduation work` : major),

	m: {
		tabTitle: 'The "Learning" tab',
		tabIntro: 'When people tap your avatar, the second tab of your profile, "Learning", shows this: your learning grid, pinned graduation work and "How I learned".',
		seeIt: 'See the "Learning" tab',
		isPublic: 'Public',
		publicOn: 'Anyone who taps your avatar can see it.',
		publicOff: 'Only you can see it right now.',
		sources: '"Sources" in "How I learned"',
		sourcesHint: 'The channels you tick are listed on your "Learning" tab. Tick none to leave the line out.',
		noChannels: 'You don\'t follow any channel on the timeline yet.',
		contact: 'Contact',
		contactHint: 'An email or a link puts a "Contact" button on your "Learning" tab. Leave it empty for no button.',
		contactPlaceholder: 'Email or https:// link',
		saveSettings: 'Save settings',
		saved: 'Saved',

		workTitle: (major: string) => `${major} graduation work`,
		handedIn: 'Handed in',
		need: (capstone: string) => `What to hand in: ${capstone}`,
		title: 'Title',
		titlePlaceholder: 'For example: My first full IELTS mock test',
		oneLine: 'One line',
		oneLinePlaceholder: 'Say in one line what this is, for the people who read your page',
		items: 'Work',
		itemsHint: 'Links, screenshots, videos or files, up to 8.',
		itemKind: 'Type',
		itemUrl: 'Link',
		itemLabel: 'A short note (optional)',
		upload: 'Upload',
		uploadImage: 'Upload image',
		removeItem: 'Remove',
		addItem: 'Add another',
		scoreText: 'Score',
		scoreTextPlaceholder: 'For example: overall band and each part',
		image: 'Image link',
		beforeAfterHint: 'Optional. For example, the mistakes of your first mock test next to this one.',
		journeyHint: '"How it was learned" (levels passed, time taken) is written by the system from your learning record. Nothing to fill in.',
		submit: 'Hand in',
		saveWork: 'Save changes',
		deleteWork: 'Delete this work',
		deleteConfirm: 'Delete this graduation work? It can\'t be brought back, and it won\'t be pinned on your "Learning" tab any more.',
		workSaved: 'Saved. It is pinned on your "Learning" tab.',
		deleted: 'Deleted',
		chooseImage: 'Only images can go here.',

		needTitle: 'The title and the one line can\'t be empty.',
		needReflection: (label: string) => `${label} can't be empty.`,
		emptyWork: 'A work needs at least one link, screenshot or file, or a written review.',
		tooLong: (what: string, max: number) => `${what}: ${max} characters at most.`,
		badLink: 'Links must start with http:// or https://.',
		failed: 'Not saved. Try again.',
	},
};

export const learnTable = { zh, en };
export const learnText = pickLang(learnTable);

/** The tab on the profile page: second, between 「概览」 and 「帖子」 (pages/user/index.vue). */
export const learnTab = { key: 'learn', title: learnText.tab, icon: 'ti ti-school' };
