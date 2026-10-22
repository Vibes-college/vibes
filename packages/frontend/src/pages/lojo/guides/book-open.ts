/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Opening a face-out book: it lifts off the table and comes to the middle of the screen while
// its cover swings open on the spine, two leaves riffle after it, and the first page then grows
// into the article. Everything runs on a fixed overlay so the grid underneath never moves.

type OpenBookOptions = {
	front: HTMLElement;
	cloth: string;
	ink: string;
	title: string;
	summary: string;
	image?: string;
	navigate: () => void;
};

const SERIF = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", Georgia, serif';

function el(style: Partial<CSSStyleDeclaration>, parent?: HTMLElement, text?: string) {
	const node = window.document.createElement('div');
	Object.assign(node.style, style);
	if (text) node.textContent = text;
	parent?.appendChild(node);
	return node;
}

export function canAnimateBookOpen() {
	return typeof Element.prototype.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function openBook({ front, cloth, ink, title, summary, image, navigate }: OpenBookOptions) {
	const rect = front.getBoundingClientRect();
	const w = rect.width;
	const h = rect.height;
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const panel = getComputedStyle(front).getPropertyValue('--MI_THEME-panel').trim() || '#FFFDF8';
	const page = getComputedStyle(window.document.body).getPropertyValue('--MI_THEME-bg').trim() || '#F6F1E7';
	const fg = getComputedStyle(front).getPropertyValue('--MI_THEME-fg').trim() || '#4A4E63';

	// Open spread: the spine sits on the centre line, the cover lands on the left.
	const s = Math.min((vh * 0.66) / h, (vw * 0.43) / w, 2.6);
	const tx = vw / 2;
	const ty = (vh - h * s) / 2;

	const stage = el({ position: 'fixed', inset: '0', zIndex: '30000', pointerEvents: 'none', perspective: `${Math.round(2600 * s)}px`, perspectiveOrigin: '50% 45%' });
	stage.setAttribute('aria-hidden', 'true');
	const dim = el({ position: 'absolute', inset: '0', background: 'rgba(14, 18, 36, .28)', opacity: '0' }, stage);
	const flight = el({ position: 'absolute', left: '0', top: '0', width: `${w}px`, height: `${h}px`, transformOrigin: '0 0', transformStyle: 'preserve-3d', transform: `translate(${rect.left}px, ${rect.top}px)` }, stage);

	// First page: what you will read, set like a title page.
	const first = el({
		position: 'absolute', inset: '0', borderRadius: '1px 4px 4px 1px', background: panel, color: fg, overflow: 'hidden',
		boxShadow: 'inset 10px 0 14px -10px rgba(0, 0, 0, .28), 0 24px 50px -18px rgba(10, 16, 40, .55)',
		display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: `${h * 0.05}px`, padding: `${h * 0.1}px ${w * 0.12}px`, boxSizing: 'border-box',
	}, flight);
	el({ width: `${w * 0.14}px`, height: '2px', background: cloth }, first);
	el({ font: `700 ${Math.max(11, w * 0.085)}px/1.4 ${SERIF}`, color: fg, letterSpacing: '.02em' }, first, title);
	if (summary) el({ font: `400 ${Math.max(8, w * 0.05)}px/1.75 ${SERIF}`, opacity: '.72', display: '-webkit-box', webkitLineClamp: '6', webkitBoxOrient: 'vertical', overflow: 'hidden' } as Partial<CSSStyleDeclaration>, first, summary);

	// Two leaves turn just after the cover. The last one carries a frontispiece on its back, so
	// the left page of the spread shows the guide's picture (or the L of the wordmark).
	const paper = `linear-gradient(90deg, rgba(0,0,0,.08), rgba(0,0,0,0) 12%), ${panel}`;
	const leaves = [0, 1].map(i => {
		const leaf = el({ position: 'absolute', inset: `${2 + i}px 0 ${2 + i}px 0`, transformOrigin: '0 50%', transformStyle: 'preserve-3d' }, flight);
		el({ position: 'absolute', inset: '0', borderRadius: '1px 4px 4px 1px', background: paper, backfaceVisibility: 'hidden', boxShadow: '0 0 0 1px rgba(0, 0, 0, .04)' }, leaf);
		const back = el({
			position: 'absolute', inset: '0', borderRadius: '4px 1px 1px 4px', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden',
			background: `linear-gradient(270deg, rgba(0,0,0,.1), rgba(0,0,0,0) 14%), ${panel}`, display: 'grid', placeItems: 'center',
			padding: `${h * 0.12}px ${w * 0.12}px`, boxSizing: 'border-box',
		}, leaf);
		if (i === 1) {
			if (image) {
				const img = window.document.createElement('img');
				img.src = image;
				img.alt = '';
				Object.assign(img.style, { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '2px', boxShadow: '0 1px 0 rgba(0,0,0,.06), 0 6px 16px -8px rgba(0,0,0,.35)' });
				back.appendChild(img);
			} else {
				back.innerHTML = `<svg viewBox="0 0 40 120" width="${w * 0.16}" aria-hidden="true"><path d="M8 8 V104 Q8 112 16 112 H34" fill="none" stroke="${cloth}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			}
		}
		return leaf;
	});

	// The cover: a live copy of the card's front, with an endpaper on its inside.
	const hinge = el({ position: 'absolute', inset: '0', transformOrigin: '0 50%', transformStyle: 'preserve-3d' }, flight);
	const outside = front.cloneNode(true) as HTMLElement;
	Object.assign(outside.style, { position: 'absolute', inset: '0', transform: 'none', transition: 'none', backfaceVisibility: 'hidden' });
	// The copy leaves the card, so carry the card's custom properties with it.
	const computed = getComputedStyle(front);
	for (const name of ['--c', '--ink', '--ribbon', '--serif']) outside.style.setProperty(name, computed.getPropertyValue(name));
	hinge.appendChild(outside);
	const inside = el({
		position: 'absolute', inset: '0', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', borderRadius: '4px 1px 1px 4px',
		background: `repeating-linear-gradient(45deg, color-mix(in srgb, ${ink} 10%, transparent) 0 2px, transparent 2px 9px), color-mix(in srgb, ${cloth} 72%, #fff)`,
	}, hinge);
	const coverShade = el({ position: 'absolute', inset: '0', background: '#0B1020', opacity: '0', backfaceVisibility: 'hidden' }, hinge);
	el({ position: 'absolute', inset: '0', background: 'linear-gradient(270deg, rgba(0,0,0,.28), rgba(0,0,0,0) 30%)' }, inside);

	window.document.body.appendChild(stage);

	const ease = 'cubic-bezier(.62, 0, .2, 1)';
	const opts = (duration: number, delay = 0, easing = ease) => ({ duration, delay, easing, fill: 'forwards' as const });
	dim.animate([{ opacity: 0 }, { opacity: 1 }], opts(520));
	flight.animate([
		{ transform: `translate(${rect.left}px, ${rect.top}px) scale(1) rotateX(0deg)` },
		{ transform: `translate(${rect.left + (tx - rect.left) * 0.25}px, ${rect.top - 24}px) scale(${1 + (s - 1) * 0.3}) rotateX(8deg)`, offset: 0.3 },
		{ transform: `translate(${tx}px, ${ty}px) scale(${s}) rotateX(0deg)` },
	], opts(680));
	hinge.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-172deg)' }], opts(760, 220, 'cubic-bezier(.5, 0, .15, 1)'));
	coverShade.animate([{ opacity: 0 }, { opacity: 0.45, offset: 0.5 }, { opacity: 0 }], opts(760, 220));
	leaves.forEach((leaf, i) => leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${-166 + i * 5}deg)` }], opts(680, 320 + i * 80, 'cubic-bezier(.55, 0, .2, 1)')));

	// The first page then becomes the reading surface.
	const growAt = 1020;
	window.setTimeout(() => {
		const r = first.getBoundingClientRect();
		const veil = el({ position: 'fixed', left: '0', top: '0', width: `${r.width}px`, height: `${r.height}px`, transformOrigin: '0 0', background: page, zIndex: '30001', pointerEvents: 'none', opacity: '0' });
		veil.setAttribute('aria-hidden', 'true');
		window.document.body.appendChild(veil);
		veil.animate([
			{ transform: `translate(${r.left}px, ${r.top}px) scale(1, 1)`, opacity: 0 },
			{ transform: `translate(${r.left}px, ${r.top}px) scale(1, 1)`, opacity: 1, offset: 0.18 },
			{ transform: `translate(0px, 0px) scale(${vw / r.width}, ${vh / r.height})`, opacity: 1 },
		], opts(480, 0, 'cubic-bezier(.7, 0, .2, 1)')).onfinish = () => {
			stage.remove();
			try {
				navigate();
			} finally {
				veil.animate([{ opacity: 1 }, { opacity: 0 }], opts(380, 120, 'ease-out')).onfinish = () => veil.remove();
			}
		};
	}, growAt);
}
