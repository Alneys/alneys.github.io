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
        <el-switch v-model="switchToggleCardStatus" active-text="点击图标后切换状态" />
        <el-switch v-model="switchViewCardInfo" active-text="点击图标后在346lab查看卡片详情" />
      </div>
      <CgssUnitViewerStateManager
        v-if="switchToggleCardStatus"
        :table-data="[...tableDataResonance, ...tableDataDominant]"
        @update-card-status="updateCardBrightnessByCids"
      >
        <template #prefix>
          <div>
            <el-button @click="toggleAllIconsBrightness" type="primary" size="default">
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
    <div class="unit-title" id="unit-resonance" style="font-weight: bold">共鸣 Resonance</div>
    <div v-if="switchShowExtraTableConfig" class="unit-viewer-config">
      <div>
        <el-switch v-model="switchShowExtraColumns" active-text="额外技能" />
      </div>
    </div>
    <div class="unit-table">
      <el-table
        :data="tableDataResonance"
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
          @sort-change="handleResonanceSortChange"
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
            v-if="!headerItem.extraColumn || switchShowExtraColumns"
            :prop="headerItem.prop"
            :label="
              switchShowSimpleLabels
                ? headerItem.labelCn
                : `${headerItem.labelCn} ${headerItem.labelEn}`
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
                      'icon-dark': switchToggleCardStatus && !icon.isBrightness,
                      'icon-extra': headerItem.extraColumn,
                      'icon-filter-not-match': switchNameFilter && !isNameMatched(icon.card.name),
                      'icon-filter-match': switchNameFilter && isNameMatched(icon.card.name),
                    }"
                    :src="`/static/images/cgss/icon_${icon.card.cid}.jpg`"
                    @click="handleIconClick(scope.row, headerItem.prop, Number(iconIndex))"
                  />
                </CgssUnitViewerCardTooltip>
                <div v-if="scope.row[headerItem.prop].length === 0">x</div>
              </div>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>
    <div class="al-divider"></div>
    <div class="unit-title" id="unit-dominant" style="font-weight: bold">双色 Dominant</div>
    <div v-if="switchShowExtraTableConfig" class="unit-viewer-config">
      <div>
        <el-switch v-model="switchShowExtraColumns" active-text="额外技能" />
        <el-switch v-model="switchShowOverloadOverdrive" active-text="显示过载/超载列" />

        <el-switch
          v-model="switchShowSortRelatedSkillsOnly"
          active-text="只显示当前排序项目相关技能"
        />
        <el-switch v-model="switchShowSpecializeNotMatch" active-text="显示所有偏科" />
        <el-switch v-model="switchShowAllAttributeSpecializePairs" active-text="显示所有属性组合" />
      </div>
    </div>
    <div class="unit-table">
      <el-table
        :data="filteredTableDataDominant"
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
              (!headerItem.extraColumn || switchShowExtraColumns) &&
              ((headerItem.skill !== 'overload' && headerItem.skill !== 'overdrive') ||
                switchShowOverloadOverdrive) &&
              (!switchShowSortRelatedSkillsOnly ||
                currentDominantSortField === 'tw' ||
                !headerItem.attribute ||
                headerItem.attribute === currentDominantSortField)
            "
            :key="`column-${headerItem.prop}`"
            :prop="headerItem.prop"
            :label="
              switchShowSimpleLabels
                ? headerItem.labelCn
                : `${headerItem.labelCn} ${headerItem.labelEn}`
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
                      switchShowSpecializeNotMatch
                    "
                    :class="{
                      'cgss-icon': true,
                      'icon-dark': !icon.isBrightness && switchToggleCardStatus,
                      'icon-extra': headerItem.extraColumn,
                      'icon-filter-not-match': switchNameFilter && !isNameMatched(icon.card.name),
                      'icon-filter-match': switchNameFilter && isNameMatched(icon.card.name),
                      'icon-specialize-not-match': isDominantSpecializeNotMatch(
                        headerItem,
                        scope.row,
                        icon.card,
                      ),
                    }"
                    :src="`/static/images/cgss/icon_${icon.card.cid}.jpg`"
                    @click="handleIconClick(scope.row, headerItem.prop, Number(iconIndex))"
                  />
                </CgssUnitViewerCardTooltip>
                <div
                  v-if="
                    !switchShowSpecializeNotMatch &&
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
    <!-- <div>
      <p>更多组队信息开发中……</p>
    </div> -->
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
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue';
import CgssCardSkillTable from './cgss_extracted_card_skill_table_ssr.json';
import CgssUnitViewerCardTooltip from './CgssUnitViewerCardTooltip.vue';
import CgssUnitViewerStateManager from './CgssUnitViewerStateManager.vue';

const env = import.meta.env;

