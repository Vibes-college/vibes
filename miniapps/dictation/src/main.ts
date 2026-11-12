// SPDX-License-Identifier: AGPL-3.0-only
// 听写小程序（/apps/dictation/）的入口：铺社区配色、挂几个社区组件的替身、打开听写。没登录也能练，所以不拦登录。
import { createApp } from 'vue';
import './style.css';
import './icons.css';
import { applyCommunityTheme } from './shell/theme.js';
import MkA from './shell/MkA.vue';
import MkLoading from './shell/MkLoading.vue';
import MkPageHeader from './shell/MkPageHeader.vue';
import App from './pages/dictation.vue';

applyCommunityTheme();
// 闯关结果页的「练习 · 听写」卡片带着 ?gate=<这次闯关>&tag=<哪类空> 过来（社区里由路由转成 props，这里自己读）。
const query = new URLSearchParams(location.search);
const app = createApp(App, { gate: query.get('gate') ?? undefined, tag: query.get('tag') ?? undefined });
app.component('MkA', MkA).component('MkLoading', MkLoading).component('MkPageHeader', MkPageHeader);
app.mount('#app');
