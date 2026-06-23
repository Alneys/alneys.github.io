<template>
  <div class="cgss-unit-viewer">
    <h1 class="view-title">偶像大师灰姑娘女孩星光舞台 组队信息</h1>
    <div class="al-divider"></div>

    <div v-if="error" class="error-container">
      <el-alert type="error" title="数据加载失败" :description="error.message" />
    </div>

    <div v-else v-loading="loading" element-loading-text="加载中...">
      <CgssUnitViewerConfigPanel
        v-model:name-filter-enabled="switchNameFilter"
        v-model:name-filter="inputNameFilter"
        v-model:click-icon-action="switchClickIconAction"
        v-model:show-simple-labels="switchShowSimpleLabels"
        v-model:show-extra-table-config="switchShowExtraTableConfig"
        @toggle-all-brightness="toggleAllBrightness"
        @update-card-status="handleUpdateCardStatus"
      />
      <div class="al-divider"></div>
      <CgssUnitViewerResonanceTable
        ref="resonanceTableRef"
        v-model:table-data="resonanceTableData"
        v-model:show-extra-columns="switchShowExtraColumns"
        :skill-data="skillData"
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
        :skill-data="skillData"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue';

import { type TableDataRow, type CgssCardSkillTableItem } from './CgssUnitViewerTypes';
import CgssUnitViewerConfigPanel from './components/CgssUnitViewerConfigPanel.vue';
import CgssUnitViewerDominantTable from './components/CgssUnitViewerDominantTable.vue';
import CgssUnitViewerResonanceTable from './components/CgssUnitViewerResonanceTable.vue';
import { useCardBrightness } from './composables/useCardBrightness';
import { useCardFilter } from './composables/useCardFilter';
import { useCardSkillData } from './composables/useCardSkillData';

const { inputNameFilter } = useCardFilter();
const { toggleAllBrightness: toggleAll, setBrightnessByCids } = useCardBrightness();
const { data, loading, error, loadData } = useCardSkillData();

const skillData = ref<CgssCardSkillTableItem[] | null>(null);

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

const resonanceTableData = ref<TableDataRow[]>([]);
const dominantTableData = ref<TableDataRow[]>([]);

const resonanceTableRef =
  useTemplateRef<InstanceType<typeof CgssUnitViewerResonanceTable>>('resonanceTableRef');
const dominantTableRef =
  useTemplateRef<InstanceType<typeof CgssUnitViewerDominantTable>>('dominantTableRef');

const toggleAllBrightness = () => {
  toggleAll([resonanceTableData, dominantTableData]);
};

const handleUpdateCardStatus = (disabledCids: string[]) => {
  setBrightnessByCids(disabledCids);
};

const handleIconClick = (payload: { row: TableDataRow; column: string; index: number }) => {};

onMounted(async () => {
  await loadData();
  skillData.value = data.value;
});
</script>

<style lang="scss" scoped>
.el-link {
  vertical-align: inherit;
}

.unit-information {
  margin: 1em 0;
}

.error-container {
  margin: 1em 0;
}
</style>
