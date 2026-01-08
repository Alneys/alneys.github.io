import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import VueDevTools from 'vite-plugin-vue-devtools';

// Element Plus (import on demand)
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

// unplugin-fonts
import Unfonts from 'unplugin-fonts/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    VueDevTools(),
    AutoImport({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],
    }),
    Unfonts({
      fontsource: {
        families: ['Noto Sans SC Variable', 'Noto Sans JP Variable', 'Inconsolata Variable'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/',
  server: {
    port: 2563,
    host: '0.0.0.0',
  },
  css: {
    preprocessorOptions: {
      scss: {
        // api: 'modern-compiler', // or "modern", "legacy"
        // Import on demand
        additionalData: `@use "@/assets/styles/element-plus-var.scss" as *;`,
      },
    },
  },
});
