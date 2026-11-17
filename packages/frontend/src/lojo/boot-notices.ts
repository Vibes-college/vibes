/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 开机时要不要弹的提示。boot/main-boot.ts 只在弹之前问这里一句，上游原文件不多改（以后跟上游合并省事）。

// Misskey 升级后，登录的人第一次打开会弹英文的「Misskey has been updated!」（components/MkUpdated.vue），
// 里面「What's new」链到 Misskey 的更新记录。Vibes 不弹：学员不知道 Misskey 是什么，弹窗是英文，更新记录也跟学员
// 无关（创始人 2026-11-16 21:54 PT：「直接关掉就好了」）。哪天要换成我们自己的「更新了什么」，改这里。
export function showsMisskeyUpdatedPopup(): boolean {
	return false;
}
