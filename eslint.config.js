import pluginVue from 'eslint-plugin-vue';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import eslintConfigPrettier from '@vue/eslint-config-prettier';

export default [
  {
    ignores: ['.local/**'],
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
