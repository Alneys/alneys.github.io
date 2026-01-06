<template>
  <div class="unit-viewer">
    <h1 class="view-title">偶像大师灰姑娘女孩星光舞台 组队信息</h1>
    <div class="al-divider"></div>
    <div class="unit-mode-switch">
      <el-switch v-model="modeSwitch" active-text="切换图片状态" inactive-text="查看卡片信息" />
    </div>
    <div class="al-divider"></div>
    <div class="unit-title" id="unit-resonance">Resonance</div>
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
          :fixed="!isMobile ? 'left' : undefined"
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
        <el-table-column prop="tw" label="间隔" :width="64" :fixed="!isMobile ? 'left' : undefined">
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
          :prop="tableResonanceColumnHeader[colIndex - 1].value"
          :label="`${tableResonanceColumnHeader[colIndex - 1].label}`"
        >
          <template #default="scope">
            <div class="table-icons-container">
              <div
                v-for="(img, imgIndex) in scope.row[tableResonanceColumnHeader[colIndex - 1].value]"
                :key="imgIndex"
                :title="img.title ?? ''"
                :class="{
                  icon: true,
                  [`icon_${img.cid}`]: true,
                  dark: !img.isBrightness,
                }"
                @click="
                  handleImageClick(
                    scope.row,
                    tableResonanceColumnHeader[colIndex - 1].value,
                    Number(imgIndex),
                  )
                "
              ></div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="al-divider"></div>
    <div class="unit-title" id="unit-dominant">Dominant</div>
    <div v-if="env.DEV" class="unit-table">
      <el-table :data="filteredTableDataDominant" border style="width: 100%">
        <!-- 第一列：target_attribute_2 -->
        <el-table-column
          prop="target_attribute_2"
          label="属性2"
          :width="96"
          sortable
          :sort-orders="['descending', 'ascending']"
          :sort-method="sortDominantAttribute2"
        >
          <template #default="scope">
            <span :class="`table-row-info color-cg-${scope.row.target_attribute_2}`">{{
              scope.row.target_attribute_2 || ''
            }}</span>
          </template>
        </el-table-column>

        <!-- 第二列：target_attribute -->
        <el-table-column
          prop="target_attribute"
          label="属性1"
          :width="96"
          sortable
          :sort-orders="['ascending', 'descending']"
          :sort-method="sortDominantAttribute"
        >
          <template #default="scope">
            <span :class="`table-row-info color-cg-${scope.row.target_attribute}`">{{
              scope.row.target_attribute || ''
            }}</span>
          </template>
        </el-table-column>

        <!-- 第三列：target_param_2 -->
        <el-table-column
          prop="target_param_2"
          label="参数2"
          :width="96"
          sortable
          :sort-orders="['ascending', 'descending']"
          :sort-method="sortDominantParam2"
        >
          <template #default="scope">
            <span :class="`table-row-info color-cg-${scope.row.target_param_2}`">{{
              scope.row.target_param_2 || ''
            }}</span>
          </template>
        </el-table-column>

        <!-- 第四列：target_param -->
        <el-table-column
          prop="target_param"
          label="参数1"
          :width="96"
          sortable
          :sort-orders="['ascending', 'descending']"
          :sort-method="sortDominantParam"
        >
          <template #default="scope">
            <span :class="`table-row-info color-cg-${scope.row.target_param}`">{{
              scope.row.target_param || ''
            }}</span>
          </template>
        </el-table-column>

        <!-- 第五列：tw -->
        <el-table-column prop="tw" label="间隔" :width="64">
          <template #default="scope">
            <span style="font-weight: bold">{{ scope.row.tw || '' }}</span>
          </template>
        </el-table-column>

        <!-- 后续列：根据tableDominantColumnHeader动态生成 -->
        <el-table-column
          v-for="colIndex in tableDominantColumnHeader.length"
          :key="colIndex"
          :prop="tableDominantColumnHeader[colIndex - 1].value"
          :label="`${tableDominantColumnHeader[colIndex - 1].label}`"
        >
          <template #default="scope">
            <div class="table-icons-container">
              <div
                v-for="(img, imgIndex) in scope.row[tableDominantColumnHeader[colIndex - 1].value]"
                :key="imgIndex"
                :title="img.title ?? ''"
                :class="{
                  icon: true,
                  [`icon_${img.cid}`]: true,
                  dark: !img.isBrightness,
                }"
                @click="
                  handleImageClick(
                    scope.row,
                    tableDominantColumnHeader[colIndex - 1].value,
                    Number(imgIndex),
                  )
                "
              ></div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else>
      <p>开发中……</p>
    </div>
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
  { value: 'motif', label: '共鸣 resonance motif' },
  { value: 'synergy', label: '大偏 synergy' },
  { value: 'symphony', label: '交响 symphony' },
  { value: 'spike', label: '尖峰 spike' },
  { value: 'refrain', label: '复读 refrain' },
];

