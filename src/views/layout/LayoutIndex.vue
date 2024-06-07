<script setup lang="ts">
import LayoutHeader from './LayoutHeader.vue';
import LayoutMain from './LayoutMain.vue';
import LayoutFooter from './LayoutFooter.vue';
</script>

<template>
  <div id="layout">
    <LayoutHeader></LayoutHeader>
    <LayoutMain></LayoutMain>
    <LayoutFooter></LayoutFooter>
  </div>
</template>

<style lang="scss">
#layout > * > .container {
  margin: 0 auto;
  padding: 8px 32px;
  max-width: 1864px;
}

#layout > * h1.view-title {
  margin-top: 0.25em;
}

@media screen and (max-width: 767px) {
  #layout > * > .container {
    padding: 8px 16px;
  }
}
</style>
