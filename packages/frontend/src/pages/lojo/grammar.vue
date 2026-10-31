<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 6 号线 · 语法 (/grammar/6.2): one stop's lesson, read before its gate (/gate/ielts/6.2). Five short parts with marked
example sentences, each of which can be read aloud; the common mistakes; a tip for writing; then the gate, and the
stops before and after along the line. ?section=s3 opens it at that part with the focus on its heading: the gate's
result links here by the tags of the questions missed. Content: courses/english/ielts/grammar.js in the Vibes
workspace, read by lojo/grammar/content.ts. -->
<template>
<div ref="rootEl" :class="$style.root" :style="{ '--gl-c': content.color }" :data-grammar="stop?.id ?? ''">
	<MkPageHeader :canOmitTitle="false"/>
	<div :class="$style.body">
		<div v-if="stop == null || lesson == null" :class="$style.notice" role="alert">
			<p>{{ L.missing }}</p>
			<MkA :to="mapPath" class="_link">{{ L.backToMap }}</MkA>
		</div>
		<template v-else>
			<MkA :to="mapPath" :class="$style.back"><i class="ti ti-arrow-left" aria-hidden="true"></i>{{ L.toMap }}</MkA>

			<article :class="$style.paper" :aria-labelledby="`${uid}-title`">
				<header :class="$style.head" data-head>
					<p :class="$style.eyebrow">
						<span :class="$style.lineTag" data-line-tag>{{ L.lineTag(content.line, content.name[grammarLang]) }}</span>
						<span>{{ L.eyebrow(band) }}</span>
					</p>
					<h1 :id="`${uid}-title`" :class="$style.title">{{ stop.title }}</h1>
					<p v-if="stop.sub" :class="$style.sub">{{ stop.sub }}</p>
					<p v-if="lesson.lede.length > 0" :class="$style.lede"><template v-for="(part, k) in lesson.lede" :key="k"><span v-if="part.en" lang="en" :class="$style.en">{{ part.text }}</span><template v-else>{{ part.text }}</template></template></p>
					<p :class="$style.meta">{{ L.meta(lesson.sections.length, lesson.minutes) }} · {{ L.level }}</p>
					<MkA :to="gateTo" :class="$style.cta" data-gate><i class="ti ti-flag" aria-hidden="true"></i>{{ L.toGate }}<i class="ti ti-arrow-right" aria-hidden="true"></i></MkA>
				</header>

				<nav :class="$style.toc" :aria-label="L.toc">
					<button v-for="(sec, i) in lesson.sections" :key="sec.id" type="button" class="_button" :class="$style.chip" :data-toc="sec.id" @click="jumpTo(sec.id, true)">
						<span :class="$style.num">{{ i + 1 }}</span>{{ sec.h }}
					</button>
				</nav>

				<section v-if="lesson.keys.length > 0" :class="$style.legend" :aria-labelledby="`${uid}-legend`" data-legend>
					<h2 :id="`${uid}-legend`" :class="$style.legendTitle">{{ L.legendTitle }}</h2>
					<ul :class="$style.keys">
						<li v-for="k in lesson.keys" :key="k" :class="$style.key" :data-key="k">
							<span :class="[$style.sw, $style[`sw_${k}`]]" aria-hidden="true"></span><b>{{ L.marks[k] }}</b><span :class="$style.sr">{{ L.legendSep }}</span><span>{{ L.markStyles[k] }}</span>
						</li>
					</ul>
					<p :class="$style.legendNote">
						<template v-if="lesson.keys.some(k => k !== 'c')">{{ L.legendMarks }}</template><template v-if="lesson.keys.includes('c')">{{ L.legendClause }}</template>
					</p>
					<p v-if="speech" :class="$style.legendNote"><i class="ti ti-volume" aria-hidden="true"></i> {{ L.sayHint }}</p>
				</section>

				<template v-for="(sec, i) in lesson.sections" :key="sec.id">
					<section :class="$style.section" :aria-labelledby="`${uid}-${sec.id}`" :data-section="sec.id">
						<h2 :id="`${uid}-${sec.id}`" tabindex="-1" :class="$style.h2"><span :class="$style.num">{{ i + 1 }}</span>{{ sec.h }}</h2>
						<template v-for="(b, j) in sec.blocks" :key="j">
							<p v-if="b.kind === 'p'" :class="$style.p"><template v-for="(part, k) in b.parts" :key="k"><span v-if="part.en" lang="en" :class="$style.en">{{ part.text }}</span><template v-else>{{ part.text }}</template></template></p>
							<XExample v-else-if="b.kind === 'ex'" :example="b" :sayKey="`${stop.id}/${sec.id}/${j}`" :speech="speech"/>
							<div v-else :class="$style.tableWrap">
								<table :class="$style.table">
									<thead>
										<tr><th v-for="(h, c) in b.head ?? L.tableHead" :key="c" scope="col">{{ h }}</th></tr>
									</thead>
									<tbody>
										<tr v-for="(row, r) in b.rows" :key="r">
											<td v-for="(cell, c) in row" :key="c" :lang="isEnglish(cell) ? 'en' : undefined">{{ cell }}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</template>
					</section>

					<aside v-if="sec.id === lesson.mistakesAfter && lesson.mistakes.length > 0" :class="$style.mistakes" :aria-labelledby="`${uid}-mistakes`" data-mistakes>
						<h2 :id="`${uid}-mistakes`" :class="$style.boxTitle"><i class="ti ti-x" aria-hidden="true"></i>{{ L.mistakesTitle }}</h2>
						<ul>
							<li v-for="(m, k) in lesson.mistakes" :key="k">
								<p :class="$style.bad"><span :class="$style.sign" aria-hidden="true">✗</span><span :class="$style.sr">{{ L.wrongSr }}</span><span lang="en" :class="$style.struck">{{ m.bad }}</span></p>
								<p :class="$style.good"><span :class="$style.sign" aria-hidden="true">✓</span><span :class="$style.sr">{{ L.rightSr }}</span><span lang="en">{{ m.good }}</span></p>
								<p v-if="m.why" :class="$style.why">{{ m.why }}</p>
							</li>
						</ul>
					</aside>
				</template>

				<aside v-if="lesson.writing.length > 0" :class="$style.writing" :aria-labelledby="`${uid}-writing`" data-writing>
					<h2 :id="`${uid}-writing`" :class="$style.boxTitle">{{ L.writingTitle }}</h2>
					<p><template v-for="(part, k) in lesson.writing" :key="k"><span v-if="part.en" lang="en" :class="$style.en">{{ part.text }}</span><template v-else>{{ part.text }}</template></template></p>
				</aside>
			</article>

			<section :class="$style.end" :aria-labelledby="`${uid}-end`">
				<h2 :id="`${uid}-end`" :class="$style.endTitle">{{ L.endTitle }}</h2>
				<p>{{ stop.types ? L.endTypes(stop.types[grammarLang]) : '' }}{{ L.endNote }}</p>
				<MkA :to="gateTo" :class="[$style.cta, $style.wide]" data-gate><i class="ti ti-flag" aria-hidden="true"></i>{{ L.toGate }}<i class="ti ti-arrow-right" aria-hidden="true"></i></MkA>
			</section>

			<nav v-if="near.prev || near.next" :class="$style.along" :aria-label="L.lineNav(content.name[grammarLang])">
				<MkA v-if="near.prev" :to="lessonPath(near.prev.id)" :class="[$style.stopLink, $style.prev]" data-prev>
					<i class="ti ti-chevron-left" aria-hidden="true"></i>
					<span><small>{{ L.prev }}</small><b>{{ L.stopName(bandText(near.prev.band), near.prev.title) }}</b></span>
				</MkA>
				<MkA v-if="near.next" :to="lessonPath(near.next.id)" :class="[$style.stopLink, $style.next]" data-next>
					<span><small>{{ L.next }}</small><b>{{ L.stopName(bandText(near.next.band), near.next.title) }}</b></span>
					<i class="ti ti-chevron-right" aria-hidden="true"></i>
				</MkA>
			</nav>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, useId, useTemplateRef } from 'vue';
