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
        >
          <template #default="scope">
            <span
              :style="{
                fontWeight: 'bold',
                color: `var(--im-color-cg-${scope.row.specialize})`,
              }"
            >
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
            <div class="icons-container">
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
        <el-table-column prop="target_attribute_2" label="属性2" :width="96">
          <template #default="scope">
            <span
              :style="{
                fontWeight: 'bold',
                color: `var(--im-color-cg-${scope.row.target_attribute_2})`,
              }"
              >{{ scope.row.target_attribute_2 || '' }}</span
            >
          </template>
        </el-table-column>

        <!-- 第二列：target_attribute -->
        <el-table-column prop="target_attribute" label="属性1" :width="96">
          <template #default="scope">
            <span
              :style="{
                fontWeight: 'bold',
                color: `var(--im-color-cg-${scope.row.target_attribute})`,
              }"
              >{{ scope.row.target_attribute || '' }}</span
            >
          </template>
        </el-table-column>

        <!-- 第三列：target_param_2 -->
        <el-table-column prop="target_param_2" label="参数2" :width="96">
          <template #default="scope">
            <span
              :style="{
                fontWeight: 'bold',
                color: `var(--im-color-cg-${scope.row.target_param_2})`,
              }"
              >{{ scope.row.target_param_2 || '' }}</span
            >
          </template>
        </el-table-column>

        <!-- 第四列：target_param -->
        <el-table-column prop="target_param" label="参数1" :width="96">
          <template #default="scope">
            <span
              :style="{
                fontWeight: 'bold',
                color: `var(--im-color-cg-${scope.row.target_param})`,
              }"
              >{{ scope.row.target_param || '' }}</span
            >
          </template>
        </el-table-column>

        <!-- 第五列：tw -->
        <el-table-column prop="tw" label="间隔" :width="64">
          <template #default="scope">
            <span>{{ scope.row.tw || '' }}</span>
          </template>
        </el-table-column>

        <!-- 后续列：根据tableDominantColumnHeader动态生成 -->
        <el-table-column
          v-for="colIndex in 1"
          :key="colIndex"
          :prop="tableDominantColumnHeader[colIndex - 1].value"
          :label="`${tableDominantColumnHeader[colIndex - 1].label}`"
        >
          <template #default="scope">
            <div class="icons-container">
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

const tableDataDominantCount = Array.from(
  {
    length:
      tableDominantRowHeaderAttribute.length *
      (tableDominantRowHeaderAttribute.length - 1) *
      tableDominantRowHeaderTw.length,
  },
  () => 0,
);

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
  [key: string]: CellItem[] | string | undefined;
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
        tableDominantRowHeaderSpecialize.forEach((param2) => {
          // target_param_2: 3个
          tableDominantRowHeaderSpecialize.forEach((param) => {
            // target_param: 3个
            if (param !== param2) {
              // 确保param !== param2 (3*2 = 6种组合)
              tableDominantRowHeaderTw.forEach((tw) => {
                // tw: 4个
                // 为每种组合创建一行数据
                result.push({
                  target_attribute_2: attr2, // 第一列: target_attribute_2
                  target_attribute: attr, // 第二列: target_attribute
                  target_param_2: param2, // 第三列: target_param_2
                  target_param: param, // 第四列: target_param
                  tw: tw + 's', // 第五列: tw
                  dominant: [], // 主要效果列
                  alternate: [], // 变换效果列
                  mutual: [], // 交互效果列
                });
              });
            }
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

    // 检查是否有leaderSkill.params
    if (!item.leaderSkill.params) {
      return;
    }

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
    // 索引计算: ((attr2Index * 2 + (attrIndex > attr2Index ? attrIndex - 1 : attrIndex)) * 6 +
    //           (param2Index * 2 + (paramIndex > param2Index ? paramIndex - 1 : paramIndex))) * 4 + twIndex
    const attrCount = tableDominantRowHeaderAttribute.length; // 3
    const validAttrCombos = attrCount * (attrCount - 1); // 3 * 2 = 6
    const paramCount = tableDominantRowHeaderSpecialize.length; // 3
    const validParamCombos = paramCount * (paramCount - 1); // 3 * 2 = 6
    const twCount = tableDominantRowHeaderTw.length; // 4

    const attrComboIndex =
      attr2Index * (attrCount - 1) + (attrIndex > attr2Index ? attrIndex - 1 : attrIndex);
    const paramComboIndex =
      param2Index * (paramCount - 1) + (paramIndex > param2Index ? paramIndex - 1 : paramIndex);
    const rowIndex = (attrComboIndex * validParamCombos + paramComboIndex) * twCount + twIndex;

    // 根据技能类型确定插入到哪个列
    let targetColumn = '';
    if (item.leaderSkill.description.includes('dominant')) {
      targetColumn = 'dominant';
    } else if (item.leaderSkill.description.includes('alternate')) {
      targetColumn = 'alternate';
    } else if (item.leaderSkill.description.includes('mutual')) {
      targetColumn = 'mutual';
    } else {
      // 默认插入到dominant列
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
  return tableDataDominant.value.filter(row => 
    Array.isArray(row.dominant) && row.dominant.length > 0
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

.el-table {
  --el-table-header-text-color: var(--el-text-color-regular);
}

.el-link {
  vertical-align: inherit;
}

.unit-mode-switch {
  margin-bottom: 1em;
}

.unit-table {
  padding: 1em 0;
}

.icons-container {
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
</style>
