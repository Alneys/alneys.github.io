<template>
  <div class="anni-calc-state-manager">
    <slot name="prefix" />
    <div>
      <el-button type="primary" @click="handleSaveToLocalStorage">保存输入到浏览器</el-button>
    </div>
    <div>
      <el-button @click="handleLoadFromLocalStorage"
        >读取缓存（需要手动重新获取剩余时间）</el-button
      >
    </div>
    <div>
      <el-button @click="handleClearLocalStorage">清除缓存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  saveToLocalStorage: () => boolean;
  loadFromLocalStorage: () => boolean;
  clearLocalStorage: () => boolean;
}>();

const handleSaveToLocalStorage = () => {
  try {
    const success = props.saveToLocalStorage();
    if (success) {
      ElMessage.success('保存成功');
    } else {
      ElMessage.error('保存失败');
    }
  } catch (error) {
    ElMessage.error('保存失败');
    throw error;
  }
};

const handleLoadFromLocalStorage = () => {
  try {
    const success = props.loadFromLocalStorage();
    if (success) {
      ElMessage.success('读取成功，如需更新实际剩余时间请点击「重新获取剩余时间」');
    } else {
      ElMessage.error('读取失败：没有数据');
    }
  } catch (error) {
    ElMessage.error('读取失败');
    throw error;
  }
};

const handleClearLocalStorage = () => {
  try {
    const success = props.clearLocalStorage();
    if (success) {
      ElMessage.success('清除成功');
    } else {
      ElMessage.error('清除失败');
    }
  } catch (error) {
    ElMessage.error('清除失败');
    throw error;
  }
};
</script>

<style lang="scss" scoped>
.anni-calc-state-manager {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;

  > div {
    display: flex;
    align-items: center;
  }
}
</style>
