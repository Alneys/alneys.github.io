/**
 * 图标操作组合式函数
 * 处理表格中图标的点击、亮度切换等操作
 * 支持任意数量的表格
 */

import { ref, type Ref } from 'vue';
import type { TableDataRow, CardData } from '../CgssUnitViewerTypes';

/**
 * 图标操作组合式函数
 * @param tableDataRefs - 表格数据响应式引用数组，支持任意数量的表格
 * @param clickIconAction - 点击图标的行为模式 ('None' | 'ToggleCardStatus' | 'ViewCardInfo')
 */
export function useIconActions(tableDataRefs: Ref<TableDataRow[]>[], clickIconAction: Ref<string>) {
  // 所有图标的亮度状态
  const allIconsBright = ref(true);

  /**
   * 遍历所有表格的所有单元格执行操作
   * @param callback - 对每个图标执行的操作
   */
  const forEachIcon = (callback: (icon: CardData) => void) => {
    tableDataRefs.forEach((tableDataRef) => {
      tableDataRef.value.forEach((dataRow) => {
        Object.keys(dataRow).forEach((colKey) => {
          const colValue = dataRow[colKey];
          if (Array.isArray(colValue)) {
            colValue.forEach((icon) => {
              if (icon) {
                callback(icon);
              }
            });
          }
        });
      });
    });
  };

  /**
   * 根据卡片名称更新所有表格中的图标亮度
   * @param cardTitle - 卡片标题
   * @param newState - 新的亮度状态
   */
  const updateCardBrightnessByName = (cardTitle: string, newState: boolean) => {
    forEachIcon((icon) => {
      if (icon.card && icon.card.title === cardTitle) {
        icon.isBrightness = newState;
      }
    });
  };

  /**
   * 根据 CID 列表更新卡片亮度状态
   * @param disabledCids - 需要禁用（变暗）的卡片 CID 列表
   */
  const updateCardBrightnessByCids = (disabledCids: string[]) => {
    const disabledSet = new Set(disabledCids);
    forEachIcon((icon) => {
      if (icon.card) {
        icon.isBrightness = !disabledSet.has(icon.card.cid);
      }
    });
  };

  /**
   * 切换所有图标的亮度
   */
  const toggleAllIconsBrightness = () => {
    allIconsBright.value = !allIconsBright.value;
    forEachIcon((icon) => {
      icon.isBrightness = allIconsBright.value;
    });
  };

  /**
   * 设置所有图标的亮度
   * @param brightness - 亮度状态
   */
  const setAllIconsBrightness = (brightness: boolean) => {
    allIconsBright.value = brightness;
    forEachIcon((icon) => {
      icon.isBrightness = brightness;
    });
  };

  /**
   * 处理图标点击事件
   * @param row - 表格行数据
   * @param colKey - 列键名
   * @param index - 图标在单元格中的索引
   * @returns 是否处理了点击事件（用于外部判断是否需要额外操作）
   */
  const handleIconClick = (
    row: TableDataRow,
    colKey: string,
    index: number,
  ): { handled: boolean; card?: CardData['card']; newState?: boolean } => {
    // 验证输入参数
    if (!row || !colKey || index < 0) {
      console.warn('Invalid parameters for handleIconClick');
      return { handled: false };
    }

    // 验证列数据是否为数组
    const colData = row[colKey];
    if (!Array.isArray(colData) || index >= colData.length) {
      console.warn('Invalid column data or index out of bounds');
      return { handled: false };
    }

    const icon = colData[index];
    // 验证图标对象是否有效
    if (!icon || !icon.card) {
      console.warn('Invalid icon object');
      return { handled: false };
    }

    // 根据点击行为模式决定操作
    if (clickIconAction.value === 'ViewCardInfo') {
      if (icon.card.link) {
        // 提取链接中的数字并减1
        const modifiedLink = icon.card.link.replace(/c_(\d+)_/, (match, num) => {
          const newNum = parseInt(num) - 1;
          return `c_${newNum}_`;
        });
        window.open('https://starlight.346lab.org' + modifiedLink, '_blank');
      } else {
        console.warn(`No link found for card with cid: ${icon.card.cid}`);
      }
      return { handled: true, card: icon.card };
    }

    if (clickIconAction.value === 'ToggleCardStatus') {
      const targetName = icon.card.title;
      const newState = !icon.isBrightness;

      // 更新所有表格中相同名称的图标亮度
      updateCardBrightnessByName(targetName, newState);

      return { handled: true, card: icon.card, newState };
    }

    return { handled: false };
  };

  /**
   * 获取所有卡片数据（用于外部统计或导出）
   */
  const getAllCards = (): CardData[] => {
    const cards: CardData[] = [];
    forEachIcon((icon) => {
      cards.push(icon);
    });
    return cards;
  };

  /**
   * 获取所有亮起/暗淡的卡片
   * @param brightness - 亮度状态
   */
  const getCardsByBrightness = (brightness: boolean): CardData[] => {
    const cards: CardData[] = [];
    forEachIcon((icon) => {
      if (icon.isBrightness === brightness) {
        cards.push(icon);
      }
    });
    return cards;
  };

  return {
    // 状态
    allIconsBright,
    // 操作方法
    handleIconClick,
    toggleAllIconsBrightness,
    setAllIconsBrightness,
    updateCardBrightnessByName,
    updateCardBrightnessByCids,
    // 工具方法
    getAllCards,
    getCardsByBrightness,
  };
}
