import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Element Plus (disabled when importing on demand)
// import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css';
// import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';

import inputmodeDirective from './utils/directives/inputmode';

import '@/assets/styles/main.scss';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.directive('inputmode', inputmodeDirective);

// Element Plus (disabled when importing on demand)
// app.use(ElementPlus);
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component);
// }

app.mount('#app');
