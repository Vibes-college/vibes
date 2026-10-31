/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref } from 'vue';
import { agentLabels } from './labels.js';

// Summoning is a choice for this device only, so it lives in localStorage, not in account settings.
// Paseo keeps its own pairing in its own storage (inside the iframe); dismissing does not clear it.
const KEY = 'vibes:agent';

// Our build of Paseo with the Vibes bridge (repo Vibes-college/agent). It only accepts the parents listed in
// that repo's parents.json, so a new community address has to be added there first.
export const AGENT_URL = 'https://agent.vibes.college/';
export const AGENT_ORIGIN = new URL(AGENT_URL).origin;

type AgentState = { summoned?: boolean; name?: string; guideSeen?: boolean };

function load(): AgentState {
	try {
		const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		return typeof parsed === 'object' && parsed != null ? parsed as AgentState : {};
	} catch {
		return {};
	}
}

export const agentState = ref<AgentState>(load());
export const agentName = computed(() => agentState.value.name || agentLabels.defaultName);
// Set when summoned from settings, so the button arrives with a small animation and a greeting.
export const justSummoned = ref(false);

function save(next: AgentState) {
	agentState.value = next;
	if (next.summoned) localStorage.setItem(KEY, JSON.stringify(next));
	else localStorage.removeItem(KEY);
}

export function summonAgent(name: string) {
	save({ ...agentState.value, summoned: true, name: name.trim().slice(0, 16) });
	justSummoned.value = true;
}

export function markGuideSeen() {
	save({ ...agentState.value, guideSeen: true });
}

export function dismissAgent() {
	save({});
}
