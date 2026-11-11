/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	window.onerror = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED', e);
	};
	window.onunhandledrejection = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED_IN_PROMISE', e.reason || e);
	};

	// Vibes: Chrome and Edge offer to install the app once the page qualifies, which can come before the app has
	// loaded. Keep the offer for the card that asks to add Vibes to the home screen (src/lojo/install/prompt.ts).
	window.addEventListener('beforeinstallprompt', (ev) => {
		ev.preventDefault();
		window.vibesInstallPrompt = ev;
	});

	let forceError = localStorage.getItem('forceError');
	if (forceError != null) {
		renderError('FORCED_ERROR', 'This error is forced by having forceError in local storage.');
		return;
	}

	//#region Detect language
	const supportedLangs = LANGS;
	/** @type { string } */
	let lang = localStorage.getItem('lang');
	if (lang == null || !supportedLangs.includes(lang)) {
		if (supportedLangs.includes(navigator.language)) {
			lang = navigator.language;
		} else {
			// Vibes: match on the language part too, so zh-TW and zh-HK get zh-CN rather than English
			// while only some UI languages are built (VIBES_UI_LANGS).
			lang = supportedLangs.find(x => x.split('-')[0] === navigator.language.split('-')[0]);

			// Fallback
			if (lang == null) lang = 'en-US';
		}
	}

	// for https://github.com/misskey-dev/misskey/issues/10202
	if (lang == null || lang.toString == null || lang.toString() === 'null') {
		console.error('invalid lang value detected!!!', typeof lang, lang);
		lang = 'en-US';
	}

	localStorage.setItem('lang', lang);
	//#endregion

	//#region Script
	// Vibes: a phone coming back from the background often has no network yet, and the link from mainland China to
	// Hong Kong drops requests now and then. A failed module import is remembered for the rest of the page, so trying
	// again here would fail at once: reload the page instead, up to twice (after the network is back if it is offline),
	// and only then show the error.
	const BOOT_RETRY_KEY = 'vibesBootRetry';
	function retryBoot() {
		let tries = 0;
		try {
			tries = Number(sessionStorage.getItem(BOOT_RETRY_KEY) ?? '0');
			if (tries >= 2) {
				sessionStorage.removeItem(BOOT_RETRY_KEY);
				return false;
			}
			sessionStorage.setItem(BOOT_RETRY_KEY, String(tries + 1));
		} catch {
			return false;
		}
		const reload = () => location.reload();
		if (navigator.onLine === false) {
			window.addEventListener('online', reload, { once: true });
		} else {
			window.setTimeout(reload, 1000 * (tries + 1));
		}
		return true;
	}

	async function importAppScript() {
		await import(CLIENT_ENTRY ? `/vite/${CLIENT_ENTRY.replace('scripts', lang)}` : '/vite/src/_boot_.ts')
			.then(() => {
				try {
					// For the anonymous start-up record (src/lojo/boot-report.ts): how many reloads it took.
					window.vibesBootRetries = Number(sessionStorage.getItem(BOOT_RETRY_KEY) ?? '0');
					sessionStorage.removeItem(BOOT_RETRY_KEY);
				} catch {
					// No sessionStorage: nothing was counted.
				}
			})
			.catch(async e => {
				console.error(e);
				if (retryBoot()) return;
				renderError('APP_IMPORT', e);
			});
	}

	// Vibes: ask for every script the app needs to start at once (BOOT_FILES, listed by the server), instead of finding one
	// level of imports after another; from mainland China each level costs a round trip of 0.2–0.6 s.
	// The stylesheets of those parts are fetched now too (2026-11-09: on a first visit the layout's stylesheets were only
	// asked for after the scripts had run, two rounds late). A visitor who is not signed in gets the visitor layout and
	// the welcome page instead (GUEST_BOOT_FILES).
	const bootFiles = localStorage.getItem('account') == null && typeof GUEST_BOOT_FILES !== 'undefined' && Array.isArray(GUEST_BOOT_FILES) && GUEST_BOOT_FILES.length > 0
		? GUEST_BOOT_FILES
		: typeof BOOT_FILES !== 'undefined' && Array.isArray(BOOT_FILES) ? BOOT_FILES : [];
	// Vibes: on /quest a signed-in player gets the game straight away (backend LojoQuestInstant.ts); the app's scripts wait
	// until its map is drawn (or 5 s), so on a slow line they don't hold up the map (2026-11-10: minutes on a phone).
	let questFirst = false;
	try {
		questFirst = typeof QUEST_FRAME === 'string' && location.pathname === '/quest' && JSON.parse(localStorage.getItem('account') ?? 'null')?.token != null;
	} catch {
		questFirst = false;
	}
	const questReady = new Promise(resolve => {
		if (!questFirst || window.vibesQuestReady) return resolve();
		window.addEventListener('vibes:quest-ready', () => resolve(), { once: true });
		window.setTimeout(resolve, 5000);
	});

	if (CLIENT_ENTRY) questReady.then(() => {
		for (const file of bootFiles) {
			const link = document.createElement('link');
			if (file.startsWith('scripts/')) {
				link.rel = 'modulepreload';
				link.href = `/vite/${file.replace('scripts', lang)}`;
			} else if (file.endsWith('.css')) {
				link.rel = 'preload';
				link.as = 'style';
				// The app loads its stylesheets with crossorigin set (vite's loader); a preload without it is not reused.
				link.crossOrigin = '';
				link.href = `/vite/${file}`;
			} else {
				continue;
			}
			document.head.appendChild(link);
		}
	});

	//#region Early requests
	// Vibes: on the home page, ask for the first notes now, while the scripts above are still downloading; the app takes
	// this answer when it asks for exactly the same thing (src/lojo/early-api.ts, which also has the key format). Only the
	// default choices are guessed (the home timeline with renotes, or the featured notes for a visitor); someone who
	// picked another timeline just gets their own request as before.
	window.vibesEarlyApi = [];
	if (CLIENT_ENTRY && location.pathname === '/' && location.search === '') {
		const earlyKey = (data) => JSON.stringify(Object.keys(data).filter(k => k !== 'i' && data[k] !== undefined).sort().map(k => [k, data[k]]));
		let token = null;
		try {
			token = JSON.parse(localStorage.getItem('account') ?? 'null')?.token ?? null;
		} catch {
			token = null;
		}
		try {
			if (token) {
				const data = { withRenotes: true, limit: 15, allowPartial: true };
				window.vibesEarlyApi.push({
					endpoint: 'notes/timeline', key: earlyKey(data), token, at: Date.now(),
					res: fetch('/api/notes/timeline', {
						method: 'POST', body: JSON.stringify({ ...data, i: token }), credentials: 'omit', cache: 'no-cache',
						headers: { 'Content-Type': 'application/json' },
					}),
				});
			} else {
				window.vibesEarlyApi.push({
					endpoint: 'notes/featured', key: earlyKey({}), token: null, at: Date.now(),
					res: fetch('/api/notes/featured?', { method: 'GET', credentials: 'omit', cache: 'default' }),
				});
			}
			// Nobody may come to take it (another timeline): don't report that as an error.
			for (const e of window.vibesEarlyApi) e.res.catch(() => {});
		} catch {
			window.vibesEarlyApi = [];
		}
	}
	//#endregion

	// タイミングによっては、この時点でDOMの構築が済んでいる場合とそうでない場合とがある
	if (document.readyState !== 'loading') {
		questReady.then(importAppScript);
	} else {
		window.addEventListener('DOMContentLoaded', () => {
			questReady.then(importAppScript);
		});
	}
	//#endregion

	let isSafeMode = (localStorage.getItem('isSafeMode') === 'true');

	if (!isSafeMode) {
		const urlParams = new URLSearchParams(window.location.search);

		if (urlParams.has('safemode') && urlParams.get('safemode') === 'true') {
			localStorage.setItem('isSafeMode', 'true');
			isSafeMode = true;
		}
	}

	//#region Theme
	if (!isSafeMode) {
		const theme = localStorage.getItem('theme');
		if (theme) {
			for (const [k, v] of Object.entries(JSON.parse(theme))) {
				document.documentElement.style.setProperty(`--MI_THEME-${k}`, v.toString());

				// HTMLの theme-color 適用
				if (k === 'htmlThemeColor') {
					for (const tag of document.head.children) {
						if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
							tag.setAttribute('content', v);
							break;
						}
					}
				}
			}
		}
	}

	const colorScheme = localStorage.getItem('colorScheme');
	if (colorScheme) {
		document.documentElement.style.setProperty('color-scheme', colorScheme);
	}
	//#endregion

	const fontSize = localStorage.getItem('fontSize');
	if (fontSize) {
		document.documentElement.classList.add('f-' + fontSize);
	}

	const useSystemFont = localStorage.getItem('useSystemFont');
	if (useSystemFont) {
		document.documentElement.classList.add('useSystemFont');
	}

	if (!isSafeMode) {
		const customCss = localStorage.getItem('customCss');
		if (customCss && customCss.length > 0) {
			const style = document.createElement('style');
			style.innerHTML = customCss;
			document.head.appendChild(style);
		}
	}

	async function addStyle(styleText) {
		let css = document.createElement('style');
		css.appendChild(document.createTextNode(styleText));
		document.head.appendChild(css);
	}

	// Vibes: the anonymous start-up record for a start that failed (the app's own record is src/lojo/boot-report.ts,
	// which explains what is kept). Once per page.
	let bootErrorSent = false;
	function sendBootError(code) {
		if (bootErrorSent || typeof navigator.sendBeacon !== 'function') return;
		bootErrorSent = true;
		try {
			const ua = navigator.userAgent;
			const first = location.pathname.split('/')[1] ?? '';
			const report = {
				v: CLIENT_ENTRY ? CLIENT_ENTRY.split('/').pop() : 'dev',
				page: first === '' ? 'home' : first.startsWith('@') ? 'user' : /^[a-z][a-z0-9-]{0,31}$/.test(first) ? first : 'other',
				nav: performance.getEntriesByType('navigation')[0]?.type ?? 'other',
				os: /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : /Mac OS X/.test(ua) ? 'mac' : /Windows/.test(ua) ? 'windows' : /Linux/.test(ua) ? 'linux' : 'other',
				browser: /MicroMessenger/i.test(ua) ? 'wechat' : /xhsdiscover|XiaoHongShu/i.test(ua) ? 'xhs' : /EdgA?\/|EdgiOS\//.test(ua) ? 'edge' : /FxiOS\/|Firefox\//.test(ua) ? 'firefox' : /CriOS\/|Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'other',
				standalone: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
				signedIn: localStorage.getItem('account') != null,
				sw: navigator.serviceWorker?.controller != null,
				codeKb: -1,
				retries: code === 'APP_IMPORT' ? 2 : 0, // APP_IMPORT shows only after two reloads (retryBoot)
				bootMs: null,
				error: /^[A-Z_]{1,40}$/.test(code) ? code : 'OTHER',
				bot: navigator.webdriver === true, // our own automated checks, left out of the figures
			};
			if (!['navigate', 'reload', 'back_forward', 'prerender'].includes(report.nav)) report.nav = 'other';
			navigator.sendBeacon('/api/lojo/boot-report', new Blob([JSON.stringify(report)], { type: 'application/json' }));
		} catch {
			// The record is only for statistics.
		}
	}

	async function renderError(code, details) {
		sendBootError(code);

		// Cannot set property 'innerHTML' of null を回避
		if (document.readyState === 'loading') {
			await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve));
		}

		let messages = null;
		const bootloaderLocales = localStorage.getItem('bootloaderLocales');
		if (bootloaderLocales) {
			messages = JSON.parse(bootloaderLocales);
		}
		if (!messages) {
			// older version of misskey does not store bootloaderLocales, stores locale as a whole
			const legacyLocale = localStorage.getItem('locale');
			if (legacyLocale) {
				const parsed = JSON.parse(legacyLocale);
				messages = {
					...(parsed._bootErrors ?? {}),
					reload: parsed.reload,
				};
			}
		}
		if (!messages) messages = {};

		messages = Object.assign({
			title: 'Failed to initialize Misskey',
			solution: 'The following actions may solve the problem.',
			solution1: 'Update your os and browser',
			solution2: 'Disable an adblocker',
			solution3: 'Clear the browser cache',
			solution4: '(Tor Browser) Set dom.webaudio.enabled to true',
			otherOption: 'Other options',
			otherOption1: 'Clear preferences and cache',
			otherOption2: 'Start the simple client',
			otherOption3: 'Start the repair tool',
			otherOption4: 'Start Misskey in safe mode',
			reload: 'Reload',
		}, messages);

		const safeModeUrl = new URL(window.location.href);
		safeModeUrl.searchParams.set('safemode', 'true');

		let errorsElement = document.getElementById('errors');

		if (!errorsElement) {
			document.body.innerHTML = `
			<svg class="icon-warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<path d="M12 9v2m0 4v.01"></path>
				<path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"></path>
			</svg>
			<h1>${messages.title}</h1>
			<button class="button-big" onclick="location.reload(true);">
				<span class="button-label-big">${messages?.reload}</span>
			</button>
			<p><b>${messages.solution}</b></p>
			<p>${messages.solution1}</p>
			<p>${messages.solution2}</p>
			<p>${messages.solution3}</p>
			<p>${messages.solution4}</p>
			<details style="color: #86b300;">
				<summary>${messages.otherOption}</summary>
				<a href="${safeModeUrl}">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption4}</span>
					</button>
				</a>
				<br>
				<a href="/flush">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption1}</span>
					</button>
				</a>
				<br>
				<a href="/cli">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption2}</span>
					</button>
				</a>
				<br>
				<a href="/bios">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption3}</span>
					</button>
				</a>
			</details>
			<br>
			<div id="errors"></div>
			`;
			errorsElement = document.getElementById('errors');
		}
		const detailsElement = document.createElement('details');
		detailsElement.id = 'errorInfo';
		detailsElement.innerHTML = `
		<br>
		<summary>
			<code>ERROR CODE: ${code}</code>
		</summary>
		<code>${details.toString()} ${JSON.stringify(details)}</code>`;
		errorsElement.appendChild(detailsElement);
		addStyle(`
		* {
			font-family: BIZ UDGothic, Roboto, HelveticaNeue, Arial, sans-serif;
		}

		#misskey_app,
		#splash {
			display: none !important;
		}

		body,
		html {
			background-color: #222;
			color: #dfddcc;
			justify-content: center;
			margin: auto;
			padding: 10px;
			text-align: center;
		}

		button {
			border-radius: 999px;
			padding: 0px 12px 0px 12px;
			border: none;
			cursor: pointer;
			margin-bottom: 12px;
		}

		.button-big {
			background: linear-gradient(90deg, rgb(134, 179, 0), rgb(74, 179, 0));
			line-height: 50px;
		}

		.button-big:hover {
			background: rgb(153, 204, 0);
		}

		.button-small {
			background: #444;
			line-height: 40px;
		}

		.button-small:hover {
			background: #555;
		}

		.button-label-big {
			color: #222;
			font-weight: bold;
			font-size: 1.2em;
			padding: 12px;
		}

		.button-label-small {
			color: rgb(153, 204, 0);
			font-size: 16px;
			padding: 12px;
		}

		a {
			color: rgb(134, 179, 0);
			text-decoration: none;
		}

		p,
		li {
			font-size: 16px;
		}

		.icon-warning {
			color: #dec340;
			height: 4rem;
			padding-top: 2rem;
		}

		h1 {
			font-size: 1.5em;
			margin: 1em;
		}

		code {
			font-family: Fira, FiraCode, monospace;
		}

		#errorInfo {
			background: #333;
			margin-bottom: 2rem;
			padding: 0.5rem 1rem;
			width: 40rem;
			border-radius: 10px;
			justify-content: center;
			margin: auto;
		}

		#errorInfo summary {
			cursor: pointer;
		}

		#errorInfo summary > * {
			display: inline;
		}

		@media screen and (max-width: 500px) {
			#errorInfo {
				width: 50%;
			}
		}`);
	}
})();
