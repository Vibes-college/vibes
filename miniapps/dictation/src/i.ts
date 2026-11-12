// SPDX-License-Identifier: AGPL-3.0-only
// 社区登录时把账号存在 localStorage 的 account 里（同一个网址，小程序读得到）。没登录就是 null。
import { miLocalStorage } from './local-storage.js';
type Me = { id: string; username: string; token: string; [k: string]: unknown };
export const $i: Me | null = (() => { const a = miLocalStorage.getItemAsJson('account'); return a?.token ? a : null; })();
export const token = (): string | null => $i?.token ?? null;
