<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 发到我的电脑: the agent's answer, which is usually Markdown. Only headings, lists, code and bold are drawn, and only
as text nodes (no v-html): it comes from outside and may contain anything. -->
<template>
<div :class="$style.root">
	<template v-for="(b, i) in blocks" :key="i">
		<pre v-if="b.type === 'code'" :class="$style.code">{{ b.text }}</pre>
		<div v-else :class="[$style.line, $style[b.type]]">
			<template v-for="(s, j) in b.spans" :key="j">
				<code v-if="s.code" :class="$style.inline">{{ s.text }}</code>
				<b v-else-if="s.bold">{{ s.text }}</b>
				<template v-else>{{ s.text }}</template>
			</template>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{ text: string }>();

type Span = { text: string; code?: boolean; bold?: boolean };
type Block = { type: 'code'; text: string } | { type: 'p' | 'h' | 'li' | 'gap'; spans: Span[] };

function spans(line: string): Span[] {
	const out: Span[] = [];
	const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
	let at = 0;
	for (let m = re.exec(line); m != null; m = re.exec(line)) {
		if (m.index > at) out.push({ text: line.slice(at, m.index) });
		out.push(m[1] != null ? { text: m[1], code: true } : { text: m[2], bold: true });
		at = m.index + m[0].length;
	}
	if (at < line.length) out.push({ text: line.slice(at) });
	return out;
}

const blocks = computed<Block[]>(() => {
	const out: Block[] = [];
	let code: string[] | null = null;
	for (const raw of props.text.replace(/\r\n/g, '\n').split('\n')) {
		if (/^\s*```/.test(raw)) {
			if (code) {
				out.push({ type: 'code', text: code.join('\n') });
				code = null;
			} else {
				code = [];
			}
			continue;
		}
		if (code) {
			code.push(raw);
			continue;
		}
		const line = raw.trimEnd();
		if (line.trim() === '') {
			if (out.length > 0 && !(out[out.length - 1].type === 'gap')) out.push({ type: 'gap', spans: [] });
			continue;
		}
		const h = /^#{1,6}\s+(.*)$/.exec(line);
		if (h) {
			out.push({ type: 'h', spans: spans(h[1]) });
			continue;
		}
		const li = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
		if (li) {
			const n = /^\s*(\d+)[.)]/.exec(line);
			out.push({ type: 'li', spans: [{ text: n ? `${n[1]}. ` : '• ' }, ...spans(li[1])] });
			continue;
		}
		out.push({ type: 'p', spans: spans(line) });
	}
	if (code) out.push({ type: 'code', text: code.join('\n') });
	return out;
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	line-height: 1.6;
	word-break: break-word;
}

.h {
	font-weight: bold;
	margin-top: 2px;
}

.li {
	padding-left: 1.1em;
	text-indent: -1.1em;
}

.gap {
	height: 0.5em;
}

.code {
	margin: 4px 0;
	padding: 8px 10px;
	border-radius: 8px;
	background: var(--MI_THEME-bg);
	font-size: 0.9em;
	white-space: pre-wrap;
	overflow-x: auto;
}

.inline {
	padding: 0 4px;
	border-radius: 4px;
	background: var(--MI_THEME-bg);
	font-size: 0.92em;
}
</style>
