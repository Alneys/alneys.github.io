<template>
  <div class="cgss-unit-viewer-dominant-table" :class="{ 'is-dark': isDark }">
    <div id="unit-dominant" class="unit-title" style="font-weight: bold">双色 Dominant</div>
    <div v-if="showExtraTableConfig" class="unit-viewer-config">
      <div>
        <el-switch v-model="showExtraColumns" active-text="额外技能" />
        <el-switch v-model="showAlternateMutual" active-text="变换/交互列" />
        <el-switch v-model="showOverload" active-text="过载列" />
        <el-switch v-model="showOverdrive" active-text="超载列" />
        <el-switch v-model="showSpecializeNotMatch" active-text="显示所有偏科" />
      </div>
      <div>
        <el-switch v-model="showAllAttributePairs" active-text="显示所有双色属性组合" />
        <el-switch v-model="showSortRelatedSkillsOnly" active-text="只显示当前排序项目相关技能" />
      </div>
      <div>
        <el-switch v-model="highlightSeasonLimited" active-text="高亮月初复刻卡池角色" />
      </div>
    </div>
    <div class="unit-table">
      <el-table
        :data="filteredTableData"
        style="width: 100%"
        :max-height="isMobile ? 560 : 9999"
        border
        :default-sort="{ prop: 'target_attribute_2', order: 'ascending' }"
        :span-method="tableDominantSpanMethod"
        @sort-change="handleDominantSortChange"
      >
        <!-- 第一列：target_attribute_2 target_param_2 -->
        <el-table-column
          prop="target_attribute_2"
          label="歌曲属性"
          :width="96"
          sortable
          :sort-orders="['ascending', 'descending', null]"
          :sort-method="sortDominantAttribute2"
        >
          <template #default="scope">
            <span :class="`table-row-info color-cg-${scope.row.target_attribute_2}`">{{
              scope.row.target_attribute_2 || ''
            }}</span>
            <br />
            <span :class="`table-row-info color-cg-${scope.row.target_param_2}`">{{
              scope.row.target_param_2 || ''
            }}</span>
          </template>
        </el-table-column>

        <!-- 第二列：target_attribute target_param -->
        <el-table-column
          prop="target_attribute"
          label="原属性"
          :width="96"
          sortable
          :sort-orders="['ascending', 'descending', null]"
          :sort-method="sortDominantAttribute"
        >
          <template #default="scope">
            <span :class="`table-row-info color-cg-${scope.row.target_attribute}`">{{
              scope.row.target_attribute || ''
            }}</span>
            <br />
            <span :class="`table-row-info color-cg-${scope.row.target_param}`">{{
              scope.row.target_param || ''
            }}</span>
          </template>
        </el-table-column>

        <!-- 第三列：tw -->
        <el-table-column
          prop="tw"
          label="间隔"
          :width="60"
          sortable
          :sort-orders="['ascending', 'descending', null]"
          :sort-method="sortTableTw"
        >
          <template #default="scope">
            <span style="font-weight: bold">{{ scope.row.tw ? scope.row.tw + 's' : '' }}</span>
          </template>
        </el-table-column>

        <!-- 后续列：根据tableDominantColumnHeader动态生成 -->
        <template
          v-for="(headerItem, headerIndex) in tableDominantColumnHeader"
          :key="headerItem.prop"
        >
          <el-table-column
            v-if="
              (!headerItem.extraColumn || showExtraColumns) &&
              (headerItem.skill !== 'overload' || showOverload) &&
              (headerItem.skill !== 'overdrive' || showOverdrive) &&
              ((headerItem.skill !== 'alternate' && headerItem.skill !== 'mutual') ||
                showAlternateMutual) &&
              (!showSortRelatedSkillsOnly ||
                currentSortField === 'tw' ||
                !headerItem.attribute ||
                headerItem.attribute === currentSortField)
            "
            :key="`column-${headerItem.prop}`"
            :prop="headerItem.prop"
            :label="
              showSimpleLabels ? headerItem.labelCn : `${headerItem.labelCn} ${headerItem.labelEn}`
            "
            :class-name="`icons skill-${headerItem.skill ?? headerItem.prop}`"
            :min-width="isSmallScreen ? headerItem.minWidthSmallScreen : headerItem.minWidth"
          >
            <template #default="scope">
              <div class="table-icons">
                <CgssUnitViewerCardTooltip
                  v-for="(icon, iconIndex) in scope.row[headerItem.prop]"
                  :key="iconIndex"
                  :card="icon.card"
                  :is-vocal-underlined="
                    isDominantParamUnderline(headerItem, scope.row as TableDataRow, 'vocal')
                  "
                  :is-dance-underlined="
                    isDominantParamUnderline(headerItem, scope.row as TableDataRow, 'dance')
                  "
                  :is-visual-underlined="
                    isDominantParamUnderline(headerItem, scope.row as TableDataRow, 'visual')
                  "
                >
                  <img
                    v-show="
                      !isDominantSpecializeNotMatch(
                        headerItem,
                        scope.row as TableDataRow,
                        icon.card,
                      ) || showSpecializeNotMatch
                    "
                    :class="{
                      'cgss-icon': true,
                      'icon-dark':
                        clickIconAction === 'ToggleCardStatus' && !isCardBright(icon.card.cid),
                      'icon-extra': headerItem.extraColumn,
                      'icon-filter-not-match': nameFilter && !isNameMatched(icon.card.name),
                      'icon-filter-match': nameFilter && isNameMatched(icon.card.name),
                      'icon-specialize-not-match': isDominantSpecializeNotMatch(
                        headerItem,
                        scope.row as TableDataRow,
                        icon.card,
                      ),
                      'icon-season-limited':
                        highlightSeasonLimited && isSeasonLimitedCard(icon.card.cid),
                      [`icon-season-limited-${icon.card.attribute.toLowerCase()}`]:
                        highlightSeasonLimited && isSeasonLimitedCard(icon.card.cid),
                    }"
                    :src="`/static/images/cgss/icon_${icon.card.cid}.jpg`"
                    @click="
                      onIconClick(scope.row as TableDataRow, headerItem.prop, Number(iconIndex))
                    "
                  />
                </CgssUnitViewerCardTooltip>
                <div
                  v-if="
                    scope.row[headerItem.prop].length === 0 ||
                    (!showSpecializeNotMatch &&
                      scope.row[headerItem.prop][0].card.stats[scope.row[headerItem.param ?? '']] <=
                        DOMINANT_PARAM_THRESHOLD_SPECIALIZE)
                  "
                >
                  x
                </div>
              </div>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { ref, shallowRef, computed, watch, toRef } from 'vue';