export interface CgssCardSkillTableItem {
  cid: string;
  name: string;
  title: string;
  attribute: string;
  rarity: string;
  specialize: string;
  link: string;
  stats: {
    vocal: number;
    visual: number;
    dance: number;
  };
  skill: {
    name: string;
    description: string;
    type: string;
    params: {
      m_proc: number;
      m_dur: number;
      tw: number;
    };
  };
  leaderSkill: {
    name: string;
    description: string;
    params?: {
      target_attribute: string;
      target_param: string;
      target_attribute_2: string;
      target_param_2: string;
    };
  };
}

// Cell item
export interface CardData {
  card: CgssCardSkillTableItem;
  isBrightness?: boolean;
}

// Resonance, dominant table
interface TableDataRow {
  tw: string;
  specialize?: string;
  target_attribute_2?: string;
  target_attribute?: string;
  target_param_2?: string;
  target_param?: string;
  row: number;
  [key: string]: CardData[] | string | number | undefined;
}

// Resonance table
const tableResonanceRowHeaderAttribute = ['cute', 'cool', 'passion'];
const tableResonanceRowHeaderSpecialize = ['vocal', 'dance', 'visual'];
const tableResonanceRowHeaderTw = ['7', '9', '11'];
const tableResonanceColumnHeader = [
  {
    prop: 'magic',
    labelCn: '魔法',
    labelEn: 'magic',
    skill: 'magic',
    minWidth: 200,
    extraColumn: true,
  },
  {
    prop: 'motif',
    labelCn: '共鸣',
    labelEn: 'resonance motif',
    skill: 'motif',
    minWidth: 150,
    minWidthSmallScreen: undefined,
  },
  { prop: 'synergy', labelCn: '大偏', labelEn: 'synergy', skill: 'synergy', minWidth: 150 },
  {
    prop: 'symphony',
    labelCn: '交响',
    labelEn: 'symphony',
    skill: 'symphony',
    minWidth: 100,
  },
  { prop: 'spike', labelCn: '尖峰', labelEn: 'spike', skill: 'spike', minWidth: 100 },
  { prop: 'refrain', labelCn: '副歌', labelEn: 'refrain', skill: 'refrain', minWidth: 150 },
  {
    prop: 'coordinate',
    labelCn: '协调',
    labelEn: 'coordinate',
    skill: 'focus_flat',
    minWidth: 200,
    extraColumn: true,
  },
  {
    prop: 'sparkle',
    labelCn: '闪耀',
    labelEn: 'sparkle',
    skill: 'sparkle',
    minWidth: 150,
    extraColumn: true,
  },
  {
    prop: 'combo',
    labelCn: '连击',
    labelEn: 'combo',
    skill: 'cboost',
    minWidth: 150,
    extraColumn: true,
  },
];

// Dominant table
const tableDominantRowHeaderAttribute = tableResonanceRowHeaderAttribute;
const tableDominantRowHeaderSpecialize = tableResonanceRowHeaderSpecialize;
const tableDominantRowHeaderAttributeSpecializePairs = [
  {
    target_param_2: 'vocal',
    target_param: 'visual',
  },
  {
    target_param_2: 'dance',
    target_param: 'vocal',
  },
  {
    target_param_2: 'visual',
    target_param: 'dance',
  },
];
const tableDominantRowHeaderTw = ['6', '9', '11', '13'];

const tableDominantColumnHeader = [
  {
    prop: 'dominant',
    labelCn: '双色',
    labelEn: 'dominant',
    skill: 'dominant',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    minWidth: 64,
    extraColumn: false,
  },
  {
    prop: 'alternate',
    labelCn: '变换',
    labelEn: 'alternate',
    skill: 'alternate',
    attribute: 'target_attribute',
    param: 'target_param',
    minWidth: 108,
    minWidthSmallScreen: 108,
  },
  {
    prop: 'mutual',
    labelCn: '交互',
    labelEn: 'mutual',
    skill: 'mutual',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    minWidth: 152,
    minWidthSmallScreen: 108,
  },
  {
    prop: 'overload_4',
    labelCn: '过载 4s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '4',
  },
  {
    prop: 'overdrive_4',
    labelCn: '超载 4s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '4',
  },
  {
    prop: 'overload_6',
    labelCn: '过载 6s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '6',
  },
  {
    prop: 'overdrive_6',
    labelCn: '超载 6s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '6',
  },
  {
    prop: 'overload_7',
    labelCn: '过载 7s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '7',
  },
  {
    prop: 'overdrive_7',
    labelCn: '超载 7s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '7',
  },
  {
    prop: 'overload_9',
    labelCn: '过载 9s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '9',
  },
  {
    prop: 'overdrive_9',
    labelCn: '超载 9s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '9',
  },
  {
    prop: 'act',
    labelCn: '演技',
    labelEn: 'act',
    skill: 'psb_',
    attribute: 'target_attribute',
    param: 'target_param',
    minWidth: 116,
    minWidthSmallScreen: 116,
    extraColumn: true,
  },
  {
    prop: 'combo',
    labelCn: '连击',
    labelEn: 'combo',
    skill: 'cboost',
    minWidth: 80,
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    extraColumn: true,
  },
];

