<template>
  <div class="cgss-unit-viewer-dominant-table">
    <div class="al-divider"></div>
    <div class="unit-title" id="unit-dominant" style="font-weight: bold">双色 Dominant</div>
    <div v-if="showExtraTableConfig" class="unit-viewer-config">
      <div>
        <el-switch v-model="internalShowExtraColumns" active-text="额外技能" />
        <el-switch v-model="internalShowOverloadOverdrive" active-text="显示过载/超载列" />
        <el-switch
          v-model="internalShowSortRelatedSkillsOnly"
          active-text="只显示当前排序项目相关技能"
        />
        <el-switch v-model="internalShowSpecializeNotMatch" active-text="显示所有偏科" />
        <el-switch
          v-model="internalShowAllAttributeSpecializePairs"
          active-text="显示所有属性组合"
        />
        <el-switch v-model="internalHighlightSeasonLimited" active-text="高亮月初复刻卡池角色" />
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
            <span style="font-weight: bold">{{ scope.row.tw || '' }}</span>
          </template>
        </el-table-column>

        <!-- 后续列：根据tableDominantColumnHeader动态生成 -->
        <template
          v-for="(headerItem, headerIndex) in tableDominantColumnHeader"
          :key="headerItem.prop"
        >
          <el-table-column
            v-if="
              (!headerItem.extraColumn || internalShowExtraColumns) &&
              ((headerItem.skill !== 'overload' && headerItem.skill !== 'overdrive') ||
                internalShowOverloadOverdrive) &&
              (!internalShowSortRelatedSkillsOnly ||
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
                  :is-vocal-underlined="isDominantParamUnderline(headerItem, scope.row, 'vocal')"
                  :is-dance-underlined="isDominantParamUnderline(headerItem, scope.row, 'dance')"
                  :is-visual-underlined="isDominantParamUnderline(headerItem, scope.row, 'visual')"
                >
                  <img
                    v-show="
                      !isDominantSpecializeNotMatch(headerItem, scope.row, icon.card) ||
                      internalShowSpecializeNotMatch
                    "
                    :class="{
                      'cgss-icon': true,
                      'icon-dark': clickIconAction === 'ToggleCardStatus' && !icon.isBrightness,
                      'icon-extra': headerItem.extraColumn,
                      'icon-filter-not-match': nameFilter && !isNameMatched(icon.card.name),
                      'icon-filter-match': nameFilter && isNameMatched(icon.card.name),
                      'icon-specialize-not-match': isDominantSpecializeNotMatch(
                        headerItem,
                        scope.row,
                        icon.card,
                      ),
                      'icon-season-limited':
                        internalHighlightSeasonLimited && isSeasonLimitedCard(icon.card.cid),
                      [`icon-season-limited-${icon.card.attribute.toLowerCase()}`]:
                        internalHighlightSeasonLimited && isSeasonLimitedCard(icon.card.cid),
                    }"
                    :src="`/static/images/cgss/icon_${icon.card.cid}.jpg`"
                    @click="onIconClick(scope.row, headerItem.prop, Number(iconIndex))"
                  />
                </CgssUnitViewerCardTooltip>
                <div
                  v-if="
                    !internalShowSpecializeNotMatch &&
                    (scope.row[headerItem.prop].length === 0 ||
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
import { ref, computed, onMounted } from 'vue';
import CgssCardSkillTable from './data/cgss_extracted_card_skill_table_ssr.json';
import CgssUnitViewerCardTooltip from './CgssUnitViewerCardTooltip.vue';
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
} from './CgssUnitViewerTypes';
import { useResponsive } from './composables/useResponsive';
import { useCardFilter } from './composables/useCardFilter';
import { useSeasonLimited } from './composables/useSeasonLimited';
import { useIconActions } from './composables/useIconActions';
import {
  sortTableTw,
  createCardDataItem,
  sortCardsByParam,
  sortDominantAttribute,
  sortDominantAttribute2,
} from './composables/useTableUtils';

// Props：只接收配置开关
const props = defineProps<{
  showSimpleLabels: boolean;
  clickIconAction: string;
  nameFilter: string;
  showExtraTableConfig: boolean;
  showExtraColumns: boolean;
  showOverloadOverdrive: boolean;
  showSpecializeNotMatch: boolean;
  showAllAttributePairs: boolean;
  showSortRelatedSkillsOnly: boolean;
  highlightSeasonLimited: boolean;
}>();

