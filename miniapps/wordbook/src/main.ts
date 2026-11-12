// SPDX-License-Identifier: AGPL-3.0-only
// 生词本小程序（/apps/wordbook/）的入口：铺社区配色、挂几个社区组件的替身、打开生词本。
import { createApp } from 'vue';
import './style.css';
import './icons.css';
import { applyCommunityTheme } from './shell/theme.js';
import { $i } from './i.js';
import MkA from './shell/MkA.vue';
import MkLoading from './shell/MkLoading.vue';
import MkPageHeader from './shell/MkPageHeader.vue';
import App from './pages/wordbook.vue';
import SignIn from './shell/SignIn.vue';

applyCommunityTheme();
const app = createApp($i == null ? SignIn : App);
app.component('MkA', MkA).component('MkLoading', MkLoading).component('MkPageHeader', MkPageHeader);
app.mount('#app');