// 模式切换
const switchToggleCardStatus = ref(false);
const switchViewCardInfo = ref(false);
const switchNameFilter = ref(false);
const switchShowSimpleLabels = ref(window.innerWidth < 768);
const switchShowExtraTableConfig = ref(true);
const switchShowExtraColumns = ref(false);
const switchShowOverloadOverdrive = ref(true);
const switchShowSpecializeNotMatch = ref(false);
const switchShowAllAttributeSpecializePairs = ref(false);
const switchShowSortRelatedSkillsOnly = ref(false);

// 名字过滤输入
const inputNameFilter = ref(
  `中野有香 持田亜里沙 三村かな子 江上椿 棣方愛海 藤本里奈 遊佐こずえ 赤西瑛梨華 小早川紗枝 楊菲菲 道明寺歌鈴 浅野風香 大西由里子 栗原ネネ 村松さくら 有浦柑奈 辻野あかり
上条春菜 荒木比奈 東郷あい 多田李衣菜 佐々木千枝 服部瞳子 古澤頼子 八神マキノ ケイト 岸部彩華 成宮由愛 藤居朋 二宮飛鳥 桐生つかさ 望月聖 小室千奈美
本田未央 龍崎薫 松山久美子 愛野渚 野々村そら 若林智香 日野茜 十時愛梨 相馬夏美 市原仁奈 小松伊吹 難波笑美 浜口あやめ 佐藤心`,
);
const inputNameFilterDefaultInformation = ref('当前默认数据：LIVE Carnival 2026 Spring');

// 添加图标亮度控制
const allIconsBright = ref(true);

// 添加常量来控制dominant表中目标数值的限制
const DOMINANT_PARAM_THRESHOLD_ADD = 0;
const DOMINANT_PARAM_THRESHOLD_SPECIALIZE = 5000;

// 添加监听器实现互斥逻辑
watch(switchToggleCardStatus, (newValue) => {
  if (newValue && switchViewCardInfo.value) {
    switchViewCardInfo.value = false;
  }
});

watch(switchViewCardInfo, (newValue) => {
  if (newValue && switchToggleCardStatus.value) {
    switchToggleCardStatus.value = false;
  }
});

// 响应式属性用于判断屏幕宽度是否足够
const isMobile = ref(window.innerWidth < 768);
const isSmallScreen = ref(window.innerWidth < 1600);

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  isSmallScreen.value = window.innerWidth < 1600;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 添加响应式变量跟踪当前排序字段
const currentResonanceSortField = ref('specialize');
const currentDominantSortField = ref('target_attribute_2');

// 监听Resonance表排序事件
const handleResonanceSortChange = ({ column, prop, order }: any) => {
  if (prop) {
    currentResonanceSortField.value = prop;
  }
};

// 监听Dominant表排序事件
const handleDominantSortChange = ({ column, prop, order }: any) => {
  if (prop) {
    currentDominantSortField.value = prop;
  }
};
// Resonance表合并单元格方法
const tableResonanceSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  // 如果不是按specialize排序，则不合并单元格
  if (currentResonanceSortField.value !== 'specialize') {
    return [1, 1];
  }

  if (columnIndex === 0) {
    if (rowIndex % tableResonanceRowHeaderTw.length === 0) {
      return [tableResonanceRowHeaderTw.length, 1];
    } else {
    }
    return [0, 0];
  } else {
    return [1, 1];
  }
};

// Dominant表合并单元格方法
const tableDominantSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  // 如果未显示所有属性组合，或者不是按target_attribute或者target_attribute_2排序，则不合并单元格
  if (
    !switchShowAllAttributeSpecializePairs.value ||
    !currentDominantSortField.value.startsWith('target_attribute')
  ) {
    return [1, 1];
  }

  const rowSpan = tableDominantRowHeaderTw.length * (tableResonanceRowHeaderAttribute.length - 1);

  // 检查当前列是否需要合并（第一列或第二列）
  if (
    (columnIndex === 0 || columnIndex === 1) &&
    currentDominantSortField.value === column.property
  ) {
    if (rowIndex % rowSpan === 0) {
      return [rowSpan, 1];
    }
    return [0, 0];
  }

  return [1, 1];
};

