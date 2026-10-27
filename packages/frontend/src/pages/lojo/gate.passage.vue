<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- A reading passage: its title, paragraphs (with their letters and headings, tables written with " | "), figures and
the glossary at the end. After handing in, the paragraphs that hold answers are marked with their question numbers. -->
<template>
<article :class="$style.root">
	<header lang="en">
		<h2 :class="$style.title">{{ passage.title }}</h2>
		<p v-if="passage.subtitle" :class="$style.subtitle">{{ passage.subtitle }}</p>
	</header>
	<template v-for="(par, i) in passage.paragraphs" :key="i">
		<figure v-if="par.image" :class="$style.figure">
			<img :src="par.image" :alt="par.caption ?? gateLabels.figureAlt" draggable="false">
			<figcaption v-if="par.caption" lang="en">{{ par.caption }}</figcaption>
		</figure>
		<section v-else :class="[$style.par, { [$style.hit]: review && par.answers.length > 0 }]">
			<b v-if="par.label" :class="$style.label" lang="en">{{ par.label }}</b>
			<div :class="$style.body" lang="en">
				<h3 v-if="par.heading" :class="$style.heading">{{ par.heading }}</h3>
				<template v-for="(block, bi) in paragraphBlocks(par.text ?? '')" :key="bi">
					<p v-if="block.kind === 'line'" :class="$style.line">{{ segText(block.segments) }}</p>
					<div v-else :class="$style.tableWrap">
						<table :class="$style.table">
							<thead v-if="block.head">
								<tr><th v-for="(cell, ci) in block.head" :key="ci">{{ segText(cell) }}</th></tr>
							</thead>
							<tbody>
								<tr v-for="(row, ri) in block.rows" :key="ri"><td v-for="(cell, ci) in row" :key="ci">{{ segText(cell) }}</td></tr>
							</tbody>
						</table>
					</div>
				</template>
				<p v-if="review && par.answers.length > 0" :class="$style.chips" :lang="gateLang">
					<span v-for="n in par.answers" :key="n" :class="$style.qchip">{{ gateLabels.answerChip(n) }}</span>
				</p>
			</div>
		</section>
	</template>
	<section v-if="passage.glossary.length > 0" :class="$style.glossary" lang="en">
		<h3 :class="$style.heading">{{ gateLabels.glossary }}</h3>
		<dl>
			<template v-for="entry in passage.glossary" :key="entry.word">
				<dt>{{ entry.word }}</dt>
				<dd>{{ entry.meaning }}</dd>
			</template>
		</dl>
	</section>
</article>
</template>

<script lang="ts" setup>
import { gateLabels, gateLang } from '@/lojo/gates/labels.js';
import { paragraphBlocks } from '@/lojo/gates/player.js';
import type { FormSegment, GatePassage } from '@/lojo/gates/player.js';

defineProps<{
	passage: GatePassage;
	// after handing in: mark where the answers are
	review?: boolean;
}>();

// A passage has no gaps; should one slip in, it reads as a blank line.
const segText = (segments: FormSegment[]) => segments.map(seg => (seg.type === 'text' ? seg.text : '____')).join('');
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 18px 18px 20px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	line-height: 1.75;
}

.title {
	margin: 0;
	font-size: 1.3em;
	line-height: 1.35;
}

.subtitle {
	margin: 4px 0 0;
	font-style: italic;
	opacity: 0.8;
}

.par {
	display: flex;
	gap: 10px;

	&.hit {
		margin: 0 -8px;
		padding: 4px 8px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--MI_THEME-warn) 14%, transparent);
	}
}

.label {
	flex-shrink: 0;
	width: 1.5em;
	font-size: 1.05em;
	color: var(--MI_THEME-accent);
}

.body {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	flex: 1;
}

.heading {
	margin: 0;
	font-size: 1em;
}

.line {
	margin: 0;
	overflow-wrap: anywhere;
}

.tableWrap {
	overflow-x: auto;
}

.table {
	border-collapse: collapse;
	min-width: 100%;
	line-height: 1.6;

	th, td {
		padding: 6px 8px;
		border: 1px solid var(--MI_THEME-divider);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 0.9em;
		background: var(--MI_THEME-panelHighlight);
	}
}

.figure {
	margin: 0;

	img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--MI_THEME-divider);
		border-radius: var(--MI-radius);
		user-select: none;
	}

	figcaption {
		margin-top: 4px;
		font-size: 0.85em;
		opacity: 0.75;
	}
}

.chips {
	margin: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}

.qchip {
	padding: 0 8px;
	border-radius: 999px;
	font-size: 0.75em;
	font-weight: bold;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
}

.glossary {
	margin-top: 6px;
	padding-top: 12px;
	border-top: 1px solid var(--MI_THEME-divider);
	font-size: 0.9em;

	dl {
		margin: 6px 0 0;
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 4px 12px;
	}

	dt {
		font-weight: bold;
	}

	dd {
		margin: 0;
	}
}
</style>
