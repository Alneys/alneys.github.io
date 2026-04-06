import { ref, computed, type Ref } from 'vue';
import nameFilterData from '../data/cgss_name_filter.json';

/**
 * 名字筛选功能
 * 提供名字输入、分割和匹配判断
 * @param nameFilterRef - 可选的外部 ref，用于双向绑定筛选内容
 */
export function useCardFilter(nameFilterRef?: Ref<string>) {
  // 名字过滤输入（使用传入的 ref 或创建新的 ref）
  const inputNameFilter = nameFilterRef ?? ref(nameFilterData[0]!.nameFilter);

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
    return splitNameFilter.value.some((filterName) => name.toLowerCase() === filterName);
  };

  // 获取名字筛选数据列表
  const getNameFilterDataList = () => nameFilterData;

  return {
    // 状态
    inputNameFilter,
    // 计算属性
    splitNameFilter,
    // 方法
    isNameMatched,
    getNameFilterDataList,
  };
}
