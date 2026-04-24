<script setup lang="ts">
import { useVersionCheck } from '@/composables/useVersionCheck';

const { showUpdatePrompt, reload, dismiss } = useVersionCheck();
</script>

<template>
  <Transition name="slide-up">
    <div v-if="showUpdatePrompt" class="version-update-prompt">
      <span class="prompt-text">检测到新版本，建议刷新获取最新内容</span>
      <el-button type="primary" size="small" @click="reload">刷新</el-button>
      <el-button size="small" @click="dismiss">稍后</el-button>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.version-update-prompt {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);

  .prompt-text {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

@media screen and (max-width: 480px) {
  .version-update-prompt {
    left: 16px;
    right: 16px;
    transform: none;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
