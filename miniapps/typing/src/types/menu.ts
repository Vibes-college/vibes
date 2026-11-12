// SPDX-License-Identifier: AGPL-3.0-only
export type MenuItem = { type?: string; text: string; icon?: string; active?: boolean; action?: (ev?: MouseEvent) => void } | { type: 'divider' } | { type: 'label'; text: string };
