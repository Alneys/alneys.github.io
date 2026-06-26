<template>
  <div class="cgss-unit-viewer-resonance-table" :class="{ 'is-dark': isDark }">
    <div id="unit-resonance" class="unit-title" style="font-weight: bold">共鸣 Resonance</div>
    <div v-if="showExtraTableConfig" class="unit-viewer-config">
      <div>
        <el-switch v-model="showExtraColumns" active-text="额外技能" />
      </div>
    </div>
    <div class="unit-table">
      <el-table
        :data="tableData"
        style="width: 100%"
        :max-height="isMobile ? 560 : 9999"
        border
        :span-method="tableResonanceSpanMethod"
        @sort-change="handleResonanceSortChange"
      >
        <!-- 第一列：属性 -->
        <el-table-column
          prop="specialize"
          label="属性"
          :width="80"
          :fixed="!isSmallScreen ? 'left' : undefined"
          sortable
          :sort-orders="['ascending', 'descending']"
          :sort-method="sortResonanceSpecialize"
        >
          <template #default="scope">
            <span :class="`table-row-info color-cg-${scope.row.specialize}`">
              {{ scope.row.specialize }}
            </span>
          </template>
        </el-table-column>
        <!-- 第二列：间隔值 -->
        <el-table-column
          prop="tw"
          label="间隔"
          :width="60"
          sortable
          :sort-method="sortTableTw"
          :sort-orders="['ascending', 'descending']"
          :fixed="!isSmallScreen ? 'left' : undefined"
        >
          <template #default="scope">
            <span style="font-weight: bold">
              {{ scope.row.tw ? scope.row.tw + 's' : '' }}
            </span>
          </template>
        </el-table-column>
        <!-- 后续列：根据tableResonanceColumnHeader动态生成 -->
        <template
          v-for="(headerItem, headerIndex) in tableResonanceColumnHeader"
          :key="headerItem.prop"
        >
          <el-table-column
            v-if="!headerItem.extraColumn || showExtraColumns"
            :prop="headerItem.prop"
            :label="
              showSimpleLabels ? headerItem.labelCn : `${headerItem.labelCn} ${headerItem.labelEn}`
            "
            :class-name="`icons skill-${headerItem.skill ?? headerItem.prop}`"
            :min-width="isSmallScreen ? headerItem.minWidthSmallScreen : headerItem.minWidth"
          >
            <template #default="scope">
              <div class="table-icons">
                <img
                  v-for="(icon, iconIndex) in scope.row[headerItem.prop]"
                  :key="iconIndex"
                  :class="{
                    'cgss-icon': true,
                    'icon-dark':
                      clickIconAction === 'ToggleCardStatus' && !isCardBright(icon.card.cid),
                    'icon-extra': headerItem.extraColumn,
                    'icon-filter-not-match': nameFilter && !isNameMatched(icon.card.name),
                    'icon-filter-match': nameFilter && isNameMatched(icon.card.name),
                  }"
                  :src="`/static/images/cgss/icon_${icon.card.cid}.jpg`"
                  @mouseenter="
                    tooltip.show(icon.card, $event.currentTarget as HTMLElement, {
                      vocal: scope.row.specialize === 'vocal',
                      dance: scope.row.specialize === 'dance',
                      visual: scope.row.specialize === 'visual',
                    })
                  "
                  @mouseleave="tooltip.hide()"
                  @click="
                    onIconClick(scope.row as TableDataRow, headerItem.prop, Number(iconIndex))
                  "
                />
                <div v-if="scope.row[headerItem.prop].length === 0">x</div>
              </div>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>
    <CgssUnitViewerTooltipPortal
      :visible="tooltip.visible.value"
      :card="tooltip.card.value"
      :trigger-element="tooltip.triggerElement.value"
      :underline-props="tooltip.underlineProps"
    />
  </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { ref, shallowRef, computed, watch, toRef, onUnmounted } from 'vue';

import type { TableColumnCtx } from 'element-plus';

import { useResponsive } from '@/composables/useResponsive';

import {
  type CgssCardSkillTableItem,
  type TableDataRow,
  tableResonanceRowHeaderAttribute,
  tableResonanceRowHeaderSpecialize,
  tableResonanceRowHeaderTw,
  tableResonanceColumnHeader,
} from '../CgssUnitViewerTypes';
import { useCardFilter } from '../composables/useCardFilter';
import { useCardTooltip } from '../composables/useCardTooltip';
import { useIconActions } from '../composables/useIconActions';
import {
  sortTableTw,
  createCardDataItem,
  sortCardsByParam,
  sortResonanceSpecialize,
} from '../composables/useTableUtils';
import CgssUnitViewerTooltipPortal from './CgssUnitViewerTooltipPortal.vue';

// 传入属性
const props = defineProps<{
  originalData: CgssCardSkillTableItem[] | null;
  showSimpleLabels: boolean;
  clickIconAction: string;
  nameFilter: string;
  showExtraTableConfig: boolean;
  tableData?: TableDataRow[];
}>();

// 自定义事件
const emit = defineEmits<{
  iconClick: [payload: { row: TableDataRow; column: string; index: number }];
  'update:tableData': [value: TableDataRow[]];
}>();

// 双向绑定 — 使用 shallowRef 避免深层数组的深度代理开销
const tableData = shallowRef<TableDataRow[]>(props.tableData ?? []);

// 父 → 子 同步
watch(
  () => props.tableData,
  (val) => {
    if (val) tableData.value = val;
  },
  { immediate: true },
);

