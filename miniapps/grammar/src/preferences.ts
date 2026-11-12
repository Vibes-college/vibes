// SPDX-License-Identifier: AGPL-3.0-only
// 社区设置的小替身：语法页只读「要不要动画」。社区的设置存在社区自己那边，小程序拿不到，所以照社区的默认值（开），
// 系统里关了动效（prefers-reduced-motion）的照旧不动。
export const prefer = { s: { animation: true } };
