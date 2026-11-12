// SPDX-License-Identifier: AGPL-3.0-only
// 社区路由的小替身。小程序只有一页；去社区别的页面（闯关、生词本、别的小程序）就是整页跳过去。
// getCurrentFullPath 返回「/vocab/5.2?…」的样子（社区里的旧地址），好让从社区抄来的代码照旧解析 ?from=quest。
export const APP_BASE = import.meta.env.BASE_URL; // '/apps/vocab/'
const NAME = APP_BASE.replace(/^\/apps\/|\/$/g, '');
const router = {
	getCurrentFullPath: () => `/${NAME}/${location.pathname.slice(APP_BASE.length)}${location.search}${location.hash}`,
	pushByPath: (path: string) => { location.assign(path); },
	push: (path: string) => { location.assign(path); },
	replace: (path: string) => { location.replace(path); },
};
export const useRouter = () => router;
export const mainRouter = router;
