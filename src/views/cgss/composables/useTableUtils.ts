/**
 * 表格工具函数
 * 提供表格数据的通用处理方法
 */

import type { CgssCardSkillTableItem, CardData, TableDataRow } from '../CgssUnitViewerTypes';
import {
  tableResonanceRowHeaderSpecialize,
  tableDominantRowHeaderAttribute,
  tableDominantRowHeaderSpecialize,
} from '../CgssUnitViewerTypes';

/**
 * 处理单个参数排序的通用函数
 * @param getter - 获取排序值的函数
 * @param order - 预定义的排序顺序
 * @returns 排序比较函数
 */
const sortAttributeHelper = (
  getter: (item: TableDataRow) => string | undefined,
  order: string[],
): ((a: TableDataRow, b: TableDataRow) => number) => {
  return (a: TableDataRow, b: TableDataRow) => {
    const indexA = order.indexOf(getter(a) || '');
    const indexB = order.indexOf(getter(b) || '');

    // 如果值在预定义顺序中，则按预定义顺序排序
    if (indexA !== -1 && indexB !== -1) {
      if (indexA !== indexB) {
        return indexA - indexB;
      }
    } else {
      // 如果其中一个值不在预定义顺序中，则将预定义顺序中的值排在前面
      if (indexA !== -1) {
        return -1;
      }
      if (indexB !== -1) {
        return 1;
      }
      // 如果都不在预定义顺序中，则按字母顺序排序
      const aValue = getter(a);
      const bValue = getter(b);
      if (aValue && bValue) {
        const compareResult = aValue.localeCompare(bValue);
        if (compareResult !== 0) {
          return compareResult;
        }
      }
    }

    // 如果两个值相等，则返回 0
    return 0;
  };
};

/**
 * 创建多字段排序函数（内部辅助函数）
 * 按多个字段依次比较，最后按行号排序
 */
const createMultiFieldSorter = (
  sortFields: Array<{
    getter: (item: TableDataRow) => string | undefined;
    order: string[];
  }>,
): ((a: TableDataRow, b: TableDataRow) => number) => {
  return (a: TableDataRow, b: TableDataRow) => {
    for (const field of sortFields) {
      const compare = sortAttributeHelper(field.getter, field.order)(a, b);
      if (compare !== 0) return compare;
    }
    // 所有字段都相同，按行号排序
    return a.row - b.row;
  };
};

/**
 * tw 列排序方法（Resonance 表和 Dominant 表共用）
 * 提取数值部分进行比较，去掉 's' 后缀
 */
export const sortTableTw = (a: TableDataRow, b: TableDataRow): number => {
  const numA = a.tw ? parseInt(a.tw.replace('s', ''), 10) : 0;
  const numB = b.tw ? parseInt(b.tw.replace('s', ''), 10) : 0;

  // 按数值大小排序
  if (numA !== numB) {
    return numA - numB;
  }
  // 如果 tw 相同，按行号排序
  return a.row - b.row;
};

/**
 * Resonance 表 specialize 列排序方法
 * 排序顺序：specialize → row
 */
export const sortResonanceSpecialize = createMultiFieldSorter([
  { getter: (item) => item.specialize, order: tableResonanceRowHeaderSpecialize },
]);

/**
 * Dominant 表 target_attribute 列排序方法
 * 排序顺序：target_attribute → target_param → target_attribute_2 → row
 */
export const sortDominantAttribute = createMultiFieldSorter([
  { getter: (item) => item.target_attribute, order: tableDominantRowHeaderAttribute },
  { getter: (item) => item.target_param, order: tableDominantRowHeaderSpecialize },
  { getter: (item) => item.target_attribute_2, order: tableDominantRowHeaderAttribute },
]);

/**
 * Dominant 表 target_attribute_2 列排序方法
 * 排序顺序：target_attribute_2 → target_param_2 → target_attribute → row
 */
export const sortDominantAttribute2 = createMultiFieldSorter([
  { getter: (item) => item.target_attribute_2, order: tableDominantRowHeaderAttribute },
  { getter: (item) => item.target_param_2, order: tableDominantRowHeaderSpecialize },
  { getter: (item) => item.target_attribute, order: tableDominantRowHeaderAttribute },
]);

/**
 * 创建卡片数据对象
 * @param item - 卡片技能表数据项
 * @returns 卡片数据对象
 */
export const createCardDataItem = (item: CgssCardSkillTableItem): CardData => {
  return {
    card: item,
    isBrightness: true,
  };
};

/**
 * 定义卡片排序函数
 * 根据指定参数对卡片数组进行排序（从大到小）
 * @param cards - 卡片数据数组
 * @param targetParam - 目标参数字段
 * @returns 排序后的卡片数组
 */
export const sortCardsByParam = (
  cards: CardData[],
  targetParam: string | undefined,
): CardData[] => {
  if (!targetParam) return cards;

  return cards.sort((a, b) => {
    const cardA = a.card;
    const cardB = b.card;

    if (!cardA || !cardB) return 0;

    // 根据目标参数获取对应数值
    const paramKey = targetParam as keyof CgssCardSkillTableItem['stats'];

    const aValue = cardA.stats[paramKey] || 0;
    const bValue = cardB.stats[paramKey] || 0;

    // 从大到小排序
    return bValue - aValue;
  });
};
