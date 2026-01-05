<template>
  <div class="password-generator">
    <h1 class="view-title">Title</h1>
    <div class="al-divider"></div>
    <div class="main-container">
      <el-table :data="tableData" style="width: 100%" border :span-method="objectSpanMethod">
        <!-- 第一列：specialize 值 -->
        <el-table-column :width="80" label="type">
          <template #default="scope">
            {{ tableDataRowHeaderSpecialize[scope.$index] }}
          </template>
        </el-table-column>
        <!-- 第二列：tw 值 -->
        <el-table-column :width="64" label="time">
          <template #default="scope">
            {{ tableDataRowHeaderTw[scope.$index] }}
          </template>
        </el-table-column>
        <!-- 后续列：结果 -->
        <el-table-column
          v-for="colIndex in 5"
          :key="colIndex"
          :label="`${tableDataColumnHeader[colIndex - 1]}`"
        >
          <template #default="scope">
            <div class="image-container">
              <img
                v-for="(img, imgIndex) in scope.row[tableDataColumnHeader[colIndex - 1]]"
                :key="imgIndex"
                :src="img.src"
                :alt="img.alt ?? ''"
                :class="{ 'table-image': true, grayscale: img.isGrayscale }"
                @click="toggleGrayscale(scope.row, tableDataColumnHeader[colIndex - 1], imgIndex)"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, shallowRef } from 'vue';
import cgssCardSkillTable from './cgss_extracted_card_skill_table.json';

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
    params: {
      pup: number;
    };
  };
}

const tableDataRowHeaderSpecialize = [
  'vocal',
  'vocal',
  'vocal',
  'dance',
  'dance',
  'dance',
  'visual',
  'visual',
  'visual',
];
const tableDataRowHeaderTw = ['7', '9', '11', '7', '9', '11', '7', '9', '11'];
const tableDataColumnHeader = ['motif', 'synergy', 'symphony', 'spike', 'refrain'];

interface ImageItem {
  name: string;
  alt?: string;
  src?: string;
  isGrayscale?: boolean; // 新增字段，标识是否为黑白
}

interface TableRow {
  [key: string]: ImageItem[];
}

const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  if (columnIndex === 0) {
    if (rowIndex % 3 === 0) {
      return [3, 1];
    } else {
    }
    return [0, 0];
  }
};

// 初始化数据时添加 isGrayscale 字段
const initializeImageData = (data: CgssCardSkillTableItem[]): TableRow[] => {
  // 创建一个空的表格数据结构，使用 tableDataColumnHeader 作为键名
  const result: TableRow[] = [
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // vocal 7
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // vocal 9
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // vocal 11
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // visual 7
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // visual 9
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // visual 11
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // dance 7
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // dance 9
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // dance 11
  ];

  // 遍历技能表数据，根据specialize和skill.tw分配到对应的单元格
  data.forEach((item: CgssCardSkillTableItem) => {
    // 检查稀有度，如果不是SSR则直接返回，不执行后续操作
    if (item.rarity !== 'ssr') {
      return;
    }

    // 根据specialize确定行的前半部分索引
    let rowBaseIndex = -1;
    switch (item.specialize) {
      case 'vocal':
        rowBaseIndex = 0; // vocal行组从索引0开始
        break;
      case 'dance':
        rowBaseIndex = 3; // dance行组从索引3开始
        break;
      case 'visual':
        rowBaseIndex = 6; // visual行组从索引6开始
        break;
      default:
        // 如果specialize不在预定义范围内，跳过该数据
        return;
    }

    // 根据skill.tw确定行索引
    let rowOffset = -1;
    switch (item.skill.params.tw) {
      case 7:
        rowOffset = 0;
        break;
      case 9:
        rowOffset = 1;
        break;
      case 11:
        rowOffset = 2;
        break;
      default:
        // 如果tw不在预定义范围内，跳过该数据
        return;
    }

    // 计算实际行索引
    const rowIndex = rowBaseIndex + rowOffset;

    // 根据skill.type确定列名
    let colName = '';
    console.log(item.skill.type);
    switch (item.skill.type) {
      case 'motif':
        colName = 'motif';
        break;
      case 'synergy':
        colName = 'synergy';
        break;
      case 'symphony':
        colName = 'symphony';
        break;
      case 'spike':
        colName = 'spike';
        break;
      case 'refrain':
        colName = 'refrain';
        break;
      default:
        // 如果type不在预定义范围内，跳过该数据
        return;
    }

    // 将数据添加到对应单元格
    result[rowIndex][colName].push({
      name: item.name,
      alt: `${item.title} ${item.name}`,
      // src: '/src/assets/images/test-image-1.jpeg',
      isGrayscale: false,
    });
  });

  return result;
};

const tableData = ref<TableRow[]>(
  initializeImageData(cgssCardSkillTable as CgssCardSkillTableItem[]),
);

console.log(cgssCardSkillTable);

// 切换图片黑白状态
const toggleGrayscale = (row: TableRow, colKey: string, index: number) => {
  const image = row[colKey][index];
  const targetName = image.name;
  const newState = !image.isGrayscale;

  // 更新所有名称相同的图片的黑白状态
  tableData.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      dataRow[colKey].forEach((img) => {
        if (img.name === targetName) {
          img.isGrayscale = newState;
        }
      });
    });
  });
};
</script>

<style lang="scss" scoped>
.main-container {
  padding: 20px;
}

.image-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  min-height: 64px;
}

.table-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  margin: 2px;
  cursor: pointer; // 添加光标效果提示可点击
}

.table-image.grayscale {
  filter: grayscale(100%);
}
</style>
