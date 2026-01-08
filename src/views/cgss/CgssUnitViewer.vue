<template>
  <div class="cgss-unit-viewer">
    <h1 class="view-title">偶像大师灰姑娘女孩星光舞台 组队信息</h1>
    <div class="al-divider"></div>
    <div class="unit-viewer-config">
      <div>
        <el-switch v-model="switchNameFilter" active-text="筛选名字" />
      </div>
      <div v-if="switchNameFilter" class="config-name-filter">
        <el-input
          v-model="inputNameFilter"
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
      <cgss-unit-viewer-state-manager
        v-if="switchToggleCardStatus"
        :table-data="[...tableDataResonance, ...tableDataDominant]"
        @update-card-status="updateCardBrightnessByCids"
      >
        <template #prefix>
          <div>
            <el-button @click="toggleAllImagesBrightness" type="primary" size="default">
              切换所有状态
            </el-button>
          </div>
        </template>
      </cgss-unit-viewer-state-manager>
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
              <div class="table-icons-resonance">
                <cgss-unit-viewer-card-tooltip
                  v-for="(icon, iconIndex) in scope.row[headerItem.prop]"
                  :key="iconIndex"
                  :card="icon"
                  :is-vocal-underlined="scope.row.specialize === 'vocal'"
                  :is-dance-underlined="scope.row.specialize === 'dance'"
                  :is-visual-underlined="scope.row.specialize === 'visual'"
                >
                  <div
                    :class="{
                      'cgss-icon': true,
                      [`id_${icon.cid}`]: true,
                      dark: switchToggleCardStatus && !icon.isBrightness,
                      'icon-small': headerItem.extraColumn,
                      'icon-filter-not-match':
                        switchNameFilter && !isNameMatched(icon.title, inputNameFilter),
                      'icon-filter-match':
                        switchNameFilter && isNameMatched(icon.title, inputNameFilter),
                    }"
                    @click="handleIconClick(scope.row, headerItem.prop, Number(iconIndex))"
                  ></div>
                </cgss-unit-viewer-card-tooltip>
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
      </div>
    </div>
    <div class="unit-table">
      <el-table
        :data="filteredTableDataDominant"
        style="width: 100%"
        :max-height="isMobile ? 560 : 9999"
        border
        :default-sort="{ prop: 'target_attribute_2', order: 'ascending' }"
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
                switchShowOverloadOverdrive)
            "
            :prop="headerItem.prop"
            :label="
              switchShowSimpleLabels
                ? headerItem.labelCn
                : `${headerItem.labelCn} ${headerItem.labelEn}`
            "
            :class-name="`icons skill-${headerItem.skill ?? headerItem.prop}`"
            :min-width="isSmallScreen ? headerItem.minWidthSmallScreen : headerItem.minWidth"
            :width="isSmallScreen ? undefined : headerItem.width"
          >
            <template #default="scope">
              <div class="table-icons-container">
                <CgssUnitViewerCardTooltip
                  v-for="(icon, iconIndex) in scope.row[headerItem.prop]"
                  :key="iconIndex"
                  :card="icon"
                  :is-vocal-underlined="isDominantParamBold(headerItem, scope.row, 'vocal')"
                  :is-dance-underlined="isDominantParamBold(headerItem, scope.row, 'dance')"
                  :is-visual-underlined="isDominantParamBold(headerItem, scope.row, 'visual')"
                >
                  <div
                    :class="{
                      'cgss-icon': true,
                      [`id_${icon.cid}`]: true,
                      dark: !icon.isBrightness && switchToggleCardStatus,
                      'icon-small': headerItem.extraColumn,
                      'icon-filter-not-match':
                        switchNameFilter && !isNameMatched(icon.title, inputNameFilter),
                      'icon-filter-match':
                        switchNameFilter && isNameMatched(icon.title, inputNameFilter),
                    }"
                    @click="handleIconClick(scope.row, headerItem.prop, Number(iconIndex))"
                  ></div>
                </CgssUnitViewerCardTooltip>
                <div v-if="scope.row[headerItem.prop].length === 0">x</div>
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

