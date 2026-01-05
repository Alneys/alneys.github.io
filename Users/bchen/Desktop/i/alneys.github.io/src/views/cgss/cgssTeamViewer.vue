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
                v-for="(img, imgIndex) in scope.row[`col${colIndex}`]"
                :key="imgIndex"
                :src="img.src"
                :class="{ 'table-image': true, grayscale: img.isGrayscale }"
                @click="toggleGrayscale(scope.row, `col${colIndex}`, imgIndex)"
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
import { cgssResonanceTeamData } from './cgssTeam.ts';
// 导入JSON数据和类型定义
import cgssCardSkillTableFinal from './cgss_extracted_card_skill_table_final.json';
import type { CgssCardSkillTableItem } from './cgssTeam.ts';

// 将JSON数据转换为类型化的数据
const cgssCardData = ref<CgssCardSkillTableItem[]>(cgssCardSkillTableFinal);

const tableDataRowHeader = ['7s', '9s', '11s'];
const tableDataColumnHeader = ['resonance', 'synergy', 'symphony', 'spike', 'refrain'];

interface ImageItem {
  name: string;
  src: string;
  isGrayscale?: boolean; // 新增字段，标识是否为黑白
}

interface TableRow {
  [key: string]: ImageItem[];
}

const indexMethod = (index: number) => {
  return tableDataRowHeader[index];
};

// 初始化数据时添加 isGrayscale 字段
const initializeImageData = (data: any[]): TableRow[] => {
  return data.map((row) => {
    const newRow: TableRow = {};
    Object.keys(row).forEach((key) => {
      newRow[key] = row[key].map((img: any) => ({
        ...img,
        isGrayscale: false, // 默认不是黑白
      }));
    });
    return newRow;
  });
};

const tableData = ref<TableRow[]>(initializeImageData(cgssResonanceTeamData));

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