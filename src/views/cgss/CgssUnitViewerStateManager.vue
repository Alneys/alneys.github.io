<template>
  <div class="unit-state-manager">
    <slot name="prefix"></slot>
    <div>
      <el-button @click="exportCidsToClipboard" type="success" size="default">
        导出当前状态到剪切板
      </el-button>
    </div>
    <div>
      <el-button @click="importCidsFromToClipboard" type="warning" size="default">
        从剪切板导入
      </el-button>
    </div>
    <div>
      <el-button @click="exportCidsToLocalStorage" type="success" size="default">
        导出当前状态到浏览器
      </el-button>
    </div>
    <div>
      <el-button @click="importCidsFromLocalStorage" type="warning" size="default">
        从浏览器导入
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义组件 props
interface Props {
  tableData: any[];
}

const props = defineProps<Props>();

// 定义事件发射器
const emit = defineEmits<{
  'update-card-status': [disabledCids: string[]];
}>();

// 导出功能：收集所有未点亮的卡片CID
const exportCidsToString = () => {
  const darkCids: string[] = [];

  // 遍历表格数据
  props.tableData.forEach((dataRow) => {
    Object.keys(dataRow).forEach((colKey) => {
      const colValue = dataRow[colKey];
      if (Array.isArray(colValue)) {
        colValue.forEach((card) => {
          if (card && !card.isBrightness) {
            darkCids.push(card.cid);
          }
        });
      }
    });
  });

  // 去重
  const uniqueCids = [...new Set(darkCids)];

  // 创建包含disabled数组的对象
  const exportData = { disabled: uniqueCids };

  return exportData;
};

// 从字符串导入CIDs
const importCidsFromString = (jsonString: string) => {
  try {
    // 解析JSON
    let importedData: { disabled: string[] };
    try {
      importedData = JSON.parse(jsonString);

      // 验证数据结构
      if (
        !Array.isArray(importedData.disabled) ||
        !importedData.disabled.every((item) => typeof item === 'string')
      ) {
        throw new Error('内容不是有效的 {disabled: []} 格式');
      }
    } catch (error) {
      throw new Error('内容不是有效的 {disabled: []} 格式JSON');
    }

    // 获取disabled数组
    const disabledCids = importedData.disabled;

    // 通过事件通知父组件更新卡片状态
    emit('update-card-status', disabledCids);

    return true;
  } catch (error) {
    console.error('导入失败:', error);
    throw error;
  }
};

// 导出当前状态到剪切板
const exportCidsToClipboard = async () => {
  try {
    // 获取当前状态
    const jsonStr = JSON.stringify(exportCidsToString());

    // 复制到剪贴板
    await navigator.clipboard.writeText(jsonStr);

    // 显示成功提示
    ElMessage.success('已导出到剪切板！');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败，请重试');
  }
};

// 从剪切板导入
const importCidsFromToClipboard = async () => {
  try {
    // 从剪贴板读取数据
    const clipboardText = await navigator.clipboard.readText();

    await importCidsFromString(clipboardText);

    ElMessage.success('从剪切板导入成功！');
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error('导入失败，请确保剪贴板中有有效的 {disabled: []} 格式JSON');
  }
};

// 导出当前状态到浏览器本地存储
const exportCidsToLocalStorage = () => {
  try {
    // 获取当前状态
    const jsonStr = JSON.stringify(exportCidsToString());

    // 存储到localStorage
    localStorage.setItem('cgss-unit-viewer-status', jsonStr);

    // 显示成功提示
    ElMessage.success('已导出到浏览器存储！');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出到浏览器存储失败');
  }
};

// 从浏览器本地存储导入
const importCidsFromLocalStorage = () => {
  try {
    // 从localStorage读取数据
    const storedDataStr = localStorage.getItem('cgss-unit-viewer-status');

    if (!storedDataStr) {
      ElMessage.warning('没有找到存储的卡片状态数据');
      return;
    }

    importCidsFromString(storedDataStr);

    ElMessage.success('从浏览器存储导入成功！');
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error('导入失败，存储的卡片状态数据格式不正确');
  }
};
</script>

<style scoped lang="scss"></style>
