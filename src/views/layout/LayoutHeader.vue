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
      <el-switch
        v-model="isDark"
        class="switch-dark"
        :inactive-action-icon="Sunny"
        :active-action-icon="Moon"
      />
    </div>
    <!-- <CgssCountdownHeader></CgssCountdownHeader> -->
  </header>
</template>

<style lang="scss" scoped>
#layout-header {
  position: sticky;
  z-index: 39;
  top: 0;
  background-color: var(--im-color-ml-miya);

  > div {
    display: flex;
    justify-content: space-between;

    .title {
      text-decoration: none;

      h1 {
        margin: 0;
        line-height: 1.25;
        color: white;
      }
    }
  }

  .switch-dark {
    --el-switch-on-color: #4c4d4f;
    --el-switch-off-color: var(--im-color-ml-miya);
    --el-switch-border-color: rgba(255, 255, 255, 0.4);
  }
}
</style>
