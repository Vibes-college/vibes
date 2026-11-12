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
const app = createApp(App);
app.component('MkA', MkA).component('MkLoading', MkLoading).component('MkPageHeader', MkPageHeader);
app.mount('#app');