import { getScrollContainer } from '@@/js/scroll.js';
import XExample from './grammar.example.vue';
import { GRAMMAR_COURSE, bandText, findStop, gatePath, grammarContent, lessonPath, neighbours, sectionFromPath } from '@/lojo/grammar/content.js';
import { grammarLabels as L, grammarLang } from '@/lojo/grammar/labels.js';
import { stopSaying } from '@/lojo/grammar/audio.js';
import { englishStatus, loadEnglishStatus } from '@/lojo/english/api.js';
import { coursePath } from '@/lojo/route/my-maps.js';
import { prefer } from '@/preferences.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';

const props = defineProps<{ stop: string }>();

const content = grammarContent;
const uid = useId();
const router = useRouter();
const rootEl = useTemplateRef('rootEl');

const stop = computed(() => findStop(content, props.stop));
const lesson = computed(() => (stop.value != null ? content.lessons[stop.value.id] ?? null : null));
const band = computed(() => (stop.value != null ? bandText(stop.value.band) : ''));
const near = computed(() => neighbours(content, props.stop));
const gateTo = computed(() => gatePath(props.stop));
// the route map, at this stop
const mapPath = computed(() => coursePath(GRAMMAR_COURSE) + (stop.value != null ? `#${encodeURIComponent(stop.value.id)}` : ''));
const speech = computed(() => englishStatus.value.speech);

