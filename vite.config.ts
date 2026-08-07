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

// custom plugins
import { versionCheckPlugin } from './src/version-check/plugin.ts';

// gzip compression
import { compression } from 'vite-plugin-compression2';

// bundle report
//   REPORT=html -> HTML treemap (stats.html)
//   REPORT=md   -> Markdown report (.temp/report.md)
import { visualizer } from 'rollup-plugin-visualizer';

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
    versionCheckPlugin(),
    compression({
      algorithms: ['gzip'],
      threshold: 1024,
    }),
    process.env.REPORT === 'html'
      ? visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
          filename: 'node_modules/.cache/visualizer.html',
        })
      : process.env.REPORT === 'md' &&
        visualizer({
          open: false,
          gzipSize: true,
          brotliSize: true,
          filename: 'node_modules/.cache/visualizer.md',
          template: 'markdown',
        }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/',
  server: {
    port: 8563,
    host: '0.0.0.0',
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'echarts',
              test: /node_modules[\\/]echarts/,
            },
          ],
        },
      },
    },
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
