<template>
  <div class="unit-viewer">
    <h1 class="view-title">Title</h1>
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
        <el-table-column prop="specialize" label="属性" width="80" fixed>
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
        <el-table-column prop="tw" label="间隔" :width="64" fixed>
          <template #default="scope">
            <span style="font-weight: bold">
              {{ scope.row.tw }}
            </span>
          </template>
        </el-table-column>
        <!-- 后续列：结果 -->
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
                    imgIndex,
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
    <div class="unit-table">
      <el-table :data="tableDataDominant" border style="width: 100%">
        <!-- 第一列：target_attribute_2 -->
        <el-table-column prop="target_attribute_2" label="属性2" :width="96">
          <template #default="scope">
            <span>{{ scope.row.target_attribute_2 || '' }}</span>
          </template>
        </el-table-column>

        <!-- 第二列：target_attribute -->
        <el-table-column prop="target_attribute" label="属性" :width="96">
          <template #default="scope">
            <span>{{ scope.row.target_attribute || '' }}</span>
          </template>
        </el-table-column>

        <!-- 第三列：tw -->
        <el-table-column prop="tw" label="间隔" :width="64">
          <template #default="scope">
            <span>{{ scope.row.tw || '' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, shallowRef } from 'vue';
import CgssCardSkillTable from './cgss_extracted_card_skill_table_ssr.json';

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
  { value: 'motif', label: '共鸣 motif' },
  { value: 'synergy', label: '大偏 synergy' },
  { value: 'symphony', label: '交响 symphony' },
  { value: 'spike', label: '尖峰 spike' },
  { value: 'refrain', label: '复读 refrain' },
];

// Dominant table
const tableDominantRowHeaderAttribute = ['cute', 'cool', 'passion'];
const tableDominantRowHeaderSpecialize = tableResonanceRowHeaderSpecialize;
const tableDominantRowHeaderTw = ['6', '9', '11', '13'];

const tableDataDominantCount = Array.from(
  {
    length:
      tableDominantRowHeaderAttribute.length *
      (tableDominantRowHeaderAttribute.length - 1) *
      tableDominantRowHeaderTw.length,
  },
  () => 0,
);

interface CellItem {
  cid: string;
  name: string;
  title?: string;
  src?: string;
  isBrightness?: boolean;
  link?: string;
}

interface TableResonanceRow {
  specialize: string; // 新增：属性
  tw: string; // 新增：间隔
  [key: string]: CellItem[] | string;
}

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

// 初始化数据
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

const initializeDataDominant = (data: CgssCardSkillTableItem[]): TableResonanceRow[] => {
  // 创建表格数据结构，包含24种情况
  const result: TableResonanceRow[] = [];

  // 遍历所有可能的组合
  tableDominantRowHeaderAttribute.forEach((attr2) => {
    // 找到与attr2不同的attr
    tableDominantRowHeaderAttribute.forEach((attr) => {
      if (attr !== attr2) {
        // 遍历所有tw值
        tableDominantRowHeaderTw.forEach((tw) => {
          // 为每种组合创建一行数据
        });
      }
    });
  });

  return result;
};

const tableDataResonance = ref<TableResonanceRow[]>(
  initializeDataResonance(CgssCardSkillTable as CgssCardSkillTableItem[]),
);

const tableDataDominant = ref<TableResonanceRow[]>(
  initializeDataDominant(CgssCardSkillTable as CgssCardSkillTableItem[]),
);

const modeSwitch = ref(true);
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

    // 更新所有名称相同的图片的状态
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
  }
};
</script>

<style lang="scss" scoped>
// @import '@/assets/styles/im/346lab/icons.css';
@import '@/assets/styles/im/346lab/icons@2x.css';

.el-table {
  --el-table-header-text-color: var(--el-text-color-regular);
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