// 处理单个参数排序的通用函数
const sortAttributeHelper = (
  getter: (item: TableDataRow) => string | undefined,
  order: string[],
) => {
  return (a: TableDataRow, b: TableDataRow) => {
    const indexA = order.indexOf(getter(a) || '');
    const indexB = order.indexOf(getter(b) || '');

    // 如果值在预定义顺序中，则按预定义顺序排序
    if (indexA !== -1 && indexB !== -1) {
      if (indexA !== indexB) {
        return indexA - indexB;
      }
    } else {
      // 如果其中一个值不在预定义顺序中，则将预定义顺序中的值排在前面
      if (indexA !== -1) {
        return -1;
      }
      if (indexB !== -1) {
        return 1;
      }
      // 如果都不在预定义顺序中，则按字母顺序排序
      const aValue = getter(a);
      const bValue = getter(b);
      if (aValue && bValue) {
        const compareResult = aValue.localeCompare(bValue);
        if (compareResult !== 0) {
          return compareResult;
        }
      }
    }

    // 如果两个值相等，则返回 0
    return 0;
  };
};

// Resonance表和Dominant表tw列排序方法
const sortTableTw = (a: TableDataRow, b: TableDataRow) => {
  // 提取数值部分进行比较，去掉 's' 后缀
  const numA = a.tw ? parseInt(a.tw.replace('s', ''), 10) : 0;
  const numB = b.tw ? parseInt(b.tw.replace('s', ''), 10) : 0;

  // 按数值大小排序
  if (numA !== numB) {
    return numA - numB;
  }
  // 如果tw相同，按行号排序
  return a.row - b.row;
};
// Resonance表specialize列排序方法
const sortResonanceSpecialize = (a: TableDataRow, b: TableDataRow) => {
  const specializeCompare = sortAttributeHelper(
    (item) => item.specialize,
    tableResonanceRowHeaderSpecialize,
  )(a, b);

  if (specializeCompare !== 0) return specializeCompare;

  // 按行号排序
  return a.row - b.row;
};

// Dominant表target_attribute列排序方法
const sortDominantAttribute = (a: TableDataRow, b: TableDataRow) => {
  // 首先按 target_attribute 排序
  const attrCompare = sortAttributeHelper(
    (item) => item.target_attribute,
    tableDominantRowHeaderAttribute,
  )(a, b);

  if (attrCompare !== 0) return attrCompare;

  // 如果 target_attribute 相同，按 target_param 排序
  const paramCompare = sortAttributeHelper(
    (item) => item.target_param,
    tableDominantRowHeaderSpecialize,
  )(a, b);

  if (paramCompare !== 0) return paramCompare;

  // 如果 target_param 也相同，按 target_attribute_2 排序
  const attr2Compare = sortAttributeHelper(
    (item) => item.target_attribute_2,
    tableDominantRowHeaderAttribute,
  )(a, b);

  if (attr2Compare !== 0) return attr2Compare;

  // 按行号排序
  return a.row - b.row;
};

// Dominant表target_attribute_2列排序方法
const sortDominantAttribute2 = (a: TableDataRow, b: TableDataRow) => {
  // 首先按 target_attribute_2 排序
  const attr2Compare = sortAttributeHelper(
    (item) => item.target_attribute_2,
    tableDominantRowHeaderAttribute,
  )(a, b);

  if (attr2Compare !== 0) return attr2Compare;

  // 如果 target_attribute_2 相同，按 target_param_2 排序
  const param2Compare = sortAttributeHelper(
    (item) => item.target_param_2,
    tableDominantRowHeaderSpecialize,
  )(a, b);

  if (param2Compare !== 0) return param2Compare;

  // 如果 target_param_2 也相同，按 target_attribute 排序
  const attrCompare = sortAttributeHelper(
    (item) => item.target_attribute,
    tableDominantRowHeaderAttribute,
  )(a, b);

  if (attrCompare !== 0) return attrCompare;

  // 按行号排序
  return a.row - b.row;
};

// 判断Dominant表内参数的特化值
const isDominantSpecializeNotMatch = (
  headerItem: (typeof tableDominantColumnHeader)[number],
  row: TableDataRow,
  card: CgssCardSkillTableItem,
) => {
  // 不检查dominant列
  if (headerItem.prop === 'dominant') {
    return false;
  }

  // 获取要检查的参数字段
  const paramField = headerItem.param;
  if (!paramField) {
    return false;
  }

  // 获取要检查的属性值
  let valueToCheck: number | undefined;
  if (paramField === 'target_param' || paramField === 'target_param_2') {
    const paramKey = row[paramField] as keyof CgssCardSkillTableItem['stats'];
    valueToCheck = card.stats[paramKey];
  } else {
    // 如果param字段不是target_param或target_param_2，则不检查
    return false;
  }

  // 检查值是否小于阈值
  return valueToCheck !== undefined && valueToCheck < DOMINANT_PARAM_THRESHOLD_SPECIALIZE;
};

// 判断Dominant表内参数是否需要下划线
const isDominantParamUnderline = (
  headerItem: (typeof tableDominantColumnHeader)[number],
  row: TableDataRow,
  param: string,
) => {
  // 如果是dominant列，需要检查target_param或target_param_2
  if (headerItem.skill === 'dominant') {
    return row.target_param === param || row.target_param_2 === param;
  }

  // 使用headerItem.param来决定检查哪个参数
  if (headerItem.param === 'target_param') {
    return row.target_param === param;
  }

  if (headerItem.param === 'target_param_2') {
    return row.target_param_2 === param;
  }

  return false;
};

