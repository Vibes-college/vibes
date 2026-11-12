// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 页面里写上版本号（<meta name="vibes-version">）：上线、退回以后一眼看得出门口在发哪一版
const version = readFileSync(new URL('./VERSION', import.meta.url), 'utf8').trim();

export default defineConfig({
	base: '/apps/grammar/',
	plugins: [vue(), { name: 'vibes-version', transformIndexHtml: html => html.replace('</head>', `<meta name="vibes-version" content="${version}">\n</head>`) }],
	resolve: { alias: { '@@': fileURLToPath(new URL('./src/shared', import.meta.url)), '@': fileURLToPath(new URL('./src', import.meta.url)) } },
	css: { modules: { generateScopedName: '[local]_[hash:base64:5]' } },
	build: { outDir: 'dist', target: 'es2022', assetsInlineLimit: 0 },
});
