/**
 * 周年活动计算器状态管理组合式函数
 * 统一管理表单状态、计算结果和本地存储操作
 *
 * 完整数据流：
 *
 * 输入参数
 * ├── 活动目标：目标pt、结束时间
 * ├── 当前状态：等级、当前pt、当前道具
 * ├── 资源状况：火数量、白给道具次数、体力瓶数量
 * └── 时间设置：攒道具时间、清道具时间
 *
 * 计算流程
 * ├── 步骤1：计算已有pt来源（火、白给道具、现有道具）
 * ├── 步骤2：计算pt缺口
 * ├── 步骤3：计算所需资源（体力、道具）
 * ├── 步骤4：计算可用资源（自然恢复、体力瓶、每日任务）
 * ├── 步骤5：计算钻石需求
 * └── 步骤6：计算时间和次数
 */

import { reactive, computed, type Ref } from 'vue';
import { useMltdUtils } from './useMltdUtils';
import { ANNIVERSARY_CONSTANTS } from '../MltdConstant';
import type { AnniversaryForm, AnniversaryResult } from '../MltdTypes';

const STORAGE_KEY = 'mltd-anni';

/**
 * 创建默认表单数据
 * @returns 默认的 AnniversaryForm 对象
 */
export const createDefaultForm = (): AnniversaryForm => ({
  eventEndTime: new Date(`${new Date().getFullYear()}-07-13 00:00:00+0900`),
  targetPt: undefined,
  plv: undefined,
  maxStamina: undefined,
  pt: undefined,
  token: undefined,
  boostCount: 0,
  freeTokenCount: 0,
  staminaMaxCount: 0,
  stamina30Count: 0,
  stamina20Count: 0,
  stamina10Count: 0,
  gainTokenTime: 6.5,
  burnTokenTime: 3,
  remainingTime: 0,
});

/**
 * 周年活动计算器组合式函数
 * @param form - 表单数据引用
 * @returns 计算结果和操作方法
 */
