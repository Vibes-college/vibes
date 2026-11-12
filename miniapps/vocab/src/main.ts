// SPDX-License-Identifier: AGPL-3.0-only
// 词汇线小程序（/apps/vocab/<站>）的入口：铺社区配色、挂几个社区组件的替身、打开这一站。要登录（和社区里一样）。
import { createApp } from 'vue';
import './style.css';
import './icons.css';
import { applyCommunityTheme } from './shell/theme.js';
import { $i } from './i.js';
import { APP_BASE } from './router.js';
import MkA from './shell/MkA.vue';
import MkLoading from './shell/MkLoading.vue';
import MkPageHeader from './shell/MkPageHeader.vue';
import App from './pages/vocab.vue';
import SignIn from './shell/SignIn.vue';

applyCommunityTheme();
// 社区里是 /vocab/:stop 路由给的 props；这里自己从地址里读：/apps/vocab/5.2 → 5.2，什么都没有就从第一站 5.1 开始。
const stop = decodeURIComponent(location.pathname.slice(APP_BASE.length).replace(/\/+$/, '')) || '5.1';
const app = createApp($i == null ? SignIn : App, $i == null ? {} : { stop });
app.component('MkA', MkA).component('MkLoading', MkLoading).component('MkPageHeader', MkPageHeader);
app.mount('#app');