interface CgssCardSkillTableItem {
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
const tableDominantRowHeaderTw = ['6', '9', '11', '13'];

const tableDominantColumnHeader = [
  {
    prop: 'dominant',
    labelCn: '双色',
    labelEn: 'dominant',
    skill: 'dominant',
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
    width: 108,
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
    width: 152,
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
    param: 'target_param_2',
    extraColumn: true,
  },
];

// Cell item
interface CellItem {
  cid: string;
  name: string;
  title?: string;
  attribute?: string;
  vocal?: number;
  dance?: number;
  visual?: number;
  isBrightness?: boolean;
  link?: string;
}

// Resonance table
interface TableResonanceRow {
  tw: string;
  specialize?: string;
  target_attribute_2?: string;
  target_attribute?: string;
  target_param_2?: string;
  target_param?: string;
  row: number;
  [key: string]: CellItem[] | string | number | undefined;
}

// 模式切换
const switchToggleCardStatus = ref(true);
const switchViewCardInfo = ref(false);
const switchNameFilter = ref(false);
const switchShowSimpleLabels = ref(window.innerWidth < 768);
const switchShowExtraTableConfig = ref(true);
const switchShowExtraColumns = ref(false);
const switchShowOverloadOverdrive = ref(true);

const inputNameFilter = ref(
  `中野有香 持田亜里沙 三村かな子 江上椿 棣方愛海 藤本里奈 遊佐こずえ 赤西瑛梨華 小早川紗枝 楊菲菲 道明寺歌鈴 浅野風香 大西由里子 栗原ネネ 村松さくら 有浦柑奈 辻野あかり 上条春菜 荒木比奈 東郷あい 多田李衣菜 佐々木千枝 服部瞳子 古澤頼子 八神マキノ ケイト 岸部彩華 成宮由愛 藤居朋 二宮飛鳥 桐生つかさ 望月聖 小室千奈美 本田未央 龍崎薫 松山久美子 愛野渚 野々村そら 若林智香 日野茜 十時愛梨 相馬夏美 市原仁奈 小松伊吹 難波笑美 浜口あやめ 佐藤心`,
);
const inputNameFilterDefaultInformation = ref('当前默认数据：LIVE Carnival 2026 Spring');

const allImagesBright = ref(true);

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
const isSmallScreen = ref(window.innerWidth < 1528);

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  isSmallScreen.value = window.innerWidth < 1528;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 添加响应式变量跟踪当前排序字段
const currentSortField = ref('specialize'); // 默认按specialize排序

// 添加handleResonanceSortChange函数
const handleResonanceSortChange = ({ column, prop, order }: any) => {
  if (prop) {
    currentSortField.value = prop;
  }
};

// 使用计算属性来确定是否需要合并单元格
const shouldMergeSpecializeCells = computed(() => {
  return currentSortField.value === 'specialize';
});

// 合并单元格
const tableResonanceSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  // 如果不是按specialize排序，则不合并单元格
  if (!shouldMergeSpecializeCells.value) {
    return [1, 1];
  }

  // 原来的合并逻辑保持不变，仅在按specialize排序时生效
  if (columnIndex === 0) {
    if (rowIndex % tableResonanceRowHeaderTw.length === 0) {
      return [tableResonanceRowHeaderTw.length, 1];
    } else {
    }
    return [0, 0];
  }
};