import type { TableColumnCtx } from 'element-plus';

import { useResponsive } from '@/composables/useResponsive';

import {
  type CgssCardSkillTableItem,
  type TableDataRow,
  tableDominantRowHeaderAttribute,
  tableDominantRowHeaderSpecialize,
  tableDominantRowHeaderAttributeSpecializePairs,
  tableDominantRowHeaderTw,
  tableDominantColumnHeader,
  DOMINANT_PARAM_THRESHOLD_ADD,
  DOMINANT_PARAM_THRESHOLD_SPECIALIZE,
} from '../CgssUnitViewerTypes';
import { useCardFilter } from '../composables/useCardFilter';
import { useIconActions } from '../composables/useIconActions';
import { useSeasonLimited } from '../composables/useSeasonLimited';
import {
  sortTableTw,
  createCardDataItem,
  sortCardsByParam,
  sortDominantAttribute,
  sortDominantAttribute2,
} from '../composables/useTableUtils';
import CgssUnitViewerCardTooltip from './CgssUnitViewerCardTooltip.vue';

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
const showAlternateMutual = defineModel<boolean>('showAlternateMutual', { default: true });
const showOverload = defineModel<boolean>('showOverload', { default: true });
const showOverdrive = defineModel<boolean>('showOverdrive', { default: true });
const showSpecializeNotMatch = defineModel<boolean>('showSpecializeNotMatch', { default: false });
const showAllAttributePairs = defineModel<boolean>('showAllAttributePairs', { default: false });
const showSortRelatedSkillsOnly = defineModel<boolean>('showSortRelatedSkillsOnly', {
  default: false,
});
const highlightSeasonLimited = defineModel<boolean>('highlightSeasonLimited', { default: false });

// 组合式函数：响应式布局
const { isMobile, isSmallScreen } = useResponsive();

// 组合式函数：名字筛选（传入 props.nameFilter 的 ref）
const { isNameMatched } = useCardFilter(toRef(props, 'nameFilter'));

// 组合式函数：季节限定卡池判断
const { isSeasonLimitedCard } = useSeasonLimited();

// 组合式函数：暗色模式
const isDark = useDark();

// 排序状态：子组件内部维护
const currentSortField = ref('target_attribute_2');

