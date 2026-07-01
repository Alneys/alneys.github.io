<template>
  <header id="layout-header">
    <div class="layout-max-width-container">
      <router-link to="/" class="title"><h1>Alneys.github.io</h1></router-link>
      <div class="right-actions">
        <el-button :icon="InfoFilled" circle text @click="router.push('/about')" />
        <el-button :icon="HomeFilled" circle text @click="router.push('/')" />
        <el-switch
          v-model="isDark"
          class="switch-dark"
          :inactive-action-icon="Sunny"
          :active-action-icon="Moon"
        />
      </div>
    </div>
    <!-- <CgssCountdownHeader /> -->
  </header>
</template>
<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { useRouter } from 'vue-router';

import { Sunny, Moon, HomeFilled, InfoFilled } from '@element-plus/icons-vue';

import CgssCountdownHeader from '@/components/CgssCountdownHeader.vue';

const router = useRouter();
const isDark = useDark();
</script>

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

    padding-left: 8px;
  }

  .right-actions {
    display: flex;
    gap: 8px;
    align-items: center;

    .el-button {
      --el-fill-color: var(--el-color-primary-light-5);
      --el-fill-color-light: var(--el-color-primary-light-3);

      font-size: 18px;
      color: white;
    }

    .el-button + .el-button {
      margin-left: 0;
    }
  }
}
</style>
