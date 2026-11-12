// SPDX-License-Identifier: AGPL-3.0-only
// 把页面里用到的 Tabler 图标（<i class="ti ti-xxx">）做成 src/icons.css：每个图标一段内嵌 SVG 遮罩，不用下载整套字体。
import fs from 'node:fs';
import path from 'node:path';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, '../src');
const DIR = path.join(HERE, '../node_modules/@tabler/icons/icons/outline');
const names = new Set();
const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(vue|ts)$/.test(f.name)) for (const m of fs.readFileSync(p, 'utf8').matchAll(/\bti-([a-z0-9-]+)/g)) names.add(m[1]); } };
walk(SRC);
let css = '/* 由 tools/icons.mjs 生成，别手改。图标来自 Tabler Icons（MIT 许可，Copyright (c) 2020-2024 Paweł Kuna，https://tabler.io/icons） */\n.ti{display:inline-block;width:1em;height:1em;vertical-align:-0.125em;background:currentColor;-webkit-mask:var(--i) center/contain no-repeat;mask:var(--i) center/contain no-repeat;font-style:normal}\n';
for (const n of [...names].sort()) {
	// ti-xxx-filled 是 Tabler 的实心版（icons/filled/xxx.svg），和社区的写法一样。
	const f = n.endsWith('-filled') ? path.join(DIR, '../filled', `${n.slice(0, -7)}.svg`) : path.join(DIR, `${n}.svg`);
	if (!fs.existsSync(f)) { console.warn('no icon', n); continue; }
	const svg = fs.readFileSync(f, 'utf8').replace(/<!--.*?-->/gs, '').replace(/\s+/g, ' ').replace(/stroke-width="2"/, 'stroke-width="2"').trim();
	css += `.ti-${n}{--i:url("data:image/svg+xml,${encodeURIComponent(svg)}")}\n`;
}
css += '@keyframes ti-spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:ti-spin 1s linear infinite}\n';
fs.writeFileSync(path.join(SRC, 'icons.css'), css);
console.log(`icons.css: ${names.size} icons`);
