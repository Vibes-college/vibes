/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Stepping into a book: its cloth grows from where the book sits to fill the screen, the title
// rises on it like a chapter's first page, then everything fades over the article.

type CoverVeilOptions = {
	rect: DOMRect;
	cloth: string;
	ink: string;
	title: string;
	navigate: () => void;
	radius?: string;
};

export function canAnimateCoverVeil() {
	return typeof Element.prototype.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function coverVeil({ rect, cloth, ink, title, navigate, radius = '3px' }: CoverVeilOptions) {
	const veil = window.document.createElement('div');
	veil.setAttribute('aria-hidden', 'true');
	Object.assign(veil.style, {
		position: 'fixed', left: '0', top: '0', width: `${rect.width}px`, height: `${rect.height}px`, zIndex: '30000',
		background: cloth, borderRadius: radius, pointerEvents: 'none', transformOrigin: '0 0',
		transform: `translate(${rect.left}px, ${rect.top}px)`, boxShadow: '0 30px 80px -20px rgba(10, 16, 40, .5)',
	});
	const card = window.document.createElement('div');
	card.setAttribute('aria-hidden', 'true');
	card.textContent = title;
	Object.assign(card.style, {
		position: 'fixed', inset: '0', zIndex: '30001', pointerEvents: 'none', display: 'grid', placeItems: 'center',
		padding: '0 12vw', boxSizing: 'border-box', textAlign: 'center', color: ink, opacity: '0',
		font: '700 clamp(26px, 3.6vw, 52px)/1.3 "Songti SC", "Noto Serif SC", "Source Han Serif SC", serif', letterSpacing: '.04em',
	});
	window.document.body.append(veil, card);
	const grow = veil.animate([
		{ transform: `translate(${rect.left}px, ${rect.top}px) scale(1, 1)`, borderRadius: radius },
		{ transform: `translate(${rect.left}px, ${rect.top - 14}px) scale(1.04, 1.04)`, borderRadius: radius, offset: 0.28 },
		{ transform: `translate(0px, 0px) scale(${window.innerWidth / rect.width}, ${window.innerHeight / rect.height})`, borderRadius: '0px' },
	], { duration: 600, delay: 110, easing: 'cubic-bezier(.65, 0, .18, 1)', fill: 'forwards' });
	card.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, delay: 480, easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'forwards' });
	grow.onfinish = () => {
		try {
			navigate();
		} finally {
			const out = { duration: 460, delay: 300, easing: 'ease-out', fill: 'forwards' } as const;
			card.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], out).onfinish = () => card.remove();
			veil.animate([{ opacity: 1 }, { opacity: 0 }], out).onfinish = () => veil.remove();
		}
	};
}
