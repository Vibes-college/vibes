// SPDX-License-Identifier: AGPL-3.0-only
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	base: '/apps/typing/',
	plugins: [vue()],
	resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
	css: { modules: { generateScopedName: '[local]_[hash:base64:5]' } },
	build: { outDir: 'dist', target: 'es2022', assetsInlineLimit: 0 },
});
