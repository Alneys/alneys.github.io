/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-idiomatic-order'],
  overrides: [
    {
      files: ['*.scss', '**/*.scss'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['*.vue', '**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
};