// table cells without Chinese are English (relative words and their examples)
function isEnglish(text: string): boolean {
	return !/\p{Script=Han}/u.test(text);
}

// To a section, its heading taking the focus. Smooth only for a tap on its chip, and only when motion is welcome.
function jumpTo(id: string, smooth: boolean): void {
	const sections = rootEl.value?.querySelectorAll<HTMLElement>('[data-section]') ?? [];
	const section = Array.from(sections).find(el => el.dataset.section === id);
	const heading = section?.querySelector<HTMLElement>('h2');
	if (section == null || heading == null) return;
	const motion = smooth && prefer.s.animation && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	section.scrollIntoView({ block: 'start', behavior: motion ? 'smooth' : 'auto' });
	heading.focus({ preventScroll: true });
}

// ?section=s3 in this page's address
function sectionAsked(): string | null {
	return lesson.value != null ? sectionFromPath(router.getCurrentFullPath(), lesson.value) : null;
}

// Pages are kept (KeepAlive) when left and share one scroll box: how far this one was read, to come back to.
let scroller: HTMLElement | null = null;
let readTo = 0;

function onScroll(): void {
	if (scroller != null) readTo = scroller.scrollTop;
}

function watchScroll(): void {
	scroller = getScrollContainer(rootEl.value);
	scroller?.addEventListener('scroll', onScroll, { passive: true });
}

function unwatchScroll(): void {
	scroller?.removeEventListener('scroll', onScroll);
	scroller = null;
}

// The scroll box is shared with the page before, which may have been scrolled: open at the section asked for, or at
// the top.
onMounted(() => {
	void loadEnglishStatus();
	const asked = sectionAsked();
	if (asked != null) void nextTick(() => jumpTo(asked, false));
	else {
		const box = getScrollContainer(rootEl.value);
		if (box != null) box.scrollTop = 0;
	}
	watchScroll();
});

// Back on the page: a link asked for a section (the gate's result, again), or back where it was read to. (The first
// activation is the page opening: done above.)
let opened = false;
onActivated(() => {
	if (!opened) {
		opened = true;
		return;
	}
	const asked = sectionAsked();
	if (asked != null) jumpTo(asked, false);
	else {
		const box = getScrollContainer(rootEl.value);
		if (box != null) box.scrollTop = readTo;
	}
	watchScroll();
});

// Nothing reads on once the page is left.
onDeactivated(() => {
	unwatchScroll();
	stopSaying();
});

onBeforeUnmount(() => {
	unwatchScroll();
	stopSaying();
});

definePage(() => ({
	title: stop.value != null ? L.pageTitle(band.value, stop.value.title) : L.fallbackTitle,
	icon: 'ti ti-text-grammar',
}));
</script>

