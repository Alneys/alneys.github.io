<template>
  <div class="password-generator">
    <h1 class="view-title">Title</h1>
    <div class="al-divider"></div>
    <div class="main-container">
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column :width="64">
          <template #default="scope">
            {{ tableDataRowHeader[scope.$index] }}
          </template>
        </el-table-column>

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

const tableDataRowHeader = ['7', '9', '11'];
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

// 初始化数据时添加 isGrayscale 字段
const initializeImageData = (data: CgssCardSkillTableItem[]): TableRow[] => {
  // 创建一个空的表格数据结构，使用 tableDataColumnHeader 作为键名
  const result: TableRow[] = [
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // 7
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // 9
    { motif: [], synergy: [], symphony: [], spike: [], refrain: [] }, // 11
  ];

  // 遍历技能表数据，根据skill.type和skill.m_dur分配到对应的单元格
  data.forEach((item: CgssCardSkillTableItem) => {
    // 检查稀有度，如果不是SSR则直接返回，不执行后续操作
    if (item.rarity !== 'ssr') {
      return;
    }

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

    // 根据skill.m_dur确定行索引
    let rowIndex = -1;
    switch (item.skill.params.tw) {
      case 7:
        rowIndex = 0;
        break;
      case 9:
        rowIndex = 1;
        break;
      case 11:
        rowIndex = 2;
        break;
      default:
        // 如果m_dur不在预定义范围内，跳过该数据
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