// Dominant table
const tableDominantRowHeaderAttribute = ['cute', 'cool', 'passion'];
const tableDominantRowHeaderSpecialize = tableResonanceRowHeaderSpecialize;
const tableDominantRowHeaderTw = ['6', '9', '11', '13'];

const tableDominantColumnHeader = [
  { value: 'dominant', label: '双色 dominant' },
  {
    value: 'alternate',
    label: '变换 alternate',
    attribute: 'target_attribute',
    param: 'target_param',
  },
  {
    value: 'mutual',
    label: '交互 mutual',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
  },
];

// Cell item
interface CellItem {
  cid: string;
  name: string;
  title?: string;
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

// 点击图片模式切换
const modeSwitch = ref(true);

// 响应式属性用于判断是否为移动端
const isMobile = ref(window.innerWidth < 768);

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
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

// 添加排序方法
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

// 添加Dominant表排序方法
const sortDominantAttribute = (a: TableResonanceRow, b: TableResonanceRow) => {
  const order = tableDominantRowHeaderAttribute;
  const indexA = order.indexOf(a.target_attribute || '');
  const indexB = order.indexOf(b.target_attribute || '');

  // 如果值在预定义顺序中，则按预定义顺序排序
  if (indexA !== -1 && indexB !== -1) {
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    // 如果target_attribute相同，按行号排序
    return a.row - b.row;
  }

  // 如果其中一个值不在预定义顺序中，则将预定义顺序中的值排在前面
  if (indexA !== -1) {
    return -1;
  }
  if (indexB !== -1) {
    return 1;
  }

  // 如果都不在预定义顺序中，则按字母顺序排序
  if (a.target_attribute && b.target_attribute) {
    const compareResult = a.target_attribute.localeCompare(b.target_attribute);
    if (compareResult !== 0) {
      return compareResult;
    }
    // 如果target_attribute相同，按行号排序
    return a.row - b.row;
  }
  // 如果target_attribute都为空，按行号排序
  return a.row - b.row;
};

const sortDominantAttribute2 = (a: TableResonanceRow, b: TableResonanceRow) => {
  const order = tableDominantRowHeaderAttribute;
  const indexA = order.indexOf(a.target_attribute_2 || '');
  const indexB = order.indexOf(b.target_attribute_2 || '');

  // 如果值在预定义顺序中，则按预定义顺序排序
  if (indexA !== -1 && indexB !== -1) {
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    // 如果target_attribute_2相同，按行号排序
    return a.row - b.row;
  }

  // 如果其中一个值不在预定义顺序中，则将预定义顺序中的值排在前面
  if (indexA !== -1) {
    return -1;
  }
  if (indexB !== -1) {
    return 1;
  }

  // 如果都不在预定义顺序中，则按字母顺序排序
  if (a.target_attribute_2 && b.target_attribute_2) {
    const compareResult = a.target_attribute_2.localeCompare(b.target_attribute_2);
    if (compareResult !== 0) {
      return compareResult;
    }
    // 如果target_attribute_2相同，按行号排序
    return a.row - b.row;
  }
  // 如果target_attribute_2都为空，按行号排序
  return a.row - b.row;
};

const sortDominantParam = (a: TableResonanceRow, b: TableResonanceRow) => {
  const order = tableDominantRowHeaderSpecialize;
  const indexA = order.indexOf(a.target_param || '');
  const indexB = order.indexOf(b.target_param || '');

  // 如果值在预定义顺序中，则按预定义顺序排序
  if (indexA !== -1 && indexB !== -1) {
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    // 如果target_param相同，按行号排序
    return a.row - b.row;
  }

  // 如果其中一个值不在预定义顺序中，则将预定义顺序中的值排在前面
  if (indexA !== -1) {
    return -1;
  }
  if (indexB !== -1) {
    return 1;
  }

  // 如果都不在预定义顺序中，则按字母顺序排序
  if (a.target_param && b.target_param) {
    const compareResult = a.target_param.localeCompare(b.target_param);
    if (compareResult !== 0) {
      return compareResult;
    }
    // 如果target_param相同，按行号排序
    return a.row - b.row;
  }
  // 如果target_param都为空，按行号排序
  return a.row - b.row;
};

const sortDominantParam2 = (a: TableResonanceRow, b: TableResonanceRow) => {
  const order = tableDominantRowHeaderSpecialize;
  const indexA = order.indexOf(a.target_param_2 || '');
  const indexB = order.indexOf(b.target_param_2 || '');

  // 如果值在预定义顺序中，则按预定义顺序排序
  if (indexA !== -1 && indexB !== -1) {
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    // 如果target_param_2相同，按行号排序
    return a.row - b.row;
  }

  // 如果其中一个值不在预定义顺序中，则将预定义顺序中的值排在前面
  if (indexA !== -1) {
    return -1;
  }
  if (indexB !== -1) {
    return 1;
  }

  // 如果都不在预定义顺序中，则按字母顺序排序
  if (a.target_param_2 && b.target_param_2) {
    const compareResult = a.target_param_2.localeCompare(b.target_param_2);
    if (compareResult !== 0) {
      return compareResult;
    }
    // 如果target_param_2相同，按行号排序
    return a.row - b.row;
  }
  // 如果target_param_2都为空，按行号排序
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
    const columnInfo = tableResonanceColumnHeader.find((col) => col.value === item.skill.type);
    if (!columnInfo) {
      // 如果type不在预定义范围内，跳过该数据
      return;
    }
    let colName = columnInfo.value;

    // 将数据添加到对应单元格
    if (Array.isArray(result[rowIndex][colName])) {
      result[rowIndex][colName].push({
        cid: item.cid,
        name: item.name,
        title: `${item.title} ${item.name}`,
        link: item.link,
        isBrightness: true,
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
            title: `${item.title} ${item.name}`,
            link: item.link,
            isBrightness: true,
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
            title: `${item.title} ${item.name}`,
            link: item.link,
            isBrightness: true,
          });
        }
      });
    }

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

      // 根据技能类型确定插入到哪个列
      let targetColumn = '';
      if (item.leaderSkill.description.includes('dominant')) {
        targetColumn = 'dominant';
      } else {
        // 默认插入到dominant列，以保持原有功能
        targetColumn = 'dominant';
      }

      // 将数据添加到对应单元格
      if (
        result[rowIndex] &&
        result[rowIndex][targetColumn] &&
        Array.isArray(result[rowIndex][targetColumn])
      ) {
        // typescript bug
        (result[rowIndex][targetColumn] as CellItem[]).push({
          cid: item.cid,
          name: item.name,
          title: `${item.title} ${item.name}`,
          link: item.link,
          isBrightness: true,
        });
      } else {
        console.warn(
          `Target column ${targetColumn} not found or not an array at rowIndex ${rowIndex}`,
        );
      }
    }
  });

  // 对alternate和mutual列的数据按照目标param的数值从大到小排序
  result.forEach((row) => {
    // 对alternate列进行排序：根据对应行的target_param数值
    if (Array.isArray(row.alternate) && row.alternate.length > 0) {
      row.alternate.sort((a, b) => {
        // 找到a卡片的数值
        const cardA = data.find(item => item.cid === a.cid);
        // 找到b卡片的数值
        const cardB = data.find(item => item.cid === b.cid);
        
        if (!cardA || !cardB) return 0;
        
        // 根据target_param获取对应数值，例如如果target_param是'vocal'，则获取cardA.stats.vocal
        const aValue = cardA.stats[row.target_param as keyof CgssCardSkillTableItem['stats']] || 0;
        const bValue = cardB.stats[row.target_param as keyof CgssCardSkillTableItem['stats']] || 0;
        
        // 从大到小排序
        return bValue - aValue;
      });
    }

    // 对mutual列进行排序：根据对应行的target_param_2数值
    if (Array.isArray(row.mutual) && row.mutual.length > 0) {
      row.mutual.sort((a, b) => {
        // 找到a卡片的数值
        const cardA = data.find(item => item.cid === a.cid);
        // 找到b卡片的数值
        const cardB = data.find(item => item.cid === b.cid);
        
        if (!cardA || !cardB) return 0;
        
        // 根据target_param_2获取对应数值，例如如果target_param_2是'dance'，则获取cardA.stats.dance
        const aValue = cardA.stats[row.target_param_2 as keyof CgssCardSkillTableItem['stats']] || 0;
        const bValue = cardB.stats[row.target_param_2 as keyof CgssCardSkillTableItem['stats']] || 0;
        
        // 从大到小排序
        return bValue - aValue;
      });
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
const handleImageClick = (row: TableResonanceRow, colKey: string, index: number) => {
  // 验证输入参数
  if (!row || !colKey || index < 0) {
    console.warn('Invalid parameters for handleImageClick');
    return;
  }

  // 验证列数据是否为数组
  const colData = row[colKey];
  if (!Array.isArray(colData) || index >= colData.length) {
    console.warn('Invalid column data or index out of bounds');
    return;
  }

  const image = colData[index];
  // 验证图片对象是否有效
  if (!image || typeof image.cid === 'undefined') {
    console.warn('Invalid image object');
    return;
  }

  if (!modeSwitch.value) {
    // modeSwitch为false时，在新标签页打开链接
    if (image.link) {
      // 提取链接中的数字并减1
      const modifiedLink = image.link.replace(/c_(\d+)_/, (match, num) => {
        const newNum = parseInt(num) - 1;
        return `c_${newNum}_`;
      });
      window.open('https://starlight.346lab.org' + modifiedLink, '_blank');
    } else {
      console.warn(`No link found for card with cid: ${image.cid}`);
    }
  } else {
    // modeSwitch为true时，执行切换图片状态的操作
    const targetName = image.title;
    const newState = !image.isBrightness;

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
  }
};
</script>

<style lang="scss" scoped>
// @import '@/assets/styles/im/346lab/icons.css';
@import '@/assets/styles/im/346lab/icons@2x.css';

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

.el-link {
  vertical-align: inherit;
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

  .icon {
    --target-width: 48px;

    display: inline-block;
    width: 48px;
    height: 48px;
    border-radius: 4px;
    cursor: pointer; // 添加光标效果提示可点击

    scale: calc(var(--target-width) / 48px);
    margin: calc((var(--target-width) - 48px) / 2);
  }

  .icon.dark {
    filter: brightness(0.4);
  }

  html.dark .icon.dark {
    filter: brightness(0.25);
  }
}

.unit-mode-switch {
  margin-bottom: 1em;
}

.unit-table {
  padding: 1em 0;
}
</style>