<style lang="scss" module>
.root {
	// the line's colour (route.css --l6), set from the course file
	--gl-c: #2F5D4A;
	--gl-cInk: color-mix(in srgb, var(--gl-c) 85%, var(--MI_THEME-fgHighlighted));
	--gl-cBg: color-mix(in srgb, var(--gl-c) 9%, var(--MI_THEME-panel));
	--gl-onC: var(--MI_THEME-fgOnAccent);
	--gl-ink: var(--MI_THEME-fgHighlighted);
	--gl-weak: color-mix(in srgb, var(--MI_THEME-fg) 72%, transparent);
	--gl-hi: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
	--gl-line: var(--MI_THEME-divider);
	--gl-ok: color-mix(in srgb, #2F7D5B 88%, var(--MI_THEME-fgHighlighted));
	--gl-bad: color-mix(in srgb, #9A3A22 92%, var(--MI_THEME-fgHighlighted));
	--gl-goldBg: color-mix(in srgb, #F2C14E 22%, var(--MI_THEME-panel));
	--gl-gold: color-mix(in srgb, #B8871B 72%, var(--MI_THEME-fg));
	--gl-shadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-fgHighlighted) 6%, transparent), 0 10px 28px -10px color-mix(in srgb, var(--MI_THEME-fgHighlighted) 25%, transparent);
	--gl-serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	// the marks in the examples, as in the demo: a colour and a line each; the names under the words a little darker
	--gl-s: #2340A3;
	--gl-sInk: #2340A3;
	--gl-v: #E8603F;
	--gl-vInk: color-mix(in srgb, #C24E2E 85%, var(--MI_THEME-fgHighlighted));
	--gl-o: #6E4F8F;
	--gl-oInk: #6E4F8F;
	--gl-p: #3F8F86;
	--gl-pInk: color-mix(in srgb, #3F8F86 70%, var(--MI_THEME-fgHighlighted));
	--gl-clauseBg: color-mix(in srgb, #F2C14E 36%, transparent);
	min-height: 100%;
	background: var(--MI_THEME-bg);
	background-image: radial-gradient(circle, color-mix(in srgb, var(--MI_THEME-fg) 11%, transparent) 1.5px, transparent 1.8px);
	background-size: 36px 36px;
	color: var(--MI_THEME-fg);
}

// a dark theme: lighter marks, so they still read on a dark panel
html[data-color-scheme=dark] .root {
	--gl-cInk: color-mix(in srgb, var(--gl-c) 50%, var(--MI_THEME-fgHighlighted));
	--gl-s: color-mix(in srgb, #2340A3 50%, var(--MI_THEME-fgHighlighted));
	--gl-sInk: var(--gl-s);
	--gl-vInk: color-mix(in srgb, #E8603F 75%, var(--MI_THEME-fgHighlighted));
	--gl-o: color-mix(in srgb, #6E4F8F 55%, var(--MI_THEME-fgHighlighted));
	--gl-oInk: var(--gl-o);
	--gl-p: color-mix(in srgb, #3F8F86 70%, var(--MI_THEME-fgHighlighted));
	--gl-pInk: var(--gl-p);
	--gl-ok: color-mix(in srgb, #2F7D5B 55%, var(--MI_THEME-fgHighlighted));
	--gl-bad: color-mix(in srgb, #E8603F 70%, var(--MI_THEME-fgHighlighted));
}

.body {
	container: grammar / inline-size;
	box-sizing: border-box;
	max-width: 720px;
	margin: 0 auto;
	padding: 12px 12px 48px;
}

.notice {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 40px 0;
	text-align: center;

	> p {
		margin: 0;
	}
}

.back {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: var(--gl-weak);
	font-size: 13.5px;
	font-weight: 600;
	margin: 0 0 10px;
	padding: 4px 10px 4px 2px;
	border-radius: 999px;

	> i {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--MI_THEME-panel);
		display: grid;
		place-items: center;
		color: var(--gl-ink);
		box-shadow: var(--gl-shadow);
	}

	&:hover {
		text-decoration: none;
		color: var(--gl-ink);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.paper {
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--gl-shadow);
	padding: 22px 18px 26px;
}

.eyebrow {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px 10px;
	margin: 0 0 10px;
	font-size: 12px;
	letter-spacing: 0.12em;
	color: var(--gl-weak);
	font-variant-numeric: tabular-nums;
}

.lineTag {
	display: inline-flex;
	align-items: center;
	height: 26px;
	padding: 0 11px;
	border-radius: 9px;
	background: var(--gl-c);
	color: var(--gl-onC);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.02em;
}

.title {
	font-family: var(--gl-serif);
	font-weight: 700;
	font-size: 28px;
	line-height: 1.2;
	letter-spacing: 0.03em;
	color: var(--gl-ink);
	margin: 0 0 6px;
}

.sub {
	margin: 0;
	font-size: 15px;
	line-height: 1.6;
	color: var(--gl-ink);
}

.lede {
	font-size: 14px;
	line-height: 1.75;
	color: var(--gl-weak);
	margin: 10px 0 0;
}

.meta {
	font-size: 12.5px;
	line-height: 1.6;
	color: var(--gl-weak);
	margin: 10px 0 0;
}

.en {
	color: var(--gl-ink);
	font-weight: 600;
}

.cta {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 46px;
	margin: 16px 0 0;
	padding: 0 20px;
	border-radius: 15px;
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);
	font-weight: 700;
	font-size: 15.5px;
	letter-spacing: 0.04em;

	&.wide {
		display: flex;
		width: 100%;
		box-sizing: border-box;
		min-height: 50px;
		margin: 0;
	}

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
		color: var(--MI_THEME-fgOnAccent);
		text-decoration: none;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.toc {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 18px 0 0;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	min-height: 38px;
	padding: 4px 12px 4px 6px;
	border-radius: 999px;
	background: var(--MI_THEME-bg);
	font-size: 13px;
	line-height: 1.4;
	color: var(--gl-ink);
	text-align: left;

	&:hover {
		background: var(--MI_THEME-buttonBg);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	> .num {
		width: 24px;
		height: 24px;
		font-size: 12px;
	}
}

.num {
	flex: none;
	display: grid;
	place-items: center;
	border-radius: 50%;
	background: var(--gl-c);
	color: var(--gl-onC);
	font-weight: 700;
	font-family: system-ui, sans-serif;
}

.legend {
	margin: 16px 0 0;
	padding: 12px 0 0;
	border-top: 1px solid var(--gl-line);
	font-size: 12.5px;
	color: var(--gl-weak);
}

.legendTitle {
	margin: 0 0 6px;
	font-size: 12.5px;
	font-weight: 700;
	color: var(--MI_THEME-fg);
}

.keys {
	display: flex;
	flex-wrap: wrap;
	gap: 6px 16px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.key {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 6px;

	> b {
		color: var(--MI_THEME-fg);
		font-weight: 700;
	}
}

// the line each mark is drawn with, as in the examples
.sw {
	display: inline-block;
	width: 20px;
	height: 0;
	border-bottom: 3px solid;
}

.sw_s {
	border-color: var(--gl-s);
}

.sw_v {
	border-color: var(--gl-v);
	border-bottom-style: double;
	border-bottom-width: 5px;
}

.sw_o {
	border-color: var(--gl-o);
	border-bottom-style: dashed;
}

.sw_p {
	border-color: var(--gl-p);
	border-bottom-style: dotted;
	border-bottom-width: 4px;
}

.sw_c {
	height: 14px;
	border: 0;
	border-radius: 4px;
	background: var(--gl-clauseBg);
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gl-gold) 45%, transparent);
}

.legendNote {
	margin: 6px 0 0;
	line-height: 1.6;
}

.section {
	padding-top: 26px;
	scroll-margin-top: 12px;
}

.h2 {
	display: flex;
	align-items: center;
	gap: 10px;
	font-family: var(--gl-serif);
	font-weight: 700;
	font-size: 20px;
	line-height: 1.35;
	color: var(--gl-ink);
	margin: 0 0 10px;

	&:focus:not(:focus-visible) {
		outline: none;
	}

	> .num {
		width: 28px;
		height: 28px;
		font-size: 14px;
	}
}

.p {
	margin: 0 0 12px;
	font-size: 15px;
	line-height: 1.85;
}

.tableWrap {
	overflow-x: auto;
	margin: 2px 0 14px;
}

.table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13.5px;

	th {
		font-size: 12px;
		font-weight: 600;
		color: var(--gl-weak);
		text-align: left;
		padding: 6px 8px;
		border-bottom: 1.5px solid var(--gl-line);
	}

	td {
		padding: 9px 8px;
		border-bottom: 1px solid var(--gl-line);
		vertical-align: top;
		line-height: 1.55;

		&:first-child {
			font-weight: 800;
			font-size: 15px;
			color: var(--gl-cInk);
			white-space: nowrap;
		}

		&:last-child {
			color: var(--gl-ink);
		}
	}
}

.mistakes {
	margin: 26px 0 0;
	padding: 16px 16px 6px;
	border-radius: 18px;
	background: color-mix(in srgb, var(--MI_THEME-cta) 6%, var(--MI_THEME-panel));
	box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--MI_THEME-cta) 30%, transparent);

	> .boxTitle {
		color: var(--gl-bad);
		font-size: 18px;
	}

	> ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 11px 0;
		border-top: 1px solid color-mix(in srgb, var(--MI_THEME-cta) 18%, var(--gl-line));
	}
}

.boxTitle {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0 0 6px;
	font-family: var(--gl-serif);
	font-weight: 700;
	font-size: 15.5px;
	color: var(--gl-ink);
}

.bad,
.good {
	position: relative;
	display: flex;
	gap: 8px;
	margin: 0;
	font-size: 15px;
	line-height: 1.55;
}

.bad {
	color: var(--gl-bad);
}

.struck {
	text-decoration: line-through;
	text-decoration-color: color-mix(in srgb, var(--gl-bad) 50%, transparent);
}

.good {
	color: var(--gl-ok);
	font-weight: 600;
	margin-top: 2px;
}

.sign {
	flex: none;
	width: 18px;
	font-weight: 800;
	text-align: center;
}

.why {
	margin: 4px 0 0 26px;
	font-size: 12.5px;
	line-height: 1.6;
	color: var(--gl-weak);
}

.writing {
	margin: 24px 0 0;
	padding: 14px 16px;
	border-radius: 16px;
	background: var(--gl-goldBg);

	> .boxTitle {
		margin-bottom: 2px;
	}

	> p {
		margin: 0;
		font-size: 14px;
		line-height: 1.75;
	}
}

.end {
	margin: 14px 0 0;
	padding: 18px 18px 16px;
	border-radius: 22px;
	background: var(--gl-cBg);
	box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--gl-c) 35%, transparent);

	> p {
		margin: 0 0 14px;
		font-size: 13.5px;
		line-height: 1.7;
	}
}

.endTitle {
	margin: 0 0 4px;
	font-family: var(--gl-serif);
	font-weight: 700;
	font-size: 18px;
	color: var(--gl-ink);
}

.along {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
	margin: 12px 0 0;
}

.stopLink {
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 56px;
	padding: 10px 12px;
	border-radius: 16px;
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 1.5px var(--gl-line);
	color: var(--gl-ink);

	> span {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	small {
		font-size: 11.5px;
		color: var(--gl-weak);
	}

	b {
		font-size: 14px;
		line-height: 1.4;
	}

	> i {
		flex: none;
		color: var(--gl-weak);
	}

	&:hover {
		text-decoration: none;
		box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--gl-c) 45%, var(--gl-line));
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&.prev {
		grid-column: 1;
	}

	&.next {
		grid-column: 2;
		justify-content: flex-end;
		text-align: right;

		> span {
			align-items: flex-end;
		}
	}
}

.sr {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

@media (hover: none) {
	.cta:hover {
		background: var(--MI_THEME-cta);
	}

	.chip:hover {
		background: var(--MI_THEME-bg);
	}
}

@media (min-width: 720px) {
	.body {
		padding: 18px 24px 56px;
	}
}

@container grammar (min-width: 600px) {
	.paper {
		padding: 30px 36px 34px;
	}

	.title {
		font-size: 32px;
	}

	.end {
		padding: 20px 24px;
	}
}
</style>