// 生成卡片数据对象
const createCardDataItem = (item: CgssCardSkillTableItem): CardData => {
  return {
    card: item,
    isBrightness: true,
  };
};

// 定义卡片排序函数
const sortCardsByParam = (
  cards: CardData[],
  targetParam: string | undefined,
  data: CgssCardSkillTableItem[],
) => {
  if (!targetParam) return cards;

  return cards.sort((a, b) => {
    // 找到a卡片的数值
    const cardA = a.card;
    // 找到b卡片的数值
    const cardB = b.card;

    if (!cardA || !cardB) return 0;

    // 根据target_param或target_param_2获取对应数值
    const paramKey = targetParam as keyof CgssCardSkillTableItem['stats'];

    const aValue = cardA.stats[paramKey] || 0;
    const bValue = cardB.stats[paramKey] || 0;

    // 从大到小排序
    return bValue - aValue;
  });
};

// 初始化Resonance表格数据
const initializeDataResonance = (data: CgssCardSkillTableItem[]): TableDataRow[] => {
  // 创建表格数据结构
  const result: TableDataRow[] = [];

  // 为每个specialize和tw的组合创建数据行
  // 使用tableResonanceColumnHeader的prop来动态生成初始数据
  tableResonanceRowHeaderSpecialize.forEach((specialize) => {
    tableResonanceRowHeaderTw.forEach((tw) => {
      const row: TableDataRow = {
        specialize: specialize,
        tw: tw + 's',
        row: result.length, // 添加行号
      };

      // 遍历tableResonanceColumnHeader，为每个prop创建空数组
      tableResonanceColumnHeader.forEach((column) => {
        row[column.prop] = [];
      });

      result.push(row);
    });
  });

  // 遍历技能表数据，根据specialize和skill.tw分配到对应的单元格
  // Resonance表里，一条原始数据最多分配到一个单元格
  data.forEach((item: CgssCardSkillTableItem) => {
    // 检查稀有度，如果不是SSR则直接返回，不执行后续操作
    if (item.rarity !== 'ssr') {
      return;
    }

    // 根据specialize确定行的前半部分索引
    const getSpecializeByStats = (stats: { vocal: any; visual: any; dance: any }) => {
      const { vocal, dance, visual } = stats;
      if (vocal >= dance && vocal >= visual) return 'vocal';
      if (dance >= vocal && dance >= visual) return 'dance';
      return 'visual';
    };

    const actualSpecialize = getSpecializeByStats(item.stats);
    const specializeIndex = tableResonanceRowHeaderSpecialize.indexOf(actualSpecialize);
    // const specializeIndex = tableResonanceRowHeaderSpecialize.indexOf(item.specialize);
    if (specializeIndex === -1) {
      // 如果specialize不在预定义范围内，跳过该数据
      return;
    }

    // 根据skill.tw确定行索引
    let twIndex = tableResonanceRowHeaderTw.indexOf(String(item.skill.params.tw));
    // 处理 magic 类型的技能
    if (item.skill.type === 'magic') {
      // 使用 attribute 确定所在的位置
      twIndex = tableResonanceRowHeaderAttribute.indexOf(String(item.attribute.toLowerCase()));
    }
    if (twIndex === -1) {
      // 如果tw不在预定义范围内，跳过该数据
      return;
    }

    // 计算实际行索引
    const rowIndex = specializeIndex * tableResonanceRowHeaderTw.length + twIndex;

    // 根据skill.type确定列名
    const columnInfo = tableResonanceColumnHeader.find((col) => col.skill === item.skill.type);
    if (!columnInfo) {
      // 如果type不在预定义范围内，跳过该数据
      return;
    }
    let colName = columnInfo.prop;

    // 将数据添加到对应单元格
    if (Array.isArray(result[rowIndex]?.[colName])) {
      result[rowIndex][colName].push(createCardDataItem(item));
    }
  });

  // 对Resonance表中的单元格进行排序
  result.forEach((row) => {
    // 获取当前行排序对应的特化属性
    const statKey = row.specialize as keyof CgssCardSkillTableItem['stats'];

    // 对当前行每个列对应的单元格进行排序
    tableResonanceColumnHeader.forEach((header) => {
      const columnName = header.prop;
      const cardsInColumn = row[columnName];

      if (Array.isArray(cardsInColumn) && cardsInColumn.length > 0) {
        row[columnName] = sortCardsByParam(cardsInColumn, statKey, data);
      }
    });
  });

  return result;
};

