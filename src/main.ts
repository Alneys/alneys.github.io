import { createPinia } from 'pinia';
import { createApp } from 'vue';
// Element Plus (disabled when importing on demand)
// import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css';
// import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';
import inputmodeDirective from './utils/directives/inputmode';

// self-host fonts
import 'unfonts.css';
import 'nprogress/nprogress.css';
import '@/assets/styles/main.scss';

// MSW mocks
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
  const { worker } = await import('./mocks/browser');
  worker.start({ onUnhandledRequest: 'bypass' });
}

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
