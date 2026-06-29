<template>
  <header id="layout-header">
    <div class="layout-max-width-container">
      <router-link to="/" class="title"><h1>Alneys.github.io</h1></router-link>
      <div class="right-actions">
        <el-button :icon="HomeFilled" circle text @click="goHome" />
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

import { Sunny, Moon, HomeFilled } from '@element-plus/icons-vue';

import CgssCountdownHeader from '@/components/CgssCountdownHeader.vue';

const router = useRouter();
const isDark = useDark();

function goHome() {
  if (router.currentRoute.value.path !== '/') {
    router.push('/');
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
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
  }
}
</style>
