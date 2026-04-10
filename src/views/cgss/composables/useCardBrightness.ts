/**
 * 卡片亮度状态管理组合式函数
 * 统一管理所有表格的卡片亮度状态，与表格数据解耦
 * 使用全局单例 Set 存储暗掉的卡片 CID
 */

import { ref, type Ref } from 'vue';
import type { TableDataRow } from '../CgssUnitViewerTypes';

// 全局单例：暗掉的卡片 CID 集合
const disabledCids = ref(new Set<string>());

/**
 * 卡片亮度状态管理
 * 提供统一的状态管理方法，支持跨表格同步
 */
export function useCardBrightness() {
  /**
   * 判断卡片是否亮着
   * @param cid - 卡片 CID
   * @returns 亮度状态（true = 亮，false = 暗）
   */
  const isCardBright = (cid: string): boolean => {
    return !disabledCids.value.has(cid);
  };

  /**
   * 设置单个卡片亮度
   * @param cid - 卡片 CID
   * @param isBright - 亮度状态
   */
  const setCardBrightness = (cid: string, isBright: boolean) => {
    if (isBright) {
      disabledCids.value.delete(cid);
    } else {
      disabledCids.value.add(cid);
    }
    // 触发响应式更新
    disabledCids.value = new Set(disabledCids.value);
  };

  /**
   * 切换单个卡片亮度
   * @param cid - 卡片 CID
   * @returns 新的亮度状态
   */
  const toggleCardBrightness = (cid: string): boolean => {
    const isCurrentlyBright = isCardBright(cid);
    setCardBrightness(cid, !isCurrentlyBright);
    return !isCurrentlyBright;
  };

  /**
   * 根据卡片标题收集所有同名卡片的 CID
   * @param cardTitle - 卡片标题
   * @param tableDataRefs - 表格数据引用数组
   * @returns 同名卡片的 CID 集合
   */
  const collectCidsByTitle = (
    cardTitle: string,
    tableDataRefs: Ref<TableDataRow[]>[],
  ): Set<string> => {
    const cids = new Set<string>();
    tableDataRefs.forEach((tableRef) => {
      tableRef.value.forEach((row) => {
        Object.values(row).forEach((cell) => {
          if (Array.isArray(cell)) {
            cell.forEach((cardData) => {
              if (cardData?.card?.title === cardTitle) {
                cids.add(cardData.card.cid);
              }
            });
          }
        });
      });
    });
    return cids;
  };

  /**
   * 根据卡片标题切换亮度（同卡面多卡片联动）
   * @param cardTitle - 卡片标题
   * @param tableDataRefs - 表格数据引用数组
   * @returns 新的亮度状态
   */
  const toggleCardBrightnessByTitle = (
    cardTitle: string,
    tableDataRefs: Ref<TableDataRow[]>[],
  ): boolean => {
    const cids = collectCidsByTitle(cardTitle, tableDataRefs);

    // 获取当前亮度（以第一个为准）
    const firstCid = [...cids][0];
    if (!firstCid) return false;

    const newBrightness = !isCardBright(firstCid);

    // 批量更新
    cids.forEach((cid) => setCardBrightness(cid, newBrightness));
    return newBrightness;
  };

  /**
   * 根据卡片标题设置亮度
   * @param cardTitle - 卡片标题
   * @param isBright - 亮度状态
   * @param tableDataRefs - 表格数据引用数组
   */
  const setCardBrightnessByTitle = (
    cardTitle: string,
    isBright: boolean,
    tableDataRefs: Ref<TableDataRow[]>[],
  ) => {
    const cids = collectCidsByTitle(cardTitle, tableDataRefs);
    cids.forEach((cid) => setCardBrightness(cid, isBright));
  };

  /**
   * 收集所有表格中的卡片 CID
   * @param tableDataRefs - 表格数据引用数组
   * @returns 所有卡片 CID 集合
   */
  const collectAllCids = (tableDataRefs: Ref<TableDataRow[]>[]): Set<string> => {
    const allCids = new Set<string>();
    tableDataRefs.forEach((tableRef) => {
      tableRef.value.forEach((row) => {
        Object.values(row).forEach((cell) => {
          if (Array.isArray(cell)) {
            cell.forEach((cardData) => {
              if (cardData?.card?.cid) {
                allCids.add(cardData.card.cid);
              }
            });
          }
        });
      });
    });
    return allCids;
  };

  /**
   * 切换所有卡片亮度
   * @param tableDataRefs - 表格数据引用数组
   * @returns 新的亮度状态（true = 全亮，false = 全暗）
   */
  const toggleAllBrightness = (tableDataRefs: Ref<TableDataRow[]>[]): boolean => {
    // 检查当前是否全部亮着
    const allBright = disabledCids.value.size === 0;

    if (allBright) {
      // 全部变暗：收集所有 CID
      const allCids = collectAllCids(tableDataRefs);
      disabledCids.value = allCids;
      return false;
    } else {
      // 全部变亮
      disabledCids.value = new Set();
      return true;
    }
  };

  /**
   * 设置所有卡片亮度
   * @param isBright - 亮度状态
   * @param tableDataRefs - 表格数据引用数组
   */
  const setAllBrightness = (isBright: boolean, tableDataRefs: Ref<TableDataRow[]>[]) => {
    if (isBright) {
      disabledCids.value = new Set();
    } else {
      const allCids = collectAllCids(tableDataRefs);
      disabledCids.value = allCids;
    }
  };

  /**
   * 根据导出的 CID 列表设置亮度状态
   * @param cids - 需要禁用（变暗）的卡片 CID 列表
   */
  const setBrightnessByCids = (cids: string[]) => {
    disabledCids.value = new Set(cids);
  };

  /**
   * 获取当前暗掉的 CID 列表（用于导出）
   * @returns 暗 CID 数组
   */
  const getDisabledCids = (): string[] => {
    return [...disabledCids.value];
  };

  /**
   * 获取导出数据对象
   * @returns 包含 disabled 数组的对象
   */
  const getExportData = (): { disabled: string[] } => {
    return { disabled: getDisabledCids() };
  };

  /**
   * 重置所有状态（全部变亮）
   */
  const resetBrightness = () => {
    disabledCids.value = new Set();
  };

  return {
    // 状态
    disabledCids,
    // 判断方法
    isCardBright,
    // 单卡片操作
    setCardBrightness,
    toggleCardBrightness,
    // 多卡片操作（按标题）
    toggleCardBrightnessByTitle,
    setCardBrightnessByTitle,
    // 全局操作
    toggleAllBrightness,
    setAllBrightness,
    setBrightnessByCids,
    resetBrightness,
    // 导出相关
    getDisabledCids,
    getExportData,
  };
}
