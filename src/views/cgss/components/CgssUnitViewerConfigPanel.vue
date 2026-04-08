<template>
  <div class="unit-viewer-config">
    <!-- 名字筛选 -->
    <div style="display: flex; align-items: center">
      <el-switch v-model="nameFilterEnabled" active-text="筛选名字" />
      <el-select
        v-if="nameFilterEnabled"
        v-model="selectedFilterIndex"
        placeholder="选择预设筛选"
        style="width: 18em; margin-left: 1em"
      >
        <el-option
          v-for="(item, index) in nameFilterDataList"
          :key="index"
          :label="item.information"
          :value="index"
        />
      </el-select>
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
    </div>

    <!-- 点击图标操作 -->
    <div>
      <span class="el-switch__label">点击图标操作</span>
      <el-segmented v-model="clickIconAction" :options="clickActionOptions" />
    </div>

    <!-- 状态管理 -->
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

    <!-- 全局控制 -->
    <div>
      <el-switch v-model="showSimpleLabels" active-text="简单标题" />
      <el-switch v-model="showExtraTableConfig" active-text="更多表格选项" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import CgssUnitViewerStateManager from './CgssUnitViewerStateManager.vue';
import { type TableDataRow } from '../CgssUnitViewerTypes';
import nameFilterData from '../data/cgss_name_filter.json';

// 传入属性
const props = defineProps<{
  tableData: TableDataRow[];
}>();

// 自定义事件
const emit = defineEmits<{
  toggleAllBrightness: [];
  updateCardStatus: [disabledCids: string[]];
}>();

// 双向绑定
const nameFilterEnabled = defineModel<boolean>('nameFilterEnabled', { default: false });
const nameFilter = defineModel<string>('nameFilter', { default: '' });
const clickIconAction = defineModel<string>('clickIconAction', { default: 'None' });
const showSimpleLabels = defineModel<boolean>('showSimpleLabels', { default: false });
const showExtraTableConfig = defineModel<boolean>('showExtraTableConfig', { default: true });

// 名字筛选数据
const nameFilterDataList = nameFilterData;
const selectedFilterIndex = ref<number>();

// 监听下拉选择变化，更新筛选内容
watch(selectedFilterIndex, (newIndex) => {
  if (newIndex !== undefined && newIndex >= 0) {
    nameFilter.value = nameFilterDataList[newIndex]!.nameFilter;
  }
});

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
