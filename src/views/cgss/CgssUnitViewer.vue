<template>
  <div class="cgss-unit-viewer">
    <h1 class="view-title">偶像大师灰姑娘女孩星光舞台 组队信息</h1>
    <div class="al-divider"></div>
    <CgssUnitViewerConfigPanel
      v-model:name-filter-enabled="switchNameFilter"
      v-model:name-filter="inputNameFilter"
      v-model:click-icon-action="switchClickIconAction"
      v-model:show-simple-labels="switchShowSimpleLabels"
      v-model:show-extra-table-config="switchShowExtraTableConfig"
      :table-data="combinedTableData"
      @toggle-all-brightness="toggleAllBrightness"
      @update-card-status="handleUpdateCardStatus"
    />
    <div class="al-divider"></div>
    <CgssUnitViewerResonanceTable
      ref="resonanceTableRef"
      v-model:table-data="resonanceTableData"
      v-model:show-extra-columns="switchShowExtraColumns"
      :show-simple-labels="switchShowSimpleLabels"
      :click-icon-action="switchClickIconAction"
      :name-filter="switchNameFilter ? inputNameFilter : ''"
      :show-extra-table-config="switchShowExtraTableConfig"
      @icon-click="handleIconClick"
    />
    <div class="al-divider"></div>
    <CgssUnitViewerDominantTable
      ref="dominantTableRef"
      v-model:table-data="dominantTableData"
      v-model:show-extra-columns="switchShowExtraColumns"
      v-model:show-overload-overdrive="switchShowOverloadOverdrive"
      v-model:show-specialize-not-match="switchShowSpecializeNotMatch"
      v-model:show-all-attribute-pairs="switchShowAllAttributeSpecializePairs"
      v-model:show-sort-related-skills-only="switchShowSortRelatedSkillsOnly"
      v-model:highlight-season-limited="switchHighlightSeasonLimited"
      :show-simple-labels="switchShowSimpleLabels"
      :click-icon-action="switchClickIconAction"
      :name-filter="switchNameFilter ? inputNameFilter : ''"
      :show-extra-table-config="switchShowExtraTableConfig"
      @icon-click="handleIconClick"
    />
    <div class="al-divider"></div>
    <div class="unit-information">
      <p>建议在1080P或以上分辨率屏幕上使用，针对移动端做了少许优化</p>
      <p>
        特别感谢：<el-link href="https://starlight.346lab.org" target="_blank"
          >https://starlight.346lab.org</el-link
        >
      </p>
      <p>
        Special Thanks:
        <el-link href="https://starlight.kirara.ca" target="_blank"
          >https://starlight.kirara.ca</el-link
        >
      </p>
      <p>本组件全程使用氛围编程，项目初期使用了 Qwen2.5-Max 与 Qwen3-Max，项目重构使用了 GLM-5</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue';
import CgssUnitViewerConfigPanel from './components/CgssUnitViewerConfigPanel.vue';
import CgssUnitViewerResonanceTable from './components/CgssUnitViewerResonanceTable.vue';
import CgssUnitViewerDominantTable from './components/CgssUnitViewerDominantTable.vue';
import { type TableDataRow } from './CgssUnitViewerTypes';
import { useCardFilter } from './composables/useCardFilter';

// 组合式函数：名字筛选
const { inputNameFilter } = useCardFilter();

// 配置开关
const switchClickIconAction = ref('None');
const switchNameFilter = ref(false);
const switchShowSimpleLabels = ref(window.innerWidth < 768);
const switchShowExtraTableConfig = ref(true);
const switchShowExtraColumns = ref(false);
const switchShowOverloadOverdrive = ref(true);
const switchShowSpecializeNotMatch = ref(false);
const switchShowAllAttributeSpecializePairs = ref(false);
const switchShowSortRelatedSkillsOnly = ref(false);
const switchHighlightSeasonLimited = ref(false);

// 表格数据（通过 v-model 从子组件接收）
const resonanceTableData = ref<TableDataRow[]>([]);
const dominantTableData = ref<TableDataRow[]>([]);

const combinedTableData = computed<TableDataRow[]>(() => {
  return [...resonanceTableData.value, ...dominantTableData.value];
});

const resonanceTableRef =
  useTemplateRef<InstanceType<typeof CgssUnitViewerResonanceTable>>('resonanceTableRef');
const dominantTableRef =
  useTemplateRef<InstanceType<typeof CgssUnitViewerDominantTable>>('dominantTableRef');

// 切换所有亮度
const toggleAllBrightness = () => {
  resonanceTableRef.value?.toggleAllBrightness();
  dominantTableRef.value?.toggleAllBrightness();
};

// 更新卡片状态
const handleUpdateCardStatus = (disabledCids: string[]) => {
  resonanceTableRef.value?.updateBrightnessByCids(disabledCids);
  dominantTableRef.value?.updateBrightnessByCids(disabledCids);
};

// 处理图标点击（用于状态同步，如需要）
const handleIconClick = (payload: { row: TableDataRow; column: string; index: number }) => {
  // 如果需要跨组件同步，可以在这里处理
  // 当前设计下，每个子组件独立管理自己的状态
};
</script>

<style lang="scss" scoped>
.el-link {
  vertical-align: inherit;
}
.unit-information {
  margin: 1em 0;
}
</style>
