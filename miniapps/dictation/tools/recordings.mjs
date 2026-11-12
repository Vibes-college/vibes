// SPDX-License-Identifier: AGPL-3.0-only
// 把听写公开版的 86 条录音（prototypes/dictation-try/audio，Kokoro 开源模型在本机合成，所有人听同一条）
// 拷进小程序 public/audio/，再写一张对照表 src/lojo/dictation/recordings.json：题号 → 读的原文、版本号。
// 只收「录的就是现在这句」的：done.json 里记的合成时文字指纹（「+fix1」这种后缀是重录过，比如 pl-tours）要和课程里这道题的 say 一样，不一样的不收（会退回社区的声音）。
// 版本号跟着 mp3 文件本身变（重录一条，手机会重新下载）。改题或重录后在工作区根目录跑：
//   node apps/community/source/miniapps/dictation/tools/recordings.mjs
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(APP, '../../../../..');
const FROM = join(ROOT, 'prototypes/dictation-try/audio');
const { DICTATION } = await import(join(APP, 'src/lojo/route/courses/ielts/dictation.js'));
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 12);
const done = JSON.parse(readFileSync(join(FROM, 'done.json'), 'utf8'));

mkdirSync(join(APP, 'public/audio'), { recursive: true });
const out = {};
let stale = 0;
for (const set of DICTATION.sets) {
	for (const it of set.items) {
		const f = join(FROM, `${it.id}.mp3`);
		if (!existsSync(f) || String(done[it.id] ?? '').split('+')[0] !== hash(it.say)) { stale++; continue; }
		copyFileSync(f, join(APP, 'public/audio', `${it.id}.mp3`));
		out[it.id] = { say: it.say, v: hash(readFileSync(f)) };
	}
}
writeFileSync(join(APP, 'src/lojo/dictation/recordings.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`收了 ${Object.keys(out).length} 条录音，${stale} 道题没有对得上的录音`);