// 子 → 父 同步
watch(tableData, (val) => {
  emit('update:tableData', val);
});

const showExtraColumns = defineModel<boolean>('showExtraColumns', { default: false });

// 组合式函数：响应式布局
const { isMobile, isSmallScreen } = useResponsive();

// 组合式函数：名字筛选（传入 props.nameFilter 的 ref）
const { isNameMatched } = useCardFilter(toRef(props, 'nameFilter'));

// 组合式函数：暗色模式
const isDark = useDark();

// 单例 tooltip 状态（替代每个图标一个 el-tooltip 实例）
const tooltip = useCardTooltip();
onUnmounted(() => {
  tooltip.dispose();
});

// 排序状态：子组件内部维护
const currentSortField = ref('specialize');

// 初始化函数
const initializeData = (data: CgssCardSkillTableItem[]): TableDataRow[] => {
  const result: TableDataRow[] = [];

  tableResonanceRowHeaderSpecialize.forEach((specialize) => {
    tableResonanceRowHeaderTw.forEach((tw) => {
      const row: TableDataRow = {
        specialize: specialize,
        tw: tw,
        row: result.length,
      };

      tableResonanceColumnHeader.forEach((column) => {
        row[column.prop] = [];
      });

      result.push(row);
    });
  });

  data.forEach((item: CgssCardSkillTableItem) => {
    if (item.rarity !== 'ssr') {
      return;
    }

    const getSpecializeByStats = (stats: { vocal: any; visual: any; dance: any }) => {
      const { vocal, dance, visual } = stats;
      if (vocal >= dance && vocal >= visual) return 'vocal';
      if (dance >= vocal && dance >= visual) return 'dance';
      return 'visual';
    };

    const actualSpecialize = getSpecializeByStats(item.stats);
    const specializeIndex = tableResonanceRowHeaderSpecialize.indexOf(actualSpecialize);
    if (specializeIndex === -1) {
      return;
    }

    let twIndex = tableResonanceRowHeaderTw.indexOf(String(item.skill.params.tw));
    if (item.skill.type === 'magic') {
      twIndex = tableResonanceRowHeaderAttribute.indexOf(String(item.attribute.toLowerCase()));
    }
    if (twIndex === -1) {
      return;
    }

    const rowIndex = specializeIndex * tableResonanceRowHeaderTw.length + twIndex;

    const columnInfo = tableResonanceColumnHeader.find((col) => col.skill === item.skill.type);
    if (!columnInfo) {
      return;
    }
    const colName = columnInfo.prop;

    if (Array.isArray(result[rowIndex]?.[colName])) {
      result[rowIndex][colName].push(createCardDataItem(item));
    }
  });

  result.forEach((row) => {
    const statKey = row.specialize as keyof CgssCardSkillTableItem['stats'];

    tableResonanceColumnHeader.forEach((header) => {
      const columnName = header.prop;
      const cardsInColumn = row[columnName];

      if (Array.isArray(cardsInColumn) && cardsInColumn.length > 0) {
        row[columnName] = sortCardsByParam(cardsInColumn, statKey);
      }
    });
  });

  return result;
};

watch(
  () => props.originalData,
  (newData) => {
    if (newData) {
      tableData.value = initializeData(newData);
    }
  },
  { immediate: true },
);

const clickIconActionRef = computed(() => props.clickIconAction);

// 组合式函数：亮度状态
const {
  handleIconClick,
  toggleAllIconsBrightness,
  updateCardBrightnessByCids,
  updateCardBrightnessByName,
  setAllIconsBrightness,
  isCardBright,
} = useIconActions([tableData], clickIconActionRef);

// 暴露属性
defineExpose({
  toggleAllBrightness: toggleAllIconsBrightness,
  updateBrightnessByCids: updateCardBrightnessByCids,
  updateCardBrightnessByName,
  setAllIconsBrightness,
});

// 排序事件处理
const handleResonanceSortChange = ({
  column,
  prop,
  order,
}: {
  column: TableColumnCtx<TableDataRow>;
  prop: string | null;
  order: 'ascending' | 'descending' | null;
}) => {
  if (prop) {
    currentSortField.value = prop;
  }
};

// 合并单元格方法
const tableResonanceSpanMethod = ({
  row,
  column,
  rowIndex,
  columnIndex,
}: {
  row: TableDataRow;
  column: TableColumnCtx<TableDataRow>;
  rowIndex: number;
  columnIndex: number;
}) => {
  if (currentSortField.value !== 'specialize') {
    return [1, 1];
  }

  if (columnIndex === 0) {
    if (rowIndex % tableResonanceRowHeaderTw.length === 0) {
      return [tableResonanceRowHeaderTw.length, 1];
    } else {
      return [0, 0];
    }
  } else {
    return [1, 1];
  }
};

// 图标点击处理
const onIconClick = (row: TableDataRow, column: string, index: number) => {
  handleIconClick(row, column, index);
  emit('iconClick', { row, column, index });
};
</script>

<style lang="scss" scoped>
@use '../styles/CgssUnitViewerTable.scss' as table;

.cgss-unit-viewer-resonance-table {
  @include table.cgss-table-container-base;

  :deep() {
    @include table.cgss-table-styles;

    .skill-motif,
    .skill-synergy,
    .skill-spike {
      background-color: var(--el-fill-color-lighter);
    }
  }

  &.is-dark {
    :deep() {
      @include table.cgss-table-styles-dark;
    }
  }
}
</style>
