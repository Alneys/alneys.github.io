<template>
  <div class="password-generator">
    <h1 class="view-title">Title</h1>
    <div class="al-divider"></div>
    <div class="main-container">
      <el-table :data="tableData" style="width: 100%" border :span-method="objectSpanMethod">
        <!-- 第一列：属性 -->
        <el-table-column :width="80" label="属性" fixed>
          <template #default="scope">
            <span
              :style="{
                fontWeight: 'bold',
                color: `var(--im-color-cg-${tableDataRowHeaderSpecialize[Math.round(scope.$index / tableDataRowHeaderTw.length)]})`,
              }"
            >
              {{
                tableDataRowHeaderSpecialize[Math.round(scope.$index / tableDataRowHeaderTw.length)]
              }}
            </span>
          </template>
        </el-table-column>
        <!-- 第二列：间隔值 -->
        <el-table-column :width="64" label="间隔" fixed>
          <template #default="scope">
            <span style="font-weight: bold">
              {{ tableDataRowHeaderTw[scope.$index % tableDataRowHeaderTw.length] }}s
            </span>
          </template>
        </el-table-column>
        <!-- 后续列：结果 -->
        <el-table-column
          v-for="colIndex in tableDataColumnHeader.length"
          :key="colIndex"
          :label="`${tableDataColumnHeader[colIndex - 1].label}`"
        >
          <template #default="scope">
            <div class="image-container">
              <div
                v-for="(img, imgIndex) in scope.row[tableDataColumnHeader[colIndex - 1].value]"
                :key="imgIndex"
                :title="img.title ?? ''"
                :class="{
                  icon: true,
                  [`icon_${img.cid}`]: true,
                  dark: !img.isBrightness,
                }"
                @click="
                  toggleBrightness(scope.row, tableDataColumnHeader[colIndex - 1].value, imgIndex)
                "
              ></div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, shallowRef } from 'vue';
import cgssCardSkillTable from './cgss_extracted_card_skill_table_ssr.json';

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

const tableDataRowHeaderSpecialize = ['vocal', 'dance', 'visual'];
const tableDataRowHeaderTw = ['7', '9', '11'];
const tableDataColumnHeader = [
  { value: 'motif', label: '共鸣 motif' },
  { value: 'synergy', label: '大偏 synergy' },
  { value: 'symphony', label: '交响 symphony' },
  { value: 'spike', label: '尖峰 spike' },
  { value: 'refrain', label: '复读 refrain' },
];
1;

interface ImageItem {
  cid: string;
  name: string;
  title?: string;
  src?: string;
  isBrightness?: boolean;
}

interface TableRow {
  [key: string]: ImageItem[];
}

const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  if (columnIndex === 0) {
    if (rowIndex % tableDataRowHeaderTw.length === 0) {
      return [tableDataRowHeaderTw.length, 1];
    } else {
    }
    return [0, 0];
  }
};

// 初始化数据时添加 isBrightness 字段
const initializeImageData = (data: CgssCardSkillTableItem[]): TableRow[] => {
  // 动态创建表格数据结构
  const result: TableRow[] = Array.from(
    { length: tableDataRowHeaderTw.length * tableDataRowHeaderSpecialize.length },
    () => ({
      motif: [],
      synergy: [],
      symphony: [],
      spike: [],
      refrain: [],
    }),
  );

  // 遍历技能表数据，根据specialize和skill.tw分配到对应的单元格
  data.forEach((item: CgssCardSkillTableItem) => {
    // 检查稀有度，如果不是SSR则直接返回，不执行后续操作
    if (item.rarity !== 'ssr') {
      return;
    }

    // 根据specialize确定行的前半部分索引
    const specializeIndex = tableDataRowHeaderSpecialize.indexOf(item.specialize);
    if (specializeIndex === -1) {
      // 如果specialize不在预定义范围内，跳过该数据
      return;
    }
    let rowBaseIndex = specializeIndex * tableDataRowHeaderTw.length; // 每个specialize的行数

    // 根据skill.tw确定行索引
    const twIndex = tableDataRowHeaderTw.indexOf(String(item.skill.params.tw));
    if (twIndex === -1) {
      // 如果tw不在预定义范围内，跳过该数据
      return;
    }
    let rowOffset = twIndex;

    // 计算实际行索引
    const rowIndex = rowBaseIndex + rowOffset;

    // 根据skill.type确定列名
    const columnInfo = tableDataColumnHeader.find((col) => col.value === item.skill.type);
    if (!columnInfo) {
      // 如果type不在预定义范围内，跳过该数据
      return;
    }
    let colName = columnInfo.value;

    // 将数据添加到对应单元格
    result[rowIndex][colName].push({
      cid: item.cid,
      name: item.name,
      title: `${item.title} ${item.name}`,
      // src: '/src/assets/images/test-image-1.jpeg',
      isBrightness: true,
    });
  });

  return result;
};

const tableData = ref<TableRow[]>(
  initializeImageData(cgssCardSkillTable as CgssCardSkillTableItem[]),
);

// 切换图片状态
const toggleBrightness = (row: TableRow, colKey: string, index: number) => {
  const image = row[colKey][index];
  const targetName = image.title;
  const newState = !image.isBrightness;

  // 更新所有名称相同的图片的状态
  tableData.value.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      dataRow[colKey].forEach((img) => {
        if (img.title === targetName) {
          img.isBrightness = newState;
        }
      });
    });
  });
};
</script>

<style lang="scss" scoped>
// @import '@/assets/styles/im/346lab/icons.css';
@import '@/assets/styles/im/346lab/icons@2x.css';

.el-table {
  --el-table-header-text-color: var(--el-text-color-regular);
}

.main-container {
  padding: 16px;
}

.image-container {
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