// Emits
const emit = defineEmits<{
  iconClick: [payload: { row: TableDataRow; column: string; index: number }];
}>();

// 响应式布局
const { isMobile, isSmallScreen } = useResponsive();

// 名字筛选
const { isNameMatched } = useCardFilter();

// 季节限定卡池判断
const { isSeasonLimitedCard } = useSeasonLimited();

// 内部状态：表格配置开关
const internalShowExtraColumns = ref(props.showExtraColumns);
const internalShowOverloadOverdrive = ref(props.showOverloadOverdrive);
const internalShowSpecializeNotMatch = ref(props.showSpecializeNotMatch);
const internalShowAllAttributeSpecializePairs = ref(props.showAllAttributePairs);
const internalShowSortRelatedSkillsOnly = ref(props.showSortRelatedSkillsOnly);
const internalHighlightSeasonLimited = ref(props.highlightSeasonLimited);

// 排序状态：子组件内部维护
const currentSortField = ref('target_attribute_2');

// 数据所有权：子组件内部 ref
const tableData = ref<TableDataRow[]>([]);

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
                  tw: tw + 's',
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
      result.forEach((row, rowIndex) => {
        tableDominantColumnHeader.forEach((colDef) => {
          if (colDef.skill === 'dominant') return;

          if (colDef.skill === 'psb_') {
            if (!item.skill.type.startsWith(colDef.skill)) return;
          } else {
            if (colDef.skill !== item.skill.type) return;
          }

          if (colDef.tw !== undefined) {
            if (String(item.skill.params.tw) !== colDef.tw) return;
          } else {
            if (String(item.skill.params.tw) + 's' !== row.tw && !colDef.extraColumn) return;
          }

          const attrField = colDef.attribute;
          const paramField = colDef.param;
          if (!attrField || !paramField) return;

          const targetAttr = row[attrField as keyof typeof row];
          const targetParam = row[paramField as keyof typeof row];

          if (item.attribute.toLowerCase() !== targetAttr) return;
          if (!targetParam) return;

          const threshold = DOMINANT_PARAM_THRESHOLD_ADD;
          const statValue = item.stats[targetParam as keyof CgssCardSkillTableItem['stats']];
          if (statValue < threshold) return;

          const targetArray = result[rowIndex]?.[colDef.prop];
          if (Array.isArray(targetArray)) {
            targetArray.push(createCardDataItem(item));
          }
        });
      });
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

// 获取数据（供父组件使用）
const getData = () => tableData.value;

// Expose 方法
defineExpose({
  getData,
  toggleAllBrightness: toggleAllIconsBrightness,
  updateBrightnessByCids: updateCardBrightnessByCids,
  updateCardBrightnessByName,
  setAllIconsBrightness,
});

// 过滤表格数据
const filteredTableData = computed(() => {
  if (internalShowAllAttributeSpecializePairs.value) {
    return tableData.value.filter((row) =>
      tableDominantRowHeaderAttributeSpecializePairs.some(
        (pair) =>
          pair.target_param_2 === row.target_param_2 && pair.target_param === row.target_param,
      ),
    );
  }
  return tableData.value.filter((row) => Array.isArray(row.dominant) && row.dominant.length > 0);
});

// 排序事件处理
const handleDominantSortChange = ({ column, prop, order }: any) => {
  if (prop) {
    currentSortField.value = prop;
  }
};

// 合并单元格方法
const tableDominantSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  if (
    !internalShowAllAttributeSpecializePairs.value ||
    !currentSortField.value.startsWith('target_attribute')
  ) {
    return [1, 1];
  }

  const rowSpan = tableDominantRowHeaderTw.length * (tableDominantRowHeaderAttribute.length - 1);

  if ((columnIndex === 0 || columnIndex === 1) && currentSortField.value === column.property) {
    if (rowIndex % rowSpan === 0) {
      return [rowSpan, 1];
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
@use './styles/CgssUnitViewerTable.scss' as table;

.cgss-unit-viewer-dominant-table {
  @include table.cgss-table-container-base;

  :deep() {
    @include table.cgss-table-styles;
  }
}
</style>
