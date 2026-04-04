<template>
  <div class="cgss-unit-viewer">
    <h1 class="view-title">偶像大师灰姑娘女孩星光舞台 组队信息</h1>
    <div class="al-divider"></div>
    <div class="unit-viewer-config">
      <div>
        <el-switch v-model="switchNameFilter" active-text="筛选名字" />
      </div>
      <div v-if="switchNameFilter">
        <el-input
          v-model="inputNameFilter"
          class="config-name-filter-input"
          placeholder="请输入名字，分割符号可以使用空格，换行，半角逗号或者全角顿号里面的任何符号，名字里面请不要输入空格"
          type="textarea"
          :rows="3"
          clearable
        ></el-input>
        <div v-if="inputNameFilterDefaultInformation">{{ inputNameFilterDefaultInformation }}</div>
      </div>
      <div>
        <span class="el-switch__label">点击图标操作</span>
        <el-segmented
          v-model="switchClickIconAction"
          :options="[
            { label: '无', value: 'None' },
            { label: '切换卡片状态', value: 'ToggleCardStatus' },
            { label: '在346lab查看卡片详情', value: 'ViewCardInfo' },
          ]"
        ></el-segmented>
      </div>
      <CgssUnitViewerStateManager
        v-if="switchClickIconAction === 'ToggleCardStatus'"
        :table-data="combinedTableData"
        @update-card-status="handleUpdateCardStatus"
      >
        <template #prefix>
          <div>
            <el-button type="primary" size="default" @click="toggleAllBrightness">
              切换所有状态
            </el-button>
          </div>
        </template>
      </CgssUnitViewerStateManager>
      <div>
        <el-switch v-model="switchShowSimpleLabels" active-text="简单标题" />
        <el-switch v-model="switchShowExtraTableConfig" active-text="更多表格选项" />
      </div>
    </div>
    <div class="al-divider"></div>
    <!-- Resonance 子组件 -->
    <CgssUnitViewerResonanceTable
      ref="resonanceTableRef"
      v-model:show-extra-columns="switchShowExtraColumns"
      :show-simple-labels="switchShowSimpleLabels"
      :click-icon-action="switchClickIconAction"
      :name-filter="switchNameFilter ? inputNameFilter : ''"
      :show-extra-table-config="switchShowExtraTableConfig"
      @icon-click="handleIconClick"
    />
    <div class="al-divider"></div>
    <!-- Dominant 子组件 -->
    <CgssUnitViewerDominantTable
      ref="dominantTableRef"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CgssUnitViewerStateManager from './CgssUnitViewerStateManager.vue';
import CgssUnitViewerResonanceTable from './CgssUnitViewerResonanceTable.vue';
import CgssUnitViewerDominantTable from './CgssUnitViewerDominantTable.vue';
import { type TableDataRow } from './CgssUnitViewerTypes';
import { useCardFilter } from './composables/useCardFilter';

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

// 名字筛选
const { inputNameFilter, inputNameFilterDefaultInformation } = useCardFilter();

// 子组件引用
const resonanceTableRef = ref<InstanceType<typeof CgssUnitViewerResonanceTable>>();
const dominantTableRef = ref<InstanceType<typeof CgssUnitViewerDominantTable>>();

// 合并子组件数据（用于 StateManager）
const combinedTableData = computed<TableDataRow[]>(() => {
  const resonanceData = resonanceTableRef.value?.getData() ?? [];
  const dominantData = dominantTableRef.value?.getData() ?? [];
  return [...resonanceData, ...dominantData];
});

// 切换所有亮度
const toggleAllBrightness = () => {
  resonanceTableRef.value?.toggleAllBrightness();
  dominantTableRef.value?.toggleAllBrightness();
};

// 更新卡片状态（从 StateManager 接收）
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
.unit-information {
  margin: 1em 0;
}
</style>
