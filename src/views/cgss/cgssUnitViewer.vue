<template>
  <div class="cgss-unit-viewer">
    <h1 class="view-title">偶像大师灰姑娘女孩星光舞台 组队信息</h1>
    <div class="al-divider"></div>
    <div class="unit-viewer-config">
      <div>
        <el-switch v-model="switchNameFilter" active-text="筛选名字" />
      </div>
      <div v-if="switchNameFilter" style="margin-bottom: 1em">
        <el-input
          v-model="inputNameFilter"
          placeholder="请输入名字，分割符号可以使用空格，换行，半角逗号或者全角顿号里面的任何符号，名字里面请不要输入空格"
          type="textarea"
          :rows="5"
          clearable
        ></el-input>
      </div>
      <div>
        <el-switch v-model="switchToggleCardStatus" active-text="点击图标后切换亮度" />
      </div>
      <div v-if="switchToggleCardStatus">
        <div>
          <el-button @click="toggleAllImagesBrightness" type="primary" size="default">
            切换所有状态
          </el-button>
        </div>
        <div>
          <el-button @click="exportCids" type="success" size="default"> 导出当前状态 </el-button>
        </div>
        <div>
          <el-button @click="importCids" type="warning" size="default"> 导入当前状态 </el-button>
        </div>
      </div>
      <div>
        <el-switch v-model="switchViewCardInfo" active-text="点击图标后在346lab查看卡片详情" />
      </div>
    </div>

    <div class="al-divider"></div>
    <div class="unit-title" id="unit-resonance" style="font-weight: bold">共鸣 Resonance</div>
    <div class="unit-table">
      <el-table
        :data="tableDataResonance"
        style="width: 100%"
        border
        :span-method="tableResonanceSpanMethod"
      >
        <!-- 第一列：属性 -->
        <el-table-column
          prop="specialize"
          label="属性"
          :width="80"
          :fixed="!isSmallScreen ? 'left' : undefined"
          sortable
          :sort-orders="['descending', 'ascending']"
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
          :fixed="!isSmallScreen ? 'left' : undefined"
        >
          <template #default="scope">
            <span style="font-weight: bold">
              {{ scope.row.tw }}
            </span>
          </template>
        </el-table-column>
        <!-- 后续列：根据tableResonanceColumnHeader动态生成 -->
        <el-table-column
          v-for="colIndex in tableResonanceColumnHeader.length"
          :key="colIndex"
          :prop="tableResonanceColumnHeader[colIndex - 1].prop"
          :label="`${tableResonanceColumnHeader[colIndex - 1].label}`"
          :class-name="`icons skill-${tableResonanceColumnHeader[colIndex - 1].prop}`"
        >
          <template #default="scope">
            <div class="table-icons-container">
              <el-tooltip
                v-for="(img, imgIndex) in scope.row[tableResonanceColumnHeader[colIndex - 1].prop]"
                :key="imgIndex"
                placement="top"
                :show-after="500"
              >
                <template #content>
                  <div style="font-size: 14px">
                    <span v-if="img.title">{{ img.title }}</span>
                    <br />
                    <span
                      v-if="img.attribute"
                      :class="`color-cg-${img.attribute.toLowerCase()} is-bold`"
                    >
                      {{ img.attribute }}</span
                    >
                    <br />
                    <span
                      :class="`color-cg-vocal ${scope.row.specialize === 'vocal' ? 'is-bold is-underline' : ''}`"
                    >
                      {{ img.vocal || 0 }}</span
                    >
                    &nbsp;
                    <span
                      :class="`color-cg-dance ${scope.row.specialize === 'dance' ? 'is-bold is-underline' : ''}`"
                    >
                      {{ img.dance || 0 }}</span
                    >
                    &nbsp;
                    <span
                      :class="`color-cg-visual ${scope.row.specialize === 'visual' ? 'is-bold is-underline' : ''}`"
                    >
                      {{ img.visual || 0 }}</span
                    >
                  </div>
                </template>
                <div
                  :class="{
                    'cgss-icon': true,
                    [`id_${img.cid}`]: true,
                    dark: !img.isBrightness && switchToggleCardStatus,
                    'icon-small': !isNameMatched(img.title, inputNameFilter),
                  }"
                  @click="
                    handleIconClick(
                      scope.row,
                      tableResonanceColumnHeader[colIndex - 1].prop,
                      Number(imgIndex),
                    )
                  "
                ></div>
              </el-tooltip>
              <div v-if="scope.row[tableResonanceColumnHeader[colIndex - 1].prop].length === 0">
                x
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="al-divider"></div>
    <div class="unit-title" id="unit-dominant" style="font-weight: bold">双色 Dominant</div>
    <div class="unit-table">
      <el-table
        :data="filteredTableDataDominant"
        border
        style="width: 100%"
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
          :sort-method="sortDominantTw"
        >
          <template #default="scope">
            <span style="font-weight: bold">{{ scope.row.tw || '' }}</span>
          </template>
        </el-table-column>

        <!-- 后续列：根据tableDominantColumnHeader动态生成 -->
        <el-table-column
          v-for="colIndex in tableDominantColumnHeader.length"
          :key="colIndex"
          :prop="tableDominantColumnHeader[colIndex - 1].prop"
          :label="`${tableDominantColumnHeader[colIndex - 1].label}`"
          :class-name="`icons skill-${tableDominantColumnHeader[colIndex - 1].skill ?? tableDominantColumnHeader[colIndex - 1].prop}`"
          :min-width="
            isSmallScreen
              ? tableDominantColumnHeader[colIndex - 1].minWidthSmallScreen
              : tableDominantColumnHeader[colIndex - 1].minWidth
          "
        >
          <template #default="scope">
            <div class="table-icons-container">
              <el-tooltip
                v-for="(img, imgIndex) in scope.row[tableDominantColumnHeader[colIndex - 1].prop]"
                :key="imgIndex"
                placement="top"
                :show-after="500"
              >
                <template #content>
                  <div style="font-size: 14px">
                    <span v-if="img.title">{{ img.title }}</span>
                    <br />
                    <span
                      v-if="img.attribute"
                      :class="`color-cg-${img.attribute.toLowerCase()} is-bold`"
                    >
                      {{ img.attribute }}</span
                    >
                    <br />
                    <span
                      :class="`color-cg-vocal ${isParamBold(colIndex - 1, scope.row, 'vocal') ? 'is-bold is-underline' : ''}`"
                    >
                      {{ img.vocal || 0 }}</span
                    >
                    &nbsp;
                    <span
                      :class="`color-cg-dance ${isParamBold(colIndex - 1, scope.row, 'dance') ? 'is-bold is-underline' : ''}`"
                    >
                      {{ img.dance || 0 }}</span
                    >
                    &nbsp;
                    <span
                      :class="`color-cg-visual ${isParamBold(colIndex - 1, scope.row, 'visual') ? 'is-bold is-underline' : ''}`"
                    >
                      {{ img.visual || 0 }}</span
                    >
                  </div>
                </template>
                <div
                  :class="{
                    'cgss-icon': true,
                    [`id_${img.cid}`]: true,
                    dark: !img.isBrightness && switchToggleCardStatus,
                    'icon-small': !isNameMatched(img.title, inputNameFilter),
                  }"
                  @click="
                    handleIconClick(
                      scope.row,
                      tableDominantColumnHeader[colIndex - 1].prop,
                      Number(imgIndex),
                    )
                  "
                ></div>
              </el-tooltip>
              <div v-if="scope.row[tableDominantColumnHeader[colIndex - 1].prop].length === 0">
                x
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- <div>
      <p>更多组队信息开发中……</p>
    </div> -->
    <div class="al-divider"></div>
    <div class="unit-information">
      <p>
        特别感谢：<el-link href="https://starlight.346lab.org" target="_blank"
          >https://starlight.346lab.org</el-link
        >
      </p>
      <p>
        Special Thanks to:
        <el-link href="https://starlight.kirara.ca" target="_blank"
          >https://starlight.kirara.ca</el-link
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue';
import CgssCardSkillTable from './cgss_extracted_card_skill_table_ssr.json';

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
      ef: number;
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
const tableResonanceRowHeaderSpecialize = ['vocal', 'dance', 'visual'];
const tableResonanceRowHeaderTw = ['7', '9', '11'];
const tableResonanceColumnHeader = [
  { prop: 'motif', label: '共鸣 resonance motif', skill: 'motif' },
  { prop: 'synergy', label: '大偏 synergy', skill: 'synergy' },
  { prop: 'symphony', label: '交响 symphony', skill: 'symphony' },
  { prop: 'spike', label: '尖峰 spike', skill: 'spike' },
  { prop: 'refrain', label: '复读 refrain', skill: 'refrain' },
];

