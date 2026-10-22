/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { guideCategories as sharedCategories, legacyGuideCategories } from '@/lojo/guides/types.js';

// LOJO product copy is separate from upstream Crowdin translations.
export const guideLabels = {
	title: '攻略',
	featured: '精选',
	categories: '书架',
	saved: '收藏',
	write: '写攻略',
	edit: '编辑攻略',
	mine: '我的攻略',
	all: '全部',
	search: '搜索攻略',
	empty: '还没有攻略',
	emptySaved: '还没有收藏的攻略',
	emptySearch: '没有找到相关攻略',
	loadFailed: '攻略暂时无法加载',
	saveFailed: '未能保存，请重试。',
	saveConflict: '攻略已在其他地方更新。请保留当前内容，重新打开后再编辑。',
	bookmarkFailed: '收藏未能更新，请重试。',
	bookmark: '收藏攻略',
	unbookmark: '取消收藏',
	untitled: '未命名攻略',
	draft: '草稿',
	demo: '示例',
	articleTitle: '标题',
	summary: '摘要',
	category: '分类',
	city: '适用城市',
	cover: '封面',
	addCover: '添加封面',
	changeCover: '更换封面',
	removeCover: '移除封面',
	chooseImage: '请选择图片文件。',
	chooseMedia: '请选择对应类型的媒体文件。',
	addBlock: '添加内容',
	moveUp: '上移',
	moveDown: '下移',
	removeBlock: '删除这段内容',
	heading: '标题',
	paragraph: '正文',
	image: '图片',
	video: '视频',
	audio: '音频',
	checklist: '清单',
	resource: '资源卡',
	headingLevel: '标题级别',
	heading2: '章节标题',
	heading3: '小节标题',
	mediaUrl: '媒体链接',
	caption: '说明',
	uploadMedia: '选择文件',
	checklistItems: '清单内容',
	checklistPlaceholder: '每行一项',
	resourceKind: '资源类型',
	resourceTitle: '名称',
	resourceDescription: '介绍',
	resourceUrl: '链接',
	resourceMeta: '费用 / 适用范围',
	tool: '工具',
	service: '服务',
	map: '地图',
	guide: '攻略',
	saveDraft: '保存草稿',
	saveChanges: '保存修改',
	publish: '发布',
	draftSaved: '草稿已保存',
	published: '已发布',
	changesSaved: '修改已保存',
	unsaved: '未保存',
	savedStatus: '已保存',
	titleRequired: '请填写标题。',
	titleTooLong: '标题最多 160 字。',
	summaryTooLong: '摘要最多 600 字。',
	cityTooLong: '适用城市最多 80 字。',
	contentTooLong: '这段内容过长，请拆分后再保存。',
	tooManyBlocks: '一篇攻略最多添加 200 段内容。',
	bodyRequired: '请添加正文内容。',
	invalidUrl: '请使用有效的 http 或 https 链接。',
	invalidResource: '请补全资源名称和链接。',
	leaving: '有尚未保存的修改，仍要离开吗？',
	restoreDraft: '发现尚未保存的编辑，要恢复并继续吗？',
	backupFailed: '本机无法保留未保存的修改，请先保存草稿再离开。',
	accountChanged: '账号已切换，请重新打开攻略后继续。',
	notAuthor: '只有作者可以编辑这篇攻略。',
	backToGuides: '返回攻略',
} as const;

export const guideCategories = sharedCategories.map(item => ({ value: item.id, label: item.title, icon: item.icon }));

export function guideCategoryLabel(category: string): string {
	return [...sharedCategories, ...legacyGuideCategories].find(item => item.id === category)?.title ?? category;
}

export function guideSafeUrl(value: string | undefined | null): string | undefined {
	if (!value || !/^(?:https?:\/\/|\/(?!\/))/i.test(value)) return undefined;
	try {
		const parsed = new URL(value, window.location.origin);
		return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : undefined;
	} catch {
		return undefined;
	}
}
