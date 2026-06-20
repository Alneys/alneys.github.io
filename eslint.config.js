import pluginVue from 'eslint-plugin-vue';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import eslintConfigPrettier from '@vue/eslint-config-prettier';

/** @type {import('eslint/config').Config[]} */
export default [
  {
    ignores: [
      '.local/**',
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      'coverage/**',
      '*.tsbuildinfo',
      'components.d.ts',
      'auto-imports.d.ts',
    ],
  },
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  eslintConfigPrettier,

  {
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'vue/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
