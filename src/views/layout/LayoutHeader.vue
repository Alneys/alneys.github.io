<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { Sunny, Moon } from '@element-plus/icons-vue';
import CgssCountdownHeader from '@/components/CgssCountdownHeader.vue';

const isDark = useDark();
</script>

<template>
  <header id="layout-header">
    <div class="layout-max-width-container">
      <router-link to="/" class="title"><h1>Alneys.github.io</h1></router-link>
      <el-switch v-model="isDark" :inactive-action-icon="Sunny" :active-action-icon="Moon" />
    </div>
    <!-- <CgssCountdownHeader></CgssCountdownHeader> -->
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