export function useMltdAnniversaryCalc(form: Ref<AnniversaryForm>) {
  const result = reactive({
    /**
     * 步骤1-1：火带来的pt
     * @formula boostCount × 10 × (2142 + 2142×转换率)
     * @description 火数量 × 10次 × (每次获得道具 + 道具转pt)
     */
    ptFromBoost: computed(
      () =>
        Math.floor(
          (form.value.boostCount ?? 0) *
            (ANNIVERSARY_CONSTANTS.TOKENS_PER_BOOST_PLAY +
              (ANNIVERSARY_CONSTANTS.TOKENS_PER_BOOST_PLAY *
                ANNIVERSARY_CONSTANTS.PT_PER_BURN_PLAY) /
                ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY) *
            ANNIVERSARY_CONSTANTS.BOOST_PLAYS_PER_FIRE,
        ) || 0,
    ),

    /**
     * 步骤1-2：白给道具带来的pt
     * @formula freeTokenCount × 4540 × (2148/720)
     * @description 白给次数 × 每日白给道具 × 转换率
     */
    ptFromFreeToken: computed(
      () =>
        Math.floor(
          (form.value.freeTokenCount ?? 0) *
            ((ANNIVERSARY_CONSTANTS.DAILY_FREE_TOKENS * ANNIVERSARY_CONSTANTS.PT_PER_BURN_PLAY) /
              ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY),
        ) || 0,
    ),

    /**
     * 步骤1-3：现有道具带来的pt
     * @formula token × (2148/720)
     * @description 当前道具数 × 转换率
     */
    ptFromRemainingToken: computed(
      () => Math.floor((form.value.token ?? 0) * ANNIVERSARY_CONSTANTS.TOKEN_TO_PT_RATIO) || 0,
    ),

    /**
     * 辅助计算：根据等级计算最大体力
     * @description 默认返回60
     */
    currentMaxStamina: computed(() => {
      if (!form.value.plv) return 60;
      const { levelToMaxStamina } = useMltdUtils();
      return levelToMaxStamina(form.value.plv) || 60;
    }),

    /**
     * 步骤4-预备：火消耗的体力
     * @formula boostCount × 4500
     * @description 火数量 × 每次火消耗
     */
    staminaForBoost: computed(
      () => (form.value.boostCount ?? 0) * ANNIVERSARY_CONSTANTS.STAMINA_COST_PER_BOOST || 0,
    ),

    /**
     * 步骤4-1：自然回复体力
     * @formula remainingTime × 288
     * @description 剩余天数 × 每日回复
     */
    staminaRecover: computed(
      () =>
        Math.floor(
          (form.value.remainingTime ?? 0) * ANNIVERSARY_CONSTANTS.STAMINA_RECOVER_PER_DAY,
        ) || 0,
    ),

    /**
     * 步骤4-2：体力瓶提供的体力
     * @formula 满体瓶×maxStamina + 30体瓶×30 + 20体瓶×20 + 10体瓶×10
     */
    staminaFromBottles: computed(
      (): number =>
        (form.value.staminaMaxCount ?? 0) * result.currentMaxStamina +
        (form.value.stamina30Count ?? 0) * 30 +
        (form.value.stamina20Count ?? 0) * 20 +
        (form.value.stamina10Count ?? 0) * 10,
    ),

    /**
     * 步骤4-3：每日任务提供的体力
     * @formula (2 × maxStamina + 10 × 30) × 剩余天数
     * @description (每日回满次数 × maxStamina + 每日30体瓶 × 30) × 剩余天数
     */
    staminaFromDaily: computed(
      (): number =>
        (ANNIVERSARY_CONSTANTS.DAILY_MAX_STAMINA_BONUS_COUNT * result.currentMaxStamina +
          ANNIVERSARY_CONSTANTS.DAILY_STAMINA_30_COUNT * 30) *
        (form.value.freeTokenCount ?? 0),
    ),

    /**
     * 步骤2：还需要获得的pt
     * @formula targetPt - currentPt - ptFromBoost - ptFromFreeToken - ptFromRemainingToken
     * @description 目标pt - 当前pt - 火贡献pt - 白给pt - 现有道具pt
     */
    ptNeeded: computed((): number => {
      const needed =
        (form.value.targetPt ?? 0) -
        (form.value.pt ?? 0) -
        (result.ptFromBoost + result.ptFromFreeToken + result.ptFromRemainingToken);
      return needed && needed > 0 ? needed : 0;
    }),

    /**
     * 步骤3-1：还需要体力
     * @formula ptNeeded / 每体力产出pt效率
     * @description 每体力效率 = (1071 + 1071×2148/720) / 450 ≈ 9.48
     */
    staminaNeeded: computed((): number => {
      return Math.ceil(
        result.ptNeeded *
          (ANNIVERSARY_CONSTANTS.STAMINA_COST_GAIN_TOKEN /
            (ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY +
              (ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY /
                ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY) *
                ANNIVERSARY_CONSTANTS.PT_PER_BURN_PLAY)),
      );
    }),

    /**
     * 步骤3-2：还需要获取道具
     * @formula staminaNeeded / 450 × 1071
     */
    tokenNeeded: computed((): number => {
      return Math.ceil(
        (result.staminaNeeded / ANNIVERSARY_CONSTANTS.STAMINA_COST_GAIN_TOKEN) *
          ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY,
      );
    }),

    /**
     * 步骤5：需要钻石数
     * @formula (staminaNeeded + staminaForBoost - staminaRecover - staminaFromBottles - staminaFromDaily) / maxStamina × 50
     * @description (总需求体力 + 火消耗体力 - 自然恢复 - 体力瓶 - 每日任务) / 最大体力 × 50
     */
    jewelNeeded: computed((): number => {
      const res = Math.ceil(
        ((result.staminaNeeded +
          result.staminaForBoost -
          result.staminaRecover -
          result.staminaFromBottles -
          result.staminaFromDaily) /
          result.currentMaxStamina) *
          ANNIVERSARY_CONSTANTS.JEWEL_PER_FULL_STAMINA,
      );
      return res > 0 ? res : 0;
    }),

    /**
     * 步骤6-1：火游玩次数
     * @formula boostCount × 10
     */
    boostPlays: computed(
      (): number => (form.value.boostCount ?? 0) * ANNIVERSARY_CONSTANTS.BOOST_PLAYS_PER_FIRE || 0,
    ),

    /**
     * 步骤6-2：普通攒道具次数
     * @formula staminaNeeded / 450
     */
    gainTokenPlays: computed(
      (): number =>
        Math.ceil(result.staminaNeeded / ANNIVERSARY_CONSTANTS.STAMINA_COST_GAIN_TOKEN) || 0,
    ),

    /**
     * 步骤6-3：清道具次数
     * @formula (token + boostCount×2142×10 + freeTokenCount×4540 + tokenNeeded) / 720
     * @description (现有道具 + 火获得道具 + 白给道具 + 还需道具) / 720
     */
    burnTokenPlays: computed(
      (): number =>
        Math.ceil(
          ((form.value.token ?? 0) +
            (form.value.boostCount ?? 0) *
              ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY *
              2 *
              ANNIVERSARY_CONSTANTS.BOOST_PLAYS_PER_FIRE +
            (form.value.freeTokenCount ?? 0) * ANNIVERSARY_CONSTANTS.DAILY_FREE_TOKENS +
            result.tokenNeeded) /
            ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY,
        ) || 0,
    ),

    /**
     * 步骤6-4：火模式时间
     * @formula boostPlays × gainTokenTime
     */
    boostTimeSpend: computed((): number => result.boostPlays * (form.value.gainTokenTime ?? 0)),

    /**
     * 步骤6-4：普通攒道具时间
     * @formula gainTokenPlays × gainTokenTime
     */
    gainTokenTimeSpend: computed(
      (): number => result.gainTokenPlays * (form.value.gainTokenTime ?? 0),
    ),

    /**
     * 步骤6-4：清道具时间
     * @formula burnTokenPlays × burnTokenTime
     */
    burnTokenTimeSpend: computed(
      (): number => result.burnTokenPlays * (form.value.burnTokenTime ?? 0),
    ),

    /**
     * 步骤6-4：总时间
     * @formula boostTimeSpend + gainTokenTimeSpend + burnTokenTimeSpend
     */
    totalTimeSpend: computed(
      (): number => result.boostTimeSpend + result.gainTokenTimeSpend + result.burnTokenTimeSpend,
    ),
  });

  /**
   * 重置当前剩余时间
   * @returns 计算后的剩余天数
   * @description 根据活动结束时间计算剩余天数，限制在0~13之间
   */
  const resetCurrentRemainingTime = (): number => {
    const remainingTime = Number(
      ((form.value.eventEndTime.getTime() - new Date().getTime()) / (1000 * 3600 * 24)).toFixed(3),
    );
    form.value.remainingTime = remainingTime;
    form.value.remainingTime = form.value.remainingTime > 0 ? form.value.remainingTime : 0;
    form.value.remainingTime =
      form.value.remainingTime > ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS
        ? ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS
        : form.value.remainingTime;
    return form.value.remainingTime;
  };

  /**
   * 根据剩余时间设置火数量和白给道具次数
   * @description 默认火数量和白给次数等于剩余天数（向下取整）
   */
  const setBoostFromRemainingTime = () => {
    if (form.value.remainingTime && form.value.remainingTime > 0) {
      form.value.boostCount = Math.floor(form.value.remainingTime);
      form.value.freeTokenCount = form.value.boostCount;
    }
  };

  /**
   * 保存表单数据到本地存储
   * @returns 是否保存成功
   */
  const saveToLocalStorage = (): boolean => {
    try {
      const data = {
        ...form.value,
        eventEndTime: form.value.eventEndTime.toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('保存失败:', error);
      return false;
    }
  };

  /**
   * 从本地存储加载表单数据
   * @returns 是否加载成功
   */
  const loadFromLocalStorage = (): boolean => {
    try {
      const formFromLocal = localStorage.getItem(STORAGE_KEY);
      if (!formFromLocal) {
        return false;
      }
      const parsed = JSON.parse(formFromLocal);
      form.value = {
        ...parsed,
        eventEndTime: new Date(parsed.eventEndTime),
      };
      return true;
    } catch (error) {
      console.error('读取失败:', error);
      return false;
    }
  };

  /**
   * 清除本地存储数据
   * @returns 是否清除成功
   */
  const clearLocalStorage = (): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清除失败:', error);
      return false;
    }
  };

  /**
   * 获取导出数据字符串
   * @returns JSON格式的表单数据
   */
  const getExportData = (): string => {
    return JSON.stringify({
      ...form.value,
      eventEndTime: form.value.eventEndTime.toISOString(),
    });
  };

  /**
   * 从JSON字符串导入数据
   * @param jsonString - JSON格式的数据字符串
   * @returns 是否导入成功
   */
  const importFromString = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      form.value = {
        ...parsed,
        eventEndTime: new Date(parsed.eventEndTime),
      };
      return true;
    } catch (error) {
      console.error('导入失败:', error);
      return false;
    }
  };

  return {
    result,
    resetCurrentRemainingTime,
    setBoostFromRemainingTime,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    getExportData,
    importFromString,
  };
}
