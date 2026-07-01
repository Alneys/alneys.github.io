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

#layout .view-title {
  margin-top: 8px;
  margin-bottom: 4px;
  line-height: 1;

  h1 {
    margin: 0;
  }
}

@media screen and (max-width: 767px) {
  #layout .layout-max-width-container {
    padding: 8px 16px;
  }
}
</style>
