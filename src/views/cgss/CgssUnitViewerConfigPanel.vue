<template>
  <div class="unit-viewer-config">
    <!-- 名字筛选 -->
    <div>
      <el-switch v-model="nameFilterEnabled" active-text="筛选名字" />
    </div>
    <div v-if="nameFilterEnabled">
      <el-input
        v-model="nameFilter"
        class="config-name-filter-input"
        placeholder="请输入名字，分割符号可以使用空格，换行，半角逗号或者全角顿号里面的任何符号，名字里面请不要输入空格"
        type="textarea"
        :rows="3"
        clearable
      />
      <div v-if="nameFilterDefaultInformation">{{ nameFilterDefaultInformation }}</div>
    </div>

    <!-- 点击图标操作 -->
    <div>
      <span class="el-switch__label">点击图标操作</span>
      <el-segmented v-model="clickIconAction" :options="clickActionOptions" />
    </div>

    <!-- StateManager -->
    <CgssUnitViewerStateManager
      v-if="clickIconAction === 'ToggleCardStatus'"
      :table-data="tableData"
      @update-card-status="(cids) => emit('updateCardStatus', cids)"
    >
      <template #prefix>
        <div>
          <el-button type="primary" size="default" @click="emit('toggleAllBrightness')">
            切换所有状态
          </el-button>
        </div>
      </template>
    </CgssUnitViewerStateManager>

    <!-- 通用开关 -->
    <div>
      <el-switch v-model="showSimpleLabels" active-text="简单标题" />
      <el-switch v-model="showExtraTableConfig" active-text="更多表格选项" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CgssUnitViewerStateManager from './CgssUnitViewerStateManager.vue';
import { type TableDataRow } from './CgssUnitViewerTypes';

// Props
const props = defineProps<{
  nameFilterDefaultInformation: string;
  tableData: TableDataRow[];
}>();

// v-model 双向绑定
const nameFilterEnabled = defineModel<boolean>('nameFilterEnabled', { default: false });
const nameFilter = defineModel<string>('nameFilter', { default: '' });
const clickIconAction = defineModel<string>('clickIconAction', { default: 'None' });
const showSimpleLabels = defineModel<boolean>('showSimpleLabels', { default: false });
const showExtraTableConfig = defineModel<boolean>('showExtraTableConfig', { default: true });

// Emits
const emit = defineEmits<{
  toggleAllBrightness: [];
  updateCardStatus: [disabledCids: string[]];
}>();

// 点击操作选项（静态数据）
const clickActionOptions = [
  { label: '无', value: 'None' },
  { label: '切换卡片亮度', value: 'ToggleCardStatus' },
  { label: '在346lab查看卡片详情', value: 'ViewCardInfo' },
];
</script>

<style lang="scss" scoped>
.unit-viewer-config {
  > div {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5em;
    margin: 0.5em 0;
  }
  .config-name-filter-input {
    font-family: var(--al-font-family-jp);
    ::placeholder {
      font-family: var(--al-font-family);
    }
  }
}
</style>
