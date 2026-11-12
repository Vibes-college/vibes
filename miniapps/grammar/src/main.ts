// SPDX-License-Identifier: AGPL-3.0-only
// 语法课小程序（/apps/grammar/<站>）的入口：铺社区配色、挂几个社区组件的替身、打开这一站的讲解。要登录（和社区里一样，
// 例句的朗读走社区的朗读接口）。纯静态：没有自己的服务器和数据，由门口的 Caddy 直接发文件。
import { createApp } from 'vue';
import './style.css';
import './icons.css';
import { applyCommunityTheme } from './shell/theme.js';
import { $i } from './i.js';
import { APP_BASE } from './router.js';
import MkA from './shell/MkA.vue';
import MkLoading from './shell/MkLoading.vue';
import MkPageHeader from './shell/MkPageHeader.vue';
import App from './pages/grammar.vue';
import SignIn from './shell/SignIn.vue';

applyCommunityTheme();
// 社区里是 /grammar/:stop 路由给的 props；这里自己从地址里读：/apps/grammar/6.2 → 6.2，什么都没有就从第一站 6.1 开始。
// 从社区页面里点过来时，社区会换成 /apps/grammar/6.2/index.html（绕开旧的离线缓存），所以去掉末尾的 index.html。
const stop = decodeURIComponent(location.pathname.slice(APP_BASE.length).replace(/(\/index\.html)?\/*$/, '')) || '6.1';
const app = createApp($i == null ? SignIn : App, $i == null ? {} : { stop });
app.component('MkA', MkA).component('MkLoading', MkLoading).component('MkPageHeader', MkPageHeader);
app.mount('#app');
