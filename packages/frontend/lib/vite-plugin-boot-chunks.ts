/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes 2026-11-09: merge the code the first screen needs into a few files.
//
// Left to itself, the bundler cuts startup code into ~100 small files, because each module goes wherever the set of
// pages using it says. On a phone network every file costs a request, so the first open spent seconds just queueing.
// This plugin works out, after all modules are read and before files are cut, which modules startup loads anyway:
//   core:      everything the entry imports, plus what both the signed-in and the visitor screens import
//   signed-in: the rest of what the signed-in screen imports (only downloaded by signed-in people)
//   visitor:   the rest of what the visitor screen imports (only downloaded by people not signed in)
// and returns bundler groups that put each set into one file. Lazy pages that use these modules import them from there.
// The page lists must match HtmlTemplateService's boot file lists, which the loader preloads.

import type { Plugin } from 'vite';

type Group = {
	name: string;
	test: (id: string) => boolean;
	priority?: number;
};

export function pluginBootChunks(options: {
	entries: string[]; // ids ending like this are entries (kept out of the groups so they stay entries)
	signedInPages: string[];
	visitorPages: string[];
	skip: RegExp; // modules left to their own groups (vue, i18n)
}): { plugin: Plugin; groups: Group[] } {
	const core = new Set<string>();
	const signedIn = new Set<string>();
	const visitor = new Set<string>();

	const plugin: Plugin = {
		name: 'vibes-boot-chunks',
		apply: 'build',
		buildEnd() {
			const ids = [...this.getModuleIds()];
			const find = (ends: string[]) => ids.filter(id => !id.includes('?') && ends.some(e => id.endsWith(e)));
			const closure = (roots: string[]): Set<string> => {
				const seen = new Set<string>(roots);
				const queue = [...roots];
				while (queue.length > 0) {
					const id = queue.pop()!;
					for (const dep of this.getModuleInfo(id)?.importedIds ?? []) {
						if (!seen.has(dep)) {
							seen.add(dep);
							queue.push(dep);
						}
					}
				}
				return seen;
			};

			const entryIds = find(options.entries);
			const fromEntry = closure(entryIds);
			const fromSignedIn = closure(find(options.signedInPages));
			const fromVisitor = closure(find(options.visitorPages));
			const keep = (id: string) => !entryIds.includes(id) && !options.skip.test(id);

			core.clear();
			signedIn.clear();
			visitor.clear();
			for (const id of fromEntry) if (keep(id)) core.add(id);
			for (const id of fromSignedIn) {
				if (!keep(id) || core.has(id)) continue;
				if (fromVisitor.has(id)) core.add(id);
				else signedIn.add(id);
			}
			for (const id of fromVisitor) {
				if (keep(id) && !core.has(id) && !signedIn.has(id)) visitor.add(id);
			}
			this.info(`boot chunks: core ${core.size}, signed-in ${signedIn.size}, visitor ${visitor.size} modules`);
		},
	};

	return {
		plugin,
		groups: [
			{ name: 'boot', test: id => core.has(id) },
			{ name: 'boot-signed-in', test: id => signedIn.has(id) },
			{ name: 'boot-visitor', test: id => visitor.has(id) },
		],
	};
}
