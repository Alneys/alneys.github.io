<script setup lang="ts">
import { useVersionCheck } from '@/composables/useVersionCheck';

import LayoutFooter from './LayoutFooter.vue';
import LayoutHeader from './LayoutHeader.vue';
import LayoutMain from './LayoutMain.vue';

useVersionCheck();
</script>

<template>
  <div id="layout">
    <LayoutHeader />
    <LayoutMain />
    <LayoutFooter />
  </div>
</template>

<style lang="scss">
#layout .layout-max-width-container {
  max-width: 1664px;
  margin: 0 auto;
  padding: 8px 32px;
}

#layout h1.view-title {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
  line-height: 1;
}

#layout .view-page-header {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
  font-size: 24px;
  line-height: 1;

  .el-page-header__content h1 {
    margin-top: 0;
    margin-bottom: 0;
  }
}

@media screen and (max-width: 767px) {
  #layout .layout-max-width-container {
    padding: 8px 16px;
  }
}
</style>
