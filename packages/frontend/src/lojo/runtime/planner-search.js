/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global fetch:readonly */
// Call only after an explicit search submission, never from an input event.
// Pass the user's place query (and optional destination), not personal notes.
export async function searchPlaces(query, { signal } = {}) {
 const value = typeof query === 'string' ? query.trim().replace(/\s+/gu, ' ') : '';
 if ([...value].length < 2 || [...value].length > 120) throw new Error('地点名称需为 2–120 个字');
 let response;
 try {response = await fetch(`/lojo-places?q=${encodeURIComponent(value)}`, { method: 'GET', signal, credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } });} catch(error) {if (error.name === 'AbortError') throw error; throw new Error('无法连接地点搜索，请重试');}
 let result; try {result = await response.json();} catch(error) {if (error.name === 'AbortError') throw error; throw new Error('地点搜索暂时不可用，请稍后重试');}
 if (!response.ok) {const error = new Error(result.error || '地点搜索暂时不可用，请稍后重试'); error.code = result.code; error.status = response.status; throw error;}
 if (!Array.isArray(result.places) || typeof result.attribution !== 'string') throw new Error('地点搜索返回了无效结果');
 return result;
}
