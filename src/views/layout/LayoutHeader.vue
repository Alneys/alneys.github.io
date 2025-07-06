<script setup lang="ts">
import CgssCountdownHeader from '@/components/CgssCountdownHeader.vue';
</script>

<template>
  <header id="layout-header">
    <div class="layout-max-width-container">
      <router-link to="/" class="title"><h1>Alneys.github.io</h1></router-link>
    </div>
    <CgssCountdownHeader></CgssCountdownHeader>
  </header>
</template>

<style lang="scss" scoped>
#layout-header {
  position: sticky;
  top: 0;
  z-index: 39;
  background-color: var(--im-color-miya);
  > div {
    display: flex;
    justify-content: space-between;

    .title {
      color: white;
      text-decoration: none;
      h1 {
        line-height: 1.25;
        margin: 0;
      }
    }
  }
}
</style>
