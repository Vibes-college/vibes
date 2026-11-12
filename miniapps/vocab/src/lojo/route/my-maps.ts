// SPDX-License-Identifier: AGPL-3.0-only
// 社区线路图的地址（闯关结果卡上「回地图」用）。和社区 lojo/route/my-maps.ts 一样：默认课程是 /map。
const DEFAULT_COURSE = 'ielts';
export const coursePath = (id: string): string => id === DEFAULT_COURSE ? '/map' : `/map/${id}`;