// 创建一个用于处理单个参数排序的通用函数
const sortAttributeHelper = (
  getter: (item: TableResonanceRow) => string | undefined,
  order: string[],
) => {
  return (a: TableResonanceRow, b: TableResonanceRow) => {
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

// 使用通用函数创建排序方法 - 需要单独处理多级排序
const sortDominantAttribute = (a: TableResonanceRow, b: TableResonanceRow) => {
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

const sortDominantAttribute2 = (a: TableResonanceRow, b: TableResonanceRow) => {
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

// 添加Resonance表的排序方法
const sortResonanceSpecialize = (a: TableResonanceRow, b: TableResonanceRow) => {
  const order = tableResonanceRowHeaderSpecialize;
  const indexA = order.indexOf(a.specialize || '');
  const indexB = order.indexOf(b.specialize || '');

  // 如果specialize值在预定义顺序中，则按预定义顺序排序
  if (indexA !== -1 && indexB !== -1) {
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    // 如果specialize相同，按行号排序
    return a.row - b.row;
  }

  // 如果其中一个specialize值不在预定义顺序中，则将预定义顺序中的值排在前面
  if (indexA !== -1) {
    return -1;
  }
  if (indexB !== -1) {
    return 1;
  }

  // 如果都不在预定义顺序中，则按字母顺序排序
  if (a.specialize && b.specialize) {
    const compareResult = a.specialize.localeCompare(b.specialize);
    if (compareResult !== 0) {
      return compareResult;
    }
    // 如果specialize相同，按行号排序
    return a.row - b.row;
  }
  // 如果specialize都为空，按行号排序
  return a.row - b.row;
};

const sortTableTw = (a: TableResonanceRow, b: TableResonanceRow) => {
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

// 创建一个函数来生成卡片数据对象
const createCardDataItem = (item: CgssCardSkillTableItem) => {
  return {
    cid: item.cid,
    name: item.name,
    title: `[${item.title}] ${item.name}`,
    link: item.link,
    isBrightness: true,
    attribute: item.attribute,
    vocal: item.stats.vocal,
    visual: item.stats.visual,
    dance: item.stats.dance,
    skill: item.skill.type,
    tw: `${item.skill.params.tw}s`,
  };
};

// 初始化Resonance表格数据
const initializeDataResonance = (data: CgssCardSkillTableItem[]): TableResonanceRow[] => {
  // 创建表格数据结构
  const result: TableResonanceRow[] = [];

  // 为每个specialize和tw的组合创建数据行
  // 使用tableResonanceColumnHeader的prop来动态生成初始数据
  tableResonanceRowHeaderSpecialize.forEach((specialize) => {
    tableResonanceRowHeaderTw.forEach((tw) => {
      // 动态创建列数据，使用tableResonanceColumnHeader的prop
      const row: TableResonanceRow = {
        specialize: specialize, // 添加属性信息
        tw: tw + 's', // 添加间隔信息
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

  return result;
};

// 初始化Dominant表格数据
const initializeDataDominant = (data: CgssCardSkillTableItem[]): TableResonanceRow[] => {
  // 创建表格数据结构，包含144种情况 (3*2*3*2*4 = 144)
  const result: TableResonanceRow[] = [];

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
                // 动态创建列数据，使用tableDominantColumnHeader的prop
                const row: TableResonanceRow = {
                  target_attribute_2: attr2, // 第一列: target_attribute_2
                  target_attribute: attr, // 第二列: target_attribute
                  tw: tw + 's', // 第三列: tw
                  target_param_2: param2, // 第四列: target_param_2
                  target_param: param, // 第五列: target_param
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
          // typescript bug
          (result[rowIndex].dominant as CellItem[]).push(createCardDataItem(item));
        } else {
          console.warn(`Target column dominant not found or not an array at rowIndex ${rowIndex}`);
        }
      }
    }

    // 处理 alternate 和 mutual 类型的技能
    if (item.skill.type === 'alternate' || item.skill.type === 'mutual') {
      // 遍历结果数组，找到所有符合条件的行
      result.forEach((row, rowIndex) => {
        // // 检查行是否存在
        // if (!result[rowIndex]) {
        //   return;
        // }

        // 处理 alternate 类型：匹配 skill.type 是 alternate，attribute 与当前行 target_attribute 相同，
        // row.target_param 的值大于5000，且skill.tw与当前行tw相同
        if (
          item.skill.type === 'alternate' &&
          item.attribute.toLowerCase() === row.target_attribute &&
          row.target_param &&
          item.stats[row.target_param as keyof CgssCardSkillTableItem['stats']] > 5000 &&
          String(item.skill.params.tw) + 's' === row.tw
        ) {
          (result[rowIndex]?.alternate as CellItem[]).push(createCardDataItem(item));
        }

        // 处理 mutual 类型：匹配 skill.type 是 mutual，attribute 与当前行 target_attribute_2 相同，
        // row.target_param_2 的值大于5000，且skill.tw与当前行tw相同
        if (
          item.skill.type === 'mutual' &&
          item.attribute.toLowerCase() === row.target_attribute_2 &&
          row.target_param_2 &&
          item.stats[row.target_param_2 as keyof CgssCardSkillTableItem['stats']] > 5000 &&
          String(item.skill.params.tw) + 's' === row.tw
        ) {
          (result[rowIndex]?.mutual as CellItem[]).push(createCardDataItem(item));
        }
      });
    }

    // 处理 overload 和 overdrive 类型的技能
    if (item.skill.type === 'overload' || item.skill.type === 'overdrive') {
      // 遍历结果数组，找到所有符合条件的行
      result.forEach((row, rowIndex) => {
        // 遍历所有列定义，查找匹配的overload和overdrive列
        tableDominantColumnHeader.forEach((colDef) => {
          // 检查是否为overload或overdrive类型的列
          if (colDef.skill === item.skill.type) {
            // 检查tw是否匹配
            if (colDef.tw === String(item.skill.params.tw)) {
              // overload: 匹配attribute与行的target_attribute相同，且stats[target_param]的值大于5000
              if (
                item.skill.type === 'overload' &&
                item.attribute.toLowerCase() === row.target_attribute &&
                row.target_param &&
                item.stats[row.target_param as keyof CgssCardSkillTableItem['stats']] > 5000
              ) {
                (result[rowIndex]?.[colDef.prop] as CellItem[]).push(createCardDataItem(item));
              }
              // overdrive: 匹配attribute与行的target_attribute_2相同，且stats[target_param_2]的值大于5000
              else if (
                item.skill.type === 'overdrive' &&
                item.attribute.toLowerCase() === row.target_attribute_2 &&
                row.target_param_2 &&
                item.stats[row.target_param_2 as keyof CgssCardSkillTableItem['stats']] > 5000
              ) {
                (result[rowIndex]?.[colDef.prop] as CellItem[]).push(createCardDataItem(item));
              }
            }
          }
        });
      });
    }

    // 处理 act 类型的技能 (演技技能，如 psb_ 开头的技能)
    if (item.skill.type.startsWith('psb_')) {
      // 遍历结果数组，找到所有符合条件的行
      result.forEach((row, rowIndex) => {
        // act: 匹配attribute与行的target_attribute相同，且stats[target_param]的值大于5000
        if (
          item.attribute.toLowerCase() === row.target_attribute &&
          row.target_param &&
          item.stats[row.target_param as keyof CgssCardSkillTableItem['stats']] > 5000
        ) {
          (result[rowIndex]?.act as CellItem[]).push(createCardDataItem(item));
        }
      });
    }

    // 处理 combo 类型的技能 (连击技能，如 cboost 开头的技能)
    if (item.skill.type.startsWith('cboost')) {
      // 遍历结果数组，找到所有符合条件的行
      result.forEach((row, rowIndex) => {
        // combo: 匹配attribute与行的target_attribute_2相同，且stats[target_param_2]的值大于5000
        if (
          item.attribute.toLowerCase() === row.target_attribute_2 &&
          row.target_param_2 &&
          item.stats[row.target_param_2 as keyof CgssCardSkillTableItem['stats']] > 5000
        ) {
          (result[rowIndex]?.combo as CellItem[]).push(createCardDataItem(item));
        }
      });
    }
  });

  // 定义排序函数
  const sortCardsByParam = (
    cards: CellItem[],
    targetParam: string | undefined,

    data: CgssCardSkillTableItem[],
  ) => {
    if (!targetParam) return cards;

    return cards.sort((a, b) => {
      // 找到a卡片的数值
      const cardA = data.find((item) => item.cid === a.cid);
      // 找到b卡片的数值
      const cardB = data.find((item) => item.cid === b.cid);

      if (!cardA || !cardB) return 0;

      // 根据target_param或target_param_2获取对应数值
      const paramKey = targetParam as keyof CgssCardSkillTableItem['stats'];

      const aValue = cardA.stats[paramKey] || 0;
      const bValue = cardB.stats[paramKey] || 0;

      // 从大到小排序
      return bValue - aValue;
    });
  };

  // 对列的数据进行排序
  result.forEach((row) => {
    // 对alternate列进行排序：根据对应行的target_param数值
    if (Array.isArray(row.alternate) && row.alternate.length > 0) {
      row.alternate = sortCardsByParam(row.alternate, row.target_param, data);
    }

    // 对mutual列进行排序：根据对应行的target_param_2数值
    if (Array.isArray(row.mutual) && row.mutual.length > 0) {
      row.mutual = sortCardsByParam(row.mutual, row.target_param_2, data);
    }

    // 对overload列进行排序：根据对应行的target_param数值
    if (Array.isArray(row.overload_4) && row.overload_4.length > 0) {
      row.overload_4 = sortCardsByParam(row.overload_4, row.target_param, data);
    }

    if (Array.isArray(row.overload_6) && row.overload_6.length > 0) {
      row.overload_6 = sortCardsByParam(row.overload_6, row.target_param, data);
    }

    if (Array.isArray(row.overload_7) && row.overload_7.length > 0) {
      row.overload_7 = sortCardsByParam(row.overload_7, row.target_param, data);
    }

    if (Array.isArray(row.overload_9) && row.overload_9.length > 0) {
      row.overload_9 = sortCardsByParam(row.overload_9, row.target_param, data);
    }

    // 对overdrive列进行排序：根据对应行的target_param_2数值
    if (Array.isArray(row.overdrive_4) && row.overdrive_4.length > 0) {
      row.overdrive_4 = sortCardsByParam(row.overdrive_4, row.target_param_2, data);
    }

    if (Array.isArray(row.overdrive_6) && row.overdrive_6.length > 0) {
      row.overdrive_6 = sortCardsByParam(row.overdrive_6, row.target_param_2, data);
    }

    if (Array.isArray(row.overdrive_7) && row.overdrive_7.length > 0) {
      row.overdrive_7 = sortCardsByParam(row.overdrive_7, row.target_param_2, data);
    }

    if (Array.isArray(row.overdrive_9) && row.overdrive_9.length > 0) {
      row.overdrive_9 = sortCardsByParam(row.overdrive_9, row.target_param_2, data);
    }

    // 对act列进行排序：根据对应行的target_param数值
    if (Array.isArray(row.act) && row.act.length > 0) {
      row.act = sortCardsByParam(row.act, row.target_param, data);
    }

    // 对combo列进行排序：根据对应行的target_param_2数值
    if (Array.isArray(row.combo) && row.combo.length > 0) {
      row.combo = sortCardsByParam(row.combo, row.target_param_2, data);
    }
  });

  return result;
};

// Resonance表格数据
const tableDataResonance = ref<TableResonanceRow[]>(
  initializeDataResonance(CgssCardSkillTable as CgssCardSkillTableItem[]),
);

// Dominant表格数据
const tableDataDominant = ref<TableResonanceRow[]>(
  initializeDataDominant(CgssCardSkillTable as CgssCardSkillTableItem[]),
);

// 使用计算属性过滤dominant表中dominant列为空的行
// 修改dominant表的数据源，使用计算属性过滤空行
const filteredTableDataDominant = computed(() => {
  return tableDataDominant.value.filter(
    (row) => Array.isArray(row.dominant) && row.dominant.length > 0,
  );
});

// 处理图片点击事件
const handleIconClick = (row: TableResonanceRow, colKey: string, index: number) => {
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
  // 验证图片对象是否有效
  if (!icon || typeof icon.cid === 'undefined') {
    console.warn('Invalid icon object');
    return;
  }

  // 如果两个开关都关闭，则不执行任何操作
  if (!switchToggleCardStatus.value && !switchViewCardInfo.value) {
    return;
  }

  // 如果只开启查看卡片信息开关
  if (switchViewCardInfo.value) {
    if (icon.link) {
      // 提取链接中的数字并减1
      const modifiedLink = icon.link.replace(/c_(\d+)_/, (match, num) => {
        const newNum = parseInt(num) - 1;
        return `c_${newNum}_`;
      });
      window.open('https://starlight.346lab.org' + modifiedLink, '_blank');
    } else {
      console.warn(`No link found for card with cid: ${icon.cid}`);
    }
    return;
  }

  // 否则，判断是否开启切换卡片状态开关
  else if (switchToggleCardStatus.value) {
    const targetName = icon.title;
    const newState = !icon.isBrightness;

    // 更新所有名称相同的图片的状态 - resonance表
    tableDataResonance.value.forEach((dataRow) => {
      Object.keys(dataRow).forEach((colKey) => {
        const colValue = dataRow[colKey];
        // 验证列值是否为数组
        if (Array.isArray(colValue)) {
          colValue.forEach((img) => {
            // 验证图片对象是否有效
            if (img && img.title === targetName) {
              img.isBrightness = newState;
            }
          });
        }
      });
    });

    // 更新所有名称相同的图片的状态 - dominant表
    tableDataDominant.value.forEach((dataRow) => {
      Object.keys(dataRow).forEach((colKey) => {
        const colValue = dataRow[colKey];
        // 验证列值是否为数组
        if (Array.isArray(colValue)) {
          colValue.forEach((img) => {
            // 验证图片对象是否有效
            if (img && img.title === targetName) {
              img.isBrightness = newState;
            }
          });
        }
      });
    });
    return;
  }
};

// 添加一个函数来判断参数是否需要加粗
const isDominantParamBold = (
  headerItem: (typeof tableDominantColumnHeader)[number],
  row: TableResonanceRow,
  param: string,
) => {
  // 如果是dominant列，需要检查target_param或target_param_2
  if (headerItem.skill === 'dominant') {
    return row.target_param === param || row.target_param_2 === param;
  }

  // 如果是alternate或者overload列，需要检查target_param
  if (
    headerItem.skill === 'alternate' ||
    headerItem.skill === 'overload' ||
    headerItem.skill.startsWith('psb_')
  ) {
    return row.target_param === param;
  }

  // 如果是mutual或者overdrive列，需要检查target_param_2
  if (
    headerItem.skill === 'mutual' ||
    headerItem.skill === 'overdrive' ||
    headerItem.skill.startsWith('cboost')
  ) {
    return row.target_param_2 === param;
  }

  return false;
};

const isNameMatched = (title: string | undefined, filter: string) => {
  // 未启用名称过滤时，返回true
  if (!switchNameFilter.value) return true;

  if (!title || !filter) return true;

  // 将过滤器按空格、换行、半角逗号或全角顿号分割，并移除空字符串
  const names = filter.split(/[ ,、\n]+/).filter((name) => name.trim() !== '');

  // 如果没有名称，则返回true
  if (names.length === 0) return true;

  // 检查标题是否包含任何一个名称（不区分大小写）
  return names.some((name) => title.toLowerCase().includes(name.toLowerCase().trim()));
};

// 切换所有图片的亮度
const toggleAllImagesBrightness = () => {
  allImagesBright.value = !allImagesBright.value;
  tableDataResonance.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      // 验证列值是否为数组
      if (Array.isArray(colValue)) {
        colValue.forEach((img) => {
          // 验证图片对象是否有效
          if (img) {
            img.isBrightness = allImagesBright.value;
          }
        });
      }
    });
  });

  tableDataDominant.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      // 验证列值是否为数组
      if (Array.isArray(colValue)) {
        colValue.forEach((img) => {
          // 验证图片对象是否有效
          if (img) {
            img.isBrightness = allImagesBright.value;
          }
        });
      }
    });
  });
};

