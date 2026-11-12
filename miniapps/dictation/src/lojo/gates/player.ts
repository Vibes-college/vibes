// SPDX-License-Identifier: AGPL-3.0-only
// 闯关结果带过来的错题用到的两个类型（社区 lojo/gates/player.ts 里从接口类型推出来的，这里照着写死）。
export type GateLimit = { words: number; number: boolean };
export type GateReason = 'blank' | 'word-limit' | 'wrong';
