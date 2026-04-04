<template>
  <div class="cgss-unit-viewer-resonance-table">
    <div class="unit-title" id="unit-resonance" style="font-weight: bold">共鸣 Resonance</div>
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
              {{ scope.row.tw }}
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
            :class-name="`icons skill-${headerItem.prop}`"
            :min-width="isSmallScreen ? headerItem.minWidthSmallScreen : headerItem.minWidth"
          >
            <template #default="scope">
              <div class="table-icons">
                <CgssUnitViewerCardTooltip
                  v-for="(icon, iconIndex) in scope.row[headerItem.prop]"
                  :key="iconIndex"
                  :card="icon.card"
                  :is-vocal-underlined="scope.row.specialize === 'vocal'"
                  :is-dance-underlined="scope.row.specialize === 'dance'"
                  :is-visual-underlined="scope.row.specialize === 'visual'"
                >
                  <img
                    :class="{
                      'cgss-icon': true,
                      'icon-dark': clickIconAction === 'ToggleCardStatus' && !icon.isBrightness,
                      'icon-extra': headerItem.extraColumn,
                      'icon-filter-not-match': nameFilter && !isNameMatched(icon.card.name),
                      'icon-filter-match': nameFilter && isNameMatched(icon.card.name),
                    }"
                    :src="`/static/images/cgss/icon_${icon.card.cid}.jpg`"
                    @click="onIconClick(scope.row, headerItem.prop, Number(iconIndex))"
                  />
                </CgssUnitViewerCardTooltip>
                <div v-if="scope.row[headerItem.prop].length === 0">x</div>
              </div>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { TableColumnCtx } from 'element-plus';
import CgssCardSkillTable from './data/cgss_extracted_card_skill_table_ssr.json';
import CgssUnitViewerCardTooltip from './CgssUnitViewerCardTooltip.vue';
import {
  type CgssCardSkillTableItem,
  type TableDataRow,
  tableResonanceRowHeaderAttribute,
  tableResonanceRowHeaderSpecialize,
  tableResonanceRowHeaderTw,
  tableResonanceColumnHeader,
} from './CgssUnitViewerTypes';
import { useResponsive } from './composables/useResponsive';
import { useCardFilter } from './composables/useCardFilter';
import { useIconActions } from './composables/useIconActions';
import {
  sortTableTw,
  createCardDataItem,
  sortCardsByParam,
  sortResonanceSpecialize,
} from './composables/useTableUtils';

// Props：只接收配置开关
const props = defineProps<{
  showSimpleLabels: boolean;
  clickIconAction: string;
  nameFilter: string;
  showExtraTableConfig: boolean;
}>();

// Emits
const emit = defineEmits<{
  iconClick: [payload: { row: TableDataRow; column: string; index: number }];
}>();

// v-model：表格配置开关
const showExtraColumns = defineModel<boolean>('showExtraColumns', { default: false });

// v-model：表格数据（双向绑定到父组件）
const tableData = defineModel<TableDataRow[]>('tableData', { default: [] });

// 响应式布局
const { isMobile, isSmallScreen } = useResponsive();

// 名字筛选
const { isNameMatched } = useCardFilter();

// 排序状态：子组件内部维护
const currentSortField = ref('specialize');

// 初始化函数
const initializeData = (data: CgssCardSkillTableItem[]): TableDataRow[] => {
  const result: TableDataRow[] = [];

  tableResonanceRowHeaderSpecialize.forEach((specialize) => {
    tableResonanceRowHeaderTw.forEach((tw) => {
      const row: TableDataRow = {
        specialize: specialize,
        tw: tw + 's',
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

// 初始化：onMounted 内部初始化
onMounted(() => {
  tableData.value = initializeData(CgssCardSkillTable as CgssCardSkillTableItem[]);
});

// useIconActions：独立实例
const clickIconActionRef = computed(() => props.clickIconAction);
const {
  allIconsBright,
  handleIconClick,
  toggleAllIconsBrightness,
  updateCardBrightnessByCids,
  updateCardBrightnessByName,
  setAllIconsBrightness,
} = useIconActions([tableData], clickIconActionRef);

// Expose 方法（无需 getData，数据通过 v-model 暴露）
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
  prop: string;
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
@use './styles/CgssUnitViewerTable.scss' as table;

.cgss-unit-viewer-resonance-table {
  @include table.cgss-table-container-base;

  :deep() {
    @include table.cgss-table-styles;
  }
}
</style>