// 根据CID列表更新卡片亮度状态的辅助函数
const updateCardBrightnessByCids = (disabledCids: string[]) => {
  // 更新所有表格中的卡片状态
  tableDataResonance.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      if (Array.isArray(colValue)) {
        colValue.forEach((img) => {
          if (img) {
            if (disabledCids.includes(img.cid)) {
              img.isBrightness = false; // 在disabled列表中的卡片设为暗
            } else {
              img.isBrightness = true; // 不在disabled列表中的卡片设为亮
            }
          }
        });
      }
    });
  });

  tableDataDominant.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      if (Array.isArray(colValue)) {
        colValue.forEach((img) => {
          if (img) {
            if (disabledCids.includes(img.cid)) {
              img.isBrightness = false; // 在disabled列表中的卡片设为暗
            } else {
              img.isBrightness = true; // 不在disabled列表中的卡片设为亮
            }
          }
        });
      }
    });
  });
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/im/im-cgss-icons.css';

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

  .config-name-filter {
    &,
    & * {
      font-family: var(--al-font-family-jp);
    }

    :deep() {
      input::placeholder,
      textarea::placeholder {
        font-family: var(--al-font-family);
      }
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

  .table-icons-resonance {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }

  .table-icons-container {
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

  .icon-small {
    scale: 0.75;
    margin: -6px;

    &.icon-filter-match {
      scale: 1;
      margin: 0;
    }

    &.icon-filter-not-match {
      scale: 0.375;
      margin: -12px;
    }
  }

  .cgss-icon.dark {
    filter: brightness(0.4);
  }

  html.dark .cgss-icon.dark {
    filter: brightness(0.25);
  }
}
</style>
