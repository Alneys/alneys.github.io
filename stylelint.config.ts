import { propertyGroups } from 'stylelint-config-clean-order';
import type { Config } from 'stylelint';

const propertiesOrder = propertyGroups.map((properties) => ({
  noEmptyLineBetween: true,
  emptyLineBefore: 'never',
  properties,
}));

export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-standard-vue/scss',
    'stylelint-config-clean-order',
  ],
  rules: {
    'order/properties-order': [propertiesOrder],
    'selector-class-pattern': [
      '^(?:el-.*|[a-z][a-z0-9]*(?:-[a-z0-9]+)*)$',
      { resolveNestedSelectors: true },
    ],

    // Disabled rules (from stylelint-config-standard) that caused errors
    'no-empty-source': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'at-rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'color-hex-length': null,
    'media-feature-range-notation': null,
    'value-keyword-case': null,
    'property-no-vendor-prefix': null,
    'font-family-name-quotes': null,
    'shorthand-property-no-redundant-values': null,
    'scss/double-slash-comment-empty-line-before': null,
  },
} satisfies Config;