// 初始化Dominant表格数据
const initializeDataDominant = (data: CgssCardSkillTableItem[]): TableDataRow[] => {
  // 创建表格数据结构，包含144种情况 (3*2*3*2*4 = 144)
  const result: TableDataRow[] = [];

  // 遍历所有可能的组合
  tableDominantRowHeaderAttribute.forEach((attr2) => {
    // target_attribute_2: 3个
    tableDominantRowHeaderAttribute.forEach((attr) => {
      // target_attribute: 3个
      if (attr !== attr2) {
        // 确保attr !== attr2 (3*2 = 6种组合)
        tableDominantRowHeaderTw.forEach((tw) => {
          // tw: 4个 (现在在第3个位置插入)
          tableDominantRowHeaderSpecialize.forEach((param2) => {
            // target_param_2: 3个
            tableDominantRowHeaderSpecialize.forEach((param) => {
              // target_param: 3个
              if (param !== param2) {
                // 确保param !== param2 (3*2 = 6种组合)
                const row: TableDataRow = {
                  target_attribute_2: attr2,
                  target_attribute: attr,
                  tw: tw + 's',
                  target_param_2: param2,
                  target_param: param,
                  row: result.length, // 添加行号
                };

                // 遍历tableDominantColumnHeader，为每个prop创建空数组
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

  // 遍历技能表数据，根据leaderSkill.params和skill.params分配到对应的单元格
  // Dominant表里，一条原始数据可能分配到多个单元格
  data.forEach((item: CgssCardSkillTableItem) => {
    // 检查稀有度，如果不是SSR则直接返回，不执行后续操作
    if (item.rarity !== 'ssr') {
      return;
    }

    // 处理 dominant 类型的技能
    if (item.skill.type === 'dominant') {
      // 处理 leader skill（保持原有的 dominant 逻辑）
      if (item.leaderSkill.params) {
        // 获取leaderSkill参数
        const targetAttr = item.leaderSkill.params.target_attribute;
        const targetAttr2 = item.leaderSkill.params.target_attribute_2;
        const targetParam = item.leaderSkill.params.target_param;
        const targetParam2 = item.leaderSkill.params.target_param_2;

        // 检查参数是否存在
        if (!targetAttr || !targetAttr2 || !targetParam || !targetParam2) {
          return;
        }

        // 根据target_attribute和target_attribute_2确定行的索引
        const attrIndex = tableDominantRowHeaderAttribute.indexOf(targetAttr.toLowerCase());
        const attr2Index = tableDominantRowHeaderAttribute.indexOf(targetAttr2.toLowerCase());
        const paramIndex = tableDominantRowHeaderSpecialize.indexOf(targetParam.toLowerCase());
        const param2Index = tableDominantRowHeaderSpecialize.indexOf(targetParam2.toLowerCase());

        if (attrIndex === -1 || attr2Index === -1 || paramIndex === -1 || param2Index === -1) {
          // 如果不在预定义范围内，跳过该数据
          return;
        }

        if (attrIndex === attr2Index || paramIndex === param2Index) {
          // 如果两个属性相同或两个参数相同，跳过该数据
          return;
        }

        // 根据skill.tw确定tw索引
        const twIndex = tableDominantRowHeaderTw.indexOf(String(item.skill.params.tw));
        if (twIndex === -1) {
          // 如果tw不在预定义范围内，跳过该数据
          return;
        }

        // 计算行索引
        // 索引计算: ((attr2Index * 2 + (attrIndex > attr2Index ? attrIndex - 1 : attrIndex)) * 4 + twIndex) * 6 +
        //           (param2Index * 2 + (paramIndex > param2Index ? paramIndex - 1 : paramIndex))
        const attrCount = tableDominantRowHeaderAttribute.length; // 3
        const validAttrCombos = attrCount * (attrCount - 1); // 3 * 2 = 6
        const paramCount = tableDominantRowHeaderSpecialize.length; // 3
        const validParamCombos = paramCount * (paramCount - 1); // 3 * 2 = 6
        const twCount = tableDominantRowHeaderTw.length; // 4

        const attrComboIndex =
          attr2Index * (attrCount - 1) + (attrIndex > attr2Index ? attrIndex - 1 : attrIndex);
        const paramComboIndex =
          param2Index * (paramCount - 1) + (paramIndex > param2Index ? paramIndex - 1 : paramIndex);
        const rowIndex = (attrComboIndex * twCount + twIndex) * validParamCombos + paramComboIndex;

        // 将数据添加到对应单元格
        if (
          result[rowIndex] &&
          result[rowIndex].dominant &&
          Array.isArray(result[rowIndex].dominant)
        ) {
          result[rowIndex].dominant.push(createCardDataItem(item));
        } else {
          console.warn(`Target column dominant not found or not an array at rowIndex ${rowIndex}`);
        }
      }
    } else {
      // 统一处理所有其他技能，注意数据可以被分配进多行
      result.forEach((row, rowIndex) => {
        tableDominantColumnHeader.forEach((colDef) => {
          // 跳过dominant列
          if (colDef.skill === 'dominant') return;

          // 检查技能类型是否匹配
          if (colDef.skill === 'psb_') {
            if (!item.skill.type.startsWith(colDef.skill)) return;
          } else {
            if (colDef.skill !== item.skill.type) return;
          }

          // 检查 tw
          if (colDef.tw !== undefined) {
            if (String(item.skill.params.tw) !== colDef.tw) return;
          } else {
            if (String(item.skill.params.tw) + 's' !== row.tw && !colDef.extraColumn) return;
          }

          // 获取属性和参数字段名
          const attrField = colDef.attribute; // e.g., 'target_attribute'
          const paramField = colDef.param; // e.g., 'target_param'

          if (!attrField || !paramField) return;

          const targetAttr = row[attrField as keyof typeof row];
          const targetParam = row[paramField as keyof typeof row];

          // 属性匹配
          if (item.attribute.toLowerCase() !== targetAttr) return;

          // 参数字段存在性检查
          if (!targetParam) return;

          // 阈值检查
          const threshold = ['overload', 'overdrive', 'alternate', 'mutual'].includes(colDef.skill)
            ? DOMINANT_PARAM_THRESHOLD_ADD
            : DOMINANT_PARAM_THRESHOLD_SPECIALIZE;
          const statValue = item.stats[targetParam as keyof CgssCardSkillTableItem['stats']];
          if (statValue < threshold) return;

          // 推入对应 prop 的数组
          const targetArray = result[rowIndex]?.[colDef.prop];
          if (Array.isArray(targetArray)) {
            targetArray.push(createCardDataItem(item));
          }
        });
      });
    }
  });

  // 对Dominant表中的单元格进行排序
  result.forEach((row) => {
    // 遍历tableDominantColumnHeader中的每一行，检查排序项目与对应的特化属性
    tableDominantColumnHeader.forEach((colDef) => {
      const prop = colDef.prop;
      const param = colDef.param;

      // 检查行中是否存在对应列且该列有数据
      if (Array.isArray(row[prop]) && row[prop].length > 0) {
        // 使用对应的param值进行排序
        row[prop] = sortCardsByParam(
          row[prop],
          param === 'target_param_2' ? row.target_param_2 : row.target_param,
          data,
        );
      }
    });
  });

  return result;
};

// Resonance表格数据
const tableDataResonance = ref<TableDataRow[]>(
  initializeDataResonance(CgssCardSkillTable as CgssCardSkillTableItem[]),
);

// Dominant表格数据
const tableDataDominant = ref<TableDataRow[]>(
  initializeDataDominant(CgssCardSkillTable as CgssCardSkillTableItem[]),
);

// 使用计算属性过滤dominant表中dominant列为空的行
const filteredTableDataDominant = computed(() => {
  if (switchShowAllAttributeSpecializePairs.value) {
    // 只显示符合tableDominantRowHeaderSpecializePairs中指定的target_param和target_param_2组合的行
    return tableDataDominant.value.filter((row) =>
      tableDominantRowHeaderAttributeSpecializePairs.some(
        (pair) =>
          pair.target_param_2 === row.target_param_2 && pair.target_param === row.target_param,
      ),
    );
  }
  return tableDataDominant.value.filter(
    (row) => Array.isArray(row.dominant) && row.dominant.length > 0,
  );
});

// 处理图标点击事件
const handleIconClick = (row: TableDataRow, colKey: string, index: number) => {
  // 验证输入参数
  if (!row || !colKey || index < 0) {
    console.warn('Invalid parameters for handleIconClick');
    return;
  }

  // 验证列数据是否为数组
  const colData = row[colKey];
  if (!Array.isArray(colData) || index >= colData.length) {
    console.warn('Invalid column data or index out of bounds');
    return;
  }

  const icon = colData[index];
  // 验证图标对象是否有效
  if (!icon || !icon.card) {
    console.warn('Invalid icon object');
    return;
  }

  // 如果两个开关都关闭，则不执行任何操作
  if (!switchToggleCardStatus.value && !switchViewCardInfo.value) {
    return;
  }

  // 如果只开启查看卡片信息开关
  if (switchViewCardInfo.value) {
    if (icon.card.link) {
      // 提取链接中的数字并减1
      const modifiedLink = icon.card.link.replace(/c_(\d+)_/, (match, num) => {
        const newNum = parseInt(num) - 1;
        return `c_${newNum}_`;
      });
      window.open('https://starlight.346lab.org' + modifiedLink, '_blank');
    } else {
      console.warn(`No link found for card with cid: ${icon.card.cid}`);
    }
    return;
  }

  // 否则，判断是否开启切换卡片状态开关
  else if (switchToggleCardStatus.value) {
    const targetName = icon.card.title;
    const newState = !icon.isBrightness;

    // 更新所有名称相同的图标的状态 - resonance表
    tableDataResonance.value.forEach((dataRow) => {
      Object.keys(dataRow).forEach((colKey) => {
        const colValue = dataRow[colKey];
        // 验证列值是否为数组
        if (Array.isArray(colValue)) {
          colValue.forEach((icon) => {
            // 验证图标对象是否有效
            if (icon && icon.card && icon.card.title === targetName) {
              icon.isBrightness = newState;
            }
          });
        }
      });
    });

    // 更新所有名称相同的图标的状态 - dominant表
    tableDataDominant.value.forEach((dataRow) => {
      Object.keys(dataRow).forEach((colKey) => {
        const colValue = dataRow[colKey];
        // 验证列值是否为数组
        if (Array.isArray(colValue)) {
          colValue.forEach((icon) => {
            // 验证图标对象是否有效
            if (icon && icon.card && icon.card.title === targetName) {
              icon.isBrightness = newState;
            }
          });
        }
      });
    });
    return;
  }
};

// 名字过滤器列表，使用计算属性
const splitNameFilter = computed(() => {
  if (!inputNameFilter.value) return [];

  // 将过滤器按空格、换行、半角逗号或全角顿号分割，并移除空字符串
  return inputNameFilter.value
    .split(/[ ,、\n]+/)
    .filter((name) => name.trim() !== '')
    .map((name) => name.toLowerCase().trim());
});

// 名字过滤器
const isNameMatched = (name: string | undefined) => {
  // 如果没有名字，返回true
  if (!name) return true;

  // 如果过滤列表为空，返回true
  if (splitNameFilter.value.length === 0) return true;

  // 检查标题是否包含任何一个名字（不区分大小写）
  return splitNameFilter.value.some((name2) => name.toLowerCase().includes(name2));
};

// 切换所有图标的亮度
const toggleAllIconsBrightness = () => {
  allIconsBright.value = !allIconsBright.value;
  tableDataResonance.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      // 验证列值是否为数组
      if (Array.isArray(colValue)) {
        colValue.forEach((icon) => {
          // 验证图标对象是否有效
          if (icon) {
            icon.isBrightness = allIconsBright.value;
          }
        });
      }
    });
  });

  tableDataDominant.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      if (Array.isArray(colValue)) {
        colValue.forEach((icon) => {
          if (icon) {
            icon.isBrightness = allIconsBright.value;
          }
        });
      }
    });
  });
};

// 根据CID列表更新卡片亮度状态
const updateCardBrightnessByCids = (disabledCids: string[]) => {
  // 更新所有表格中的卡片状态
  [...tableDataResonance.value, ...tableDataDominant.value].forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      if (Array.isArray(colValue)) {
        colValue.forEach((data) => {
          if (data) {
            if (disabledCids.includes(data.card.cid)) {
              data.isBrightness = false; // 在disabled列表中的卡片设为暗
            } else {
              data.isBrightness = true; // 不在disabled列表中的卡片设为亮
            }
          }
        });
      }
    });
  });
};
</script>

