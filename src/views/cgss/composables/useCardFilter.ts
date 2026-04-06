import { ref, computed } from 'vue';
import defaultFilterData from '../data/cgss_default_name_filter.json';

/**
 * 名字筛选功能
 * 提供名字输入、分割和匹配判断
 */
export function useCardFilter(nameFilter?: string, information?: string) {
  // 名字过滤输入（使用传入参数或 JSON 文件中的默认值）
  const inputNameFilter = ref(nameFilter ?? defaultFilterData.defaultNameFilter);
  const inputNameFilterDefaultInformation = ref(
    information ?? defaultFilterData.defaultInformation,
  );

  // 分割后的名字列表
  const splitNameFilter = computed(() => {
    if (!inputNameFilter.value) return [];

    // 将过滤器按空格、换行、半角逗号或全角顿号分割，并移除空字符串
    return inputNameFilter.value
      .split(/[ ,、\n]+/)
      .filter((name) => name.trim() !== '')
      .map((name) => name.toLowerCase().trim());
  });

  // 判断名字是否匹配筛选条件
  const isNameMatched = (name: string | undefined): boolean => {
    // 如果没有名字，返回 true
    if (!name) return true;

    // 如果过滤列表为空，返回 true
    if (splitNameFilter.value.length === 0) return true;

    // 检查名字是否包含任何一个过滤词（不区分大小写）
    return splitNameFilter.value.some((filterName) => name.toLowerCase().includes(filterName));
  };

  return {
    // 状态
    inputNameFilter,
    inputNameFilterDefaultInformation,
    // 计算属性
    splitNameFilter,
    // 方法
    isNameMatched,
  };
}
