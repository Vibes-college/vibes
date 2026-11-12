<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Mini apps moved out of the community run on their own at /apps/<id>/ (小程序搬出社区, 2026-11-12). This page only
shows for a moment, to send the learner there:
- an old address (/typing?x → /apps/typing/?x), opened from the app shell the service worker keeps; the server answers
  these with a permanent redirect too;
- /apps/<id>/… itself, when a service worker from before the move still served the app shell for it: then
  /apps/<id>/index.html, which no service worker takes over (addresses ending in a file name always go to the server). -->
<template>
<MkLoading/>
</template>

<script lang="ts" setup>
const at = window.location;
const parts = at.pathname.split('/');
const target = parts[1] === 'apps'
	? (/\.[a-z][a-z0-9]*$/i.test(at.pathname) ? at.pathname : `${at.pathname.replace(/\/?$/, '/')}index.html`)
	: `/apps/${encodeURIComponent(parts[1] ?? '')}/${parts.slice(2).join('/')}`;
if (target !== at.pathname) window.location.replace(`${target}${at.search}${at.hash}`);
</script>