// Dominant table
const tableDominantRowHeaderAttribute = ['cute', 'cool', 'passion'];
const tableDominantRowHeaderSpecialize = tableResonanceRowHeaderSpecialize;
const tableDominantRowHeaderTw = ['6', '9', '11', '13'];

const tableDominantColumnHeader = [
  { prop: 'dominant', label: '双色 dominant', skill: 'dominant', minWidth: 64 },
  {
    prop: 'alternate',
    label: '变换 alternate',
    skill: 'alternate',
    attribute: 'target_attribute',
    param: 'target_param',
    minWidth: 108,
    minWidthSmallScreen: 108,
  },
  {
    prop: 'mutual',
    label: '交互 mutual',
    skill: 'mutual',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    minWidth: 160,
    minWidthSmallScreen: 108,
  },
  {
    prop: 'overload_4',
    label: '过载 overload 4s',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '4',
  },
  {
    prop: 'overdrive_4',
    label: '超载 overdrive 4s',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '4',
  },
  {
    prop: 'overload_6',
    label: '过载 overload 6s',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '6',
  },
  {
    prop: 'overdrive_6',
    label: '超载 overdrive 6s',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '6',
  },
  {
    prop: 'overload_7',
    label: '过载 overload 7s',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '7',
  },
  {
    prop: 'overdrive_7',
    label: '超载 overdrive 7s',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '7',
  },
  {
    prop: 'overload_9',
    label: '过载 overload 9s',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '9',
  },
  {
    prop: 'overdrive_9',
    label: '超载 overdrive 9s',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '9',
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
const inputNameFilter =
  ref(`水本ゆかり、椎名法子、間中美里、五十嵐響子、柳瀬美由紀、長富蓮実、横山千佳、太田優、前川みく、宮本フレデリカ、井村雪菜、工藤忍、佐久間まゆ、乙倉悠貴、原田美世、池袋晶葉

黒川千秋、桐野アヤ、川島瑞樹、水木聖來、藤原肇、新田美波、高垣楓、伊集院惠、柊志乃、瀬名詩織、佐城雪美、和久井留美、塩見周子、速水奏、大石泉、森久保乃々

高森藍子、並木芽衣子、赤城みりあ、真鍋いつき、大槻唯、海老原菜帆、衛藤美紗希、浜川愛結奈、諸星きらり、喜多日菜子、三好紗南、土屋亜子、南条光、イヴ・サンタクロース、夢見りあむ、久川凪`);
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
const isSmallScreen = ref(window.innerWidth < 1512);

// 监听窗口大小变化
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 1512;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 合并单元格
const tableResonanceSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
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

const sortDominantTw = (a: TableResonanceRow, b: TableResonanceRow) => {
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

// 初始化Resonance表格数据
const initializeDataResonance = (data: CgssCardSkillTableItem[]): TableResonanceRow[] => {
  // 创建表格数据结构
  const result: TableResonanceRow[] = [];

  // 为每个specialize和tw的组合创建数据行
  tableResonanceRowHeaderSpecialize.forEach((specialize) => {
    tableResonanceRowHeaderTw.forEach((tw) => {
      result.push({
        specialize: specialize, // 添加属性信息
        tw: tw + 's', // 添加间隔信息
        row: result.length, // 添加行号
        motif: [],
        synergy: [],
        symphony: [],
        spike: [],
        refrain: [],
      });
    });
  });

  // 遍历技能表数据，根据specialize和skill.tw分配到对应的单元格
  data.forEach((item: CgssCardSkillTableItem) => {
    // 检查稀有度，如果不是SSR则直接返回，不执行后续操作
    if (item.rarity !== 'ssr') {
      return;
    }

    // 根据specialize确定行的前半部分索引
    const specializeIndex = tableResonanceRowHeaderSpecialize.indexOf(item.specialize);
    if (specializeIndex === -1) {
      // 如果specialize不在预定义范围内，跳过该数据
      return;
    }

    // 根据skill.tw确定行索引
    const twIndex = tableResonanceRowHeaderTw.indexOf(String(item.skill.params.tw));
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
    if (Array.isArray(result[rowIndex][colName])) {
      result[rowIndex][colName].push({
        cid: item.cid,
        name: item.name,
        title: `[${item.title}] ${item.name}`,
        link: item.link,
        isBrightness: true,
        attribute: item.attribute,
        vocal: item.stats.vocal,
        visual: item.stats.visual,
        dance: item.stats.dance,
      });
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
                // 为每种组合创建一行数据
                result.push({
                  target_attribute_2: attr2, // 第一列: target_attribute_2
                  target_attribute: attr, // 第二列: target_attribute
                  tw: tw + 's', // 第三列: tw
                  target_param_2: param2, // 第四列: target_param_2
                  target_param: param, // 第五列: target_param
                  row: result.length, // 添加行号
                  dominant: [], // 主要效果列
                  alternate: [], // 变换效果列
                  mutual: [], // 交互效果列
                  overload_4: [], // 过载效果列
                  overload_6: [], // 过载效果列
                  overload_7: [], // 过载效果列
                  overload_9: [], // 过载效果列
                  overdrive_4: [], // 超载效果列
                  overdrive_6: [], // 超载效果列
                  overdrive_7: [], // 超载效果列
                  overdrive_9: [], // 超载效果列
                });
              }
            });
          });
        });
      }
    });
  });

  // 遍历技能表数据，根据leaderSkill.params和skill.params分配到对应的单元格
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
          (result[rowIndex].dominant as CellItem[]).push({
            cid: item.cid,
            name: item.name,
            title: `[${item.title}] ${item.name}`,
            link: item.link,
            isBrightness: true,
            attribute: item.attribute,
            vocal: item.stats.vocal,
            visual: item.stats.visual,
            dance: item.stats.dance,
          });
        } else {
          console.warn(`Target column dominant not found or not an array at rowIndex ${rowIndex}`);
        }
      }
    }

    // 处理 alternate 和 mutual 类型的技能
    if (item.skill.type === 'alternate' || item.skill.type === 'mutual') {
      // 遍历结果数组，找到所有符合条件的行
      result.forEach((row, rowIndex) => {
        // 处理 alternate 类型：匹配 skill.type 是 alternate，attribute 与当前行 target_attribute 相同，
        // row.target_param 的值大于5000，且skill.tw与当前行tw相同
        if (
          item.skill.type === 'alternate' &&
          item.attribute.toLowerCase() === row.target_attribute &&
          row.target_param &&
          item.stats[row.target_param as keyof CgssCardSkillTableItem['stats']] > 5000 &&
          String(item.skill.params.tw) + 's' === row.tw
        ) {
          (result[rowIndex].alternate as CellItem[]).push({
            cid: item.cid,
            name: item.name,
            title: `[${item.title}] ${item.name}`,
            link: item.link,
            isBrightness: true,
            attribute: item.attribute,
            vocal: item.stats.vocal,
            visual: item.stats.visual,
            dance: item.stats.dance,
          });
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
          (result[rowIndex].mutual as CellItem[]).push({
            cid: item.cid,
            name: item.name,
            title: `[${item.title}] ${item.name}`,
            link: item.link,
            isBrightness: true,
            attribute: item.attribute,
            vocal: item.stats.vocal,
            visual: item.stats.visual,
            dance: item.stats.dance,
          });
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
                (result[rowIndex][colDef.prop] as CellItem[]).push({
                  cid: item.cid,
                  name: item.name,
                  title: `[${item.title}] ${item.name}`,
                  link: item.link,
                  isBrightness: true,
                  attribute: item.attribute,
                  vocal: item.stats.vocal,
                  visual: item.stats.visual,
                  dance: item.stats.dance,
                });
              }
              // overdrive: 匹配attribute与行的target_attribute_2相同，且stats[target_param_2]的值大于5000
              else if (
                item.skill.type === 'overdrive' &&
                item.attribute.toLowerCase() === row.target_attribute_2 &&
                row.target_param_2 &&
                item.stats[row.target_param_2 as keyof CgssCardSkillTableItem['stats']] > 5000
              ) {
                (result[rowIndex][colDef.prop] as CellItem[]).push({
                  cid: item.cid,
                  name: item.name,
                  title: `[${item.title}] ${item.name}`,
                  link: item.link,
                  isBrightness: true,
                  attribute: item.attribute,
                  vocal: item.stats.vocal,
                  visual: item.stats.visual,
                  dance: item.stats.dance,
                });
              }
            }
          }
        });
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
import { computed } from 'vue';

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
const isParamBold = (colIndex: number, row: TableResonanceRow, param: string) => {
  const columnHeader = tableDominantColumnHeader[colIndex];

  // 如果是dominant列，需要检查target_param或target_param_2
  if (columnHeader.skill === 'dominant') {
    return row.target_param === param || row.target_param_2 === param;
  }

  // 如果是alternate或者overload列，需要检查target_param
  if (columnHeader.skill === 'alternate' || columnHeader.skill === 'overload') {
    return row.target_param === param;
  }

  // 如果是mutual或者overdrive列，需要检查target_param_2
  if (columnHeader.skill === 'mutual' || columnHeader.skill === 'overdrive') {
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

// 导出卡片
const exportCids = async () => {
  try {
    // 收集所有点亮的卡片CID
    const brightCids: string[] = [];

    // 遍历Resonance表
    tableDataResonance.value.forEach((dataRow) => {
      Object.keys(dataRow).forEach((colKey) => {
        const colValue = dataRow[colKey];
        if (Array.isArray(colValue)) {
          colValue.forEach((img) => {
            if (img && img.isBrightness) {
              brightCids.push(img.cid);
            }
          });
        }
      });
    });

    // 遍历Dominant表
    tableDataDominant.value.forEach((dataRow) => {
      Object.keys(dataRow).forEach((colKey) => {
        const colValue = dataRow[colKey];
        if (Array.isArray(colValue)) {
          colValue.forEach((img) => {
            if (img && img.isBrightness) {
              brightCids.push(img.cid);
            }
          });
        }
      });
    });

    // 去重
    const uniqueCids = [...new Set(brightCids)];

    // 转换为JSON字符串
    const jsonStr = JSON.stringify(uniqueCids, null, 2);

    // 复制到剪贴板
    await navigator.clipboard.writeText(jsonStr);

    // 显示成功提示
    ElMessage.success('已导出到剪贴板！');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败，请重试');
  }
};

// 导入卡片
const importCids = async () => {
  try {
    // 从剪贴板读取数据
    const clipboardText = await navigator.clipboard.readText();

    // 解析JSON
    let importedCids: string[];
    try {
      importedCids = JSON.parse(clipboardText);

      // 验证是否为字符串数组
      if (!Array.isArray(importedCids) || !importedCids.every((item) => typeof item === 'string')) {
        throw new Error('剪贴板内容不是有效的字符串数组');
      }
    } catch (error) {
      ElMessage.error('剪贴板内容不是有效的JSON数组');
      return;
    }

    // 更新所有表格中的卡片状态
    tableDataResonance.value.forEach((dataRow) => {
      Object.keys(dataRow).forEach((colKey) => {
        const colValue = dataRow[colKey];
        if (Array.isArray(colValue)) {
          colValue.forEach((img) => {
            if (img && importedCids.includes(img.cid)) {
              img.isBrightness = true;
            } else {
              img.isBrightness = false;
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
            if (img && importedCids.includes(img.cid)) {
              img.isBrightness = true;
            } else {
              img.isBrightness = false;
            }
          });
        }
      });
    });

    // 更新allImagesBright状态
    allImagesBright.value = importedCids.length > 0;

    ElMessage.success('导入成功！');
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error('导入失败，请确保剪贴板中有有效的JSON数组');
  }
};
</script>

<style lang="scss" scoped>
// @import '@/assets/styles/im/346lab/icons.css';
@import '@/assets/styles/im/346lab/icons@2x.css';

.is-bold {
  font-weight: bold;
}

.is-underline {
  text-decoration: underline;
}

.color-cg-cute {
  color: var(--im-color-cg-cute);
}
.color-cg-cool {
  color: var(--im-color-cg-cool);
}
.color-cg-passion {
  color: var(--im-color-cg-passion);
}
.color-cg-vocal {
  color: var(--im-color-cg-vocal);
}
.color-cg-dance {
  color: var(--im-color-cg-dance);
}
.color-cg-visual {
  color: var(--im-color-cg-visual);
}

.el-table {
  --el-table-header-text-color: var(--el-text-color-regular);
}

:deep(.el-table) tbody .el-table__cell.icons .cell {
  padding: 0 4px;
}

:deep(.el-table) {
  .skill-motif,
  .skill-symphony,
  .skill-refrain,
  .skill-dominant,
  .skill-mutual,
  .skill-overdrive {
    background-color: hsl(0, 0%, 95%);
  }
}

.el-link {
  vertical-align: inherit;
}

.unit-viewer-config {
  margin-bottom: 1em;
  > div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0.5em 0;
  }
}

.unit-table {
  padding: 1em 0;
}

.el-table {
  .table-row-info {
    font-weight: bold;
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

  .icon-small {
    scale: 0.4;
    margin: 0;
  }

  .cgss-icon.dark {
    filter: brightness(0.4);
  }

  html.dark .cgss-icon.dark {
    filter: brightness(0.25);
  }
}
</style>
