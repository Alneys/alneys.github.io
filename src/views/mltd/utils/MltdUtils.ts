/**
 * MLTD 工具函数
 * 提供等级体力转换等功能
 */

import { LEVEL_TO_MAX_STAMINA_TABLE } from '../data/MltdConstants';

/**
 * 根据等级获取最大体力值
 * @param level 玩家等级
 * @returns 对应的最大体力值
 */
export const levelToMaxStamina = (level: number): number => {
  if (level < 0) {
    return LEVEL_TO_MAX_STAMINA_TABLE[0] ?? 60;
  }
  if (level >= LEVEL_TO_MAX_STAMINA_TABLE.length) {
    return LEVEL_TO_MAX_STAMINA_TABLE[LEVEL_TO_MAX_STAMINA_TABLE.length - 1] ?? 240;
  }
  return LEVEL_TO_MAX_STAMINA_TABLE[level] ?? LEVEL_TO_MAX_STAMINA_TABLE[0] ?? 60;
};