<style lang="scss" scoped>
.el-table {
  --el-table-header-text-color: var(--el-text-color-regular);
}
:deep(.el-table) {
  .skill-motif,
  .skill-symphony,
  .skill-refrain,
  .skill-dominant,
  .skill-mutual,
  .skill-overdrive,
  .skill-cboost {
    background-color: hsl(0, 0%, 95%);
  }
  .el-table__cell {
    padding: 2px 0;
  }
  thead .el-table__cell.icons .cell {
    padding: 8px 8px;
  }
  tbody .el-table__cell.icons .cell {
    padding: 0 2px;
  }
}
.el-link {
  vertical-align: inherit;
}
.unit-viewer-config {
  > div {
    display: flex;
    flex-wrap: wrap;
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
.unit-title,
.unit-table {
  margin: 1em 0;
}
.el-table {
  .table-row-info {
    font-weight: bold;
  }
  .table-icons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }
  .cgss-icon {
    display: inline-block;
    scale: 1;
    cursor: pointer;
    margin: 0;
    border-radius: 4px;
    width: 48px;
    height: 48px;
  }
  .icon-filter-match {
    scale: 1;
    margin: 0;
  }
  .icon-filter-not-match {
    scale: 0.375;
    margin: 0;
  }
  .icon-specialize-not-match {
    scale: 0.625;
    margin: -6px;
    &.icon-filter-match {
      scale: 0.75;
      margin: 0px;
    }
    &.icon-filter-not-match {
      scale: 0.375;
      margin: 0px;
    }
  }
  .icon-extra {
    scale: 0.75;
    margin: -6px;
    &.icon-filter-match {
      scale: 1;
      margin: 0;
    }
    &.icon-specialize-not-match {
      scale: 0.375;
      margin: -12px;
    }
    &.icon-filter-not-match {
      scale: 0.375;
      margin: -12px;
    }
  }
  .cgss-icon.icon-dark {
    filter: brightness(0.4);
  }
  html.icon-dark .cgss-icon.icon-dark {
    filter: brightness(0.25);
  }
}
</style>