// 过滤表格数据
const filteredTableData = computed(() => {
  if (showAllAttributePairs.value) {
    return tableData.value.filter((row) =>
      tableDominantRowHeaderAttributeSpecializePairs.some(
        (pair) =>
          pair.target_param_2 === row.target_param_2 && pair.target_param === row.target_param,
      ),
    );
  }
  return tableData.value.filter((row) => Array.isArray(row.dominant) && row.dominant.length > 0);
});

// 初始化函数
const initializeData = (data: CgssCardSkillTableItem[]): TableDataRow[] => {
  const result: TableDataRow[] = [];

  // 遍历所有可能的组合
  tableDominantRowHeaderAttribute.forEach((attr2) => {
    tableDominantRowHeaderAttribute.forEach((attr) => {
      if (attr !== attr2) {
        tableDominantRowHeaderTw.forEach((tw) => {
          tableDominantRowHeaderSpecialize.forEach((param2) => {
            tableDominantRowHeaderSpecialize.forEach((param) => {
              if (param !== param2) {
                const row: TableDataRow = {
                  target_attribute_2: attr2,
                  target_attribute: attr,
                  tw: tw,
                  target_param_2: param2,
                  target_param: param,
                  row: result.length,
                };

                tableDominantColumnHeader.forEach((column) => {
                  row[column.prop] = [];
                });

                result.push(row);
              }
            });
          });
        });
      }
    });
  });

  // 构建倒排索引：(skillType, twKey, attributeField, attributeValue) → 目标格子列表
  type IndexEntry = { rowIndex: number; prop: string; paramField: string };
  const invertedIndex = new Map<string, IndexEntry[]>();

  result.forEach((row, rowIndex) => {
    tableDominantColumnHeader.forEach((colDef) => {
      if (colDef.skill === 'dominant') return;

      const attrField = colDef.attribute;
      const paramField = colDef.param;
      if (!attrField || !paramField) return;

      const attributeValue = row[attrField as keyof typeof row];
      if (!attributeValue) return;

      let twKey: string;
      if (colDef.tw !== undefined) {
        twKey = colDef.tw;
      } else if (colDef.extraColumn) {
        twKey = '*';
      } else {
        twKey = row.tw;
      }

      const key = `${colDef.skill}|${twKey}|${attrField}|${attributeValue}`;
      if (!invertedIndex.has(key)) {
        invertedIndex.set(key, []);
      }
      invertedIndex.get(key)?.push({ rowIndex, prop: colDef.prop, paramField });
    });
  });

  // 为每个 skill 类型推导查找规则（从列头配置自动映射，维护一致）
  const skillRules = new Map<string, { attrField: string; twKeyPattern: string }>();
  tableDominantColumnHeader.forEach((colDef) => {
    if (colDef.skill === 'dominant' || skillRules.has(colDef.skill)) return;
    if (!colDef.attribute) return;
    skillRules.set(colDef.skill, {
      attrField: colDef.attribute,
      twKeyPattern: colDef.tw !== undefined ? 'exact' : colDef.extraColumn ? 'wildcard' : 'row',
    });
  });

  // 遍历技能表数据
  data.forEach((item: CgssCardSkillTableItem) => {
    if (item.rarity !== 'ssr') return;

    if (item.skill.type === 'dominant') {
      if (item.leaderSkill.params) {
        const targetAttr = item.leaderSkill.params.target_attribute;
        const targetAttr2 = item.leaderSkill.params.target_attribute_2;
        const targetParam = item.leaderSkill.params.target_param;
        const targetParam2 = item.leaderSkill.params.target_param_2;

        if (!targetAttr || !targetAttr2 || !targetParam || !targetParam2) return;

        const attrIndex = tableDominantRowHeaderAttribute.indexOf(targetAttr.toLowerCase());
        const attr2Index = tableDominantRowHeaderAttribute.indexOf(targetAttr2.toLowerCase());
        const paramIndex = tableDominantRowHeaderSpecialize.indexOf(targetParam.toLowerCase());
        const param2Index = tableDominantRowHeaderSpecialize.indexOf(targetParam2.toLowerCase());

        if (attrIndex === -1 || attr2Index === -1 || paramIndex === -1 || param2Index === -1)
          return;
        if (attrIndex === attr2Index || paramIndex === param2Index) return;

        const twIndex = tableDominantRowHeaderTw.indexOf(String(item.skill.params.tw));
        if (twIndex === -1) return;

        const attrCount = tableDominantRowHeaderAttribute.length;
        const validParamCombos = attrCount * (attrCount - 1);
        const twCount = tableDominantRowHeaderTw.length;

        const attrComboIndex =
          attr2Index * (attrCount - 1) + (attrIndex > attr2Index ? attrIndex - 1 : attrIndex);
        const paramComboIndex =
          param2Index * (attrCount - 1) + (paramIndex > param2Index ? paramIndex - 1 : paramIndex);
        const rowIndex = (attrComboIndex * twCount + twIndex) * validParamCombos + paramComboIndex;

        if (result[rowIndex]?.dominant && Array.isArray(result[rowIndex].dominant)) {
          result[rowIndex].dominant.push(createCardDataItem(item));
        }
      }
    } else {
      const skillType = item.skill.type.startsWith('psb_') ? 'psb_' : item.skill.type;
      const rule = skillRules.get(skillType);
      if (!rule) return;

      const cardTw = String(item.skill.params.tw);
      const twKey =
        rule.twKeyPattern === 'exact' ? cardTw : rule.twKeyPattern === 'row' ? cardTw : '*';

      const key = `${skillType}|${twKey}|${rule.attrField}|${item.attribute.toLowerCase()}`;
      const entries = invertedIndex.get(key);
      if (!entries) return;

      for (const entry of entries) {
        const targetRow = result[entry.rowIndex];
        const targetParam = targetRow[entry.paramField as keyof typeof targetRow];
        if (!targetParam) continue;

        const statValue = item.stats[targetParam as keyof CgssCardSkillTableItem['stats']];
        if (statValue < DOMINANT_PARAM_THRESHOLD_ADD) continue;

        const targetArray = result[entry.rowIndex]?.[entry.prop];
        if (Array.isArray(targetArray)) {
          targetArray.push(createCardDataItem(item));
        }
      }
    }
  });

  // 排序
  result.forEach((row) => {
    tableDominantColumnHeader.forEach((colDef) => {
      const prop = colDef.prop;
      const param = colDef.param;

      if (Array.isArray(row[prop]) && row[prop].length > 0) {
        row[prop] = sortCardsByParam(
          row[prop],
          param === 'target_param_2' ? row.target_param_2 : row.target_param,
        );
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
const handleDominantSortChange = ({
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
const tableDominantSpanMethod = ({
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
  if (!showAllAttributePairs.value || !currentSortField.value.startsWith('target_attribute')) {
    return [1, 1];
  }

  const rowSpan = tableDominantRowHeaderTw.length * (tableDominantRowHeaderAttribute.length - 1);
  const halfRowSpan = rowSpan % 2 === 0 ? rowSpan / 2 : 1;

  // 合并第 0 列（歌曲属性）和第 1 列（原属性）
  if (columnIndex === 0 || columnIndex === 1) {
    // 排序列按 rowSpan 合并，另一列按 rowSpan / 2 合并
    const span = currentSortField.value === column.property ? rowSpan : halfRowSpan;

    if (rowIndex % span === 0) {
      return [span, 1];
    }
    return [0, 0];
  }

  return [1, 1];
};

// 判断参数特化值不匹配
const isDominantSpecializeNotMatch = (
  headerItem: (typeof tableDominantColumnHeader)[number],
  row: TableDataRow,
  card: CgssCardSkillTableItem,
) => {
  if (headerItem.prop === 'dominant') return false;

  const paramField = headerItem.param;
  if (!paramField) return false;

  let valueToCheck: number | undefined;
  if (paramField === 'target_param' || paramField === 'target_param_2') {
    const paramKey = row[paramField] as keyof CgssCardSkillTableItem['stats'];
    valueToCheck = card.stats[paramKey];
  } else {
    return false;
  }

  return valueToCheck !== undefined && valueToCheck < DOMINANT_PARAM_THRESHOLD_SPECIALIZE;
};

// 判断参数是否需要下划线
const isDominantParamUnderline = (
  headerItem: (typeof tableDominantColumnHeader)[number],
  row: TableDataRow,
  param: string,
) => {
  if (headerItem.skill === 'dominant') {
    return row.target_param === param || row.target_param_2 === param;
  }

  if (headerItem.param === 'target_param') {
    return row.target_param === param;
  }

  if (headerItem.param === 'target_param_2') {
    return row.target_param_2 === param;
  }

  return false;
};

// 图标点击处理
const onIconClick = (row: TableDataRow, column: string, index: number) => {
  handleIconClick(row, column, index);
  emit('iconClick', { row, column, index });
};
</script>

<style lang="scss" scoped>
@use '../styles/CgssUnitViewerTable.scss' as table;

.cgss-unit-viewer-dominant-table {
  @include table.cgss-table-container-base;

  :deep() {
    @include table.cgss-table-styles;

    .skill-dominant,
    .skill-mutual,
    .skill-overdrive,
    .skill-cboost {
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
