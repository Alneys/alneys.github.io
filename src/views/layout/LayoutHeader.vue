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
  top: 0;
  z-index: 39;
  background-color: var(--im-color-miya);
  > div {
    display: flex;
    justify-content: space-between;

    .title {
      text-decoration: none;
      h1 {
        color: white;
        line-height: 1.25;
        margin: 0;
      }
    }
  }

  .switch-dark {
    --el-switch-on-color: #4c4d4f;
    --el-switch-off-color: var(--im-color-miya);
    --el-switch-border-color: rgba(255, 255, 255, 0.4);
  }
}
</style>
