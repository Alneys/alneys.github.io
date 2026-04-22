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
import { MLTD_ANNIVERSARY_CONSTANTS as MLTD } from '../MltdConstant';
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
  tokens: undefined,
  boostCount: 0,
  freeTokenClaimCount: 0,
  staminaMaxBottleCount: 0,
  stamina30BottleCount: 0,
  stamina20BottleCount: 0,
  stamina10BottleCount: 0,
  tokenAccumulateTime: 6.5,
  tokenConsumeTime: 3,
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
     * 步骤1-1：火攒道具带来的pt
     * @formula boostCount × 10 × (1071×2双倍道具 + 双倍道具×转换率)
     * @description 火攒道具次数 × 10次 × (每次获得双倍道具 + 双倍道具转pt)
     */
    ptFromBoost: computed(
      () =>
        Math.floor(
          (form.value.boostCount ?? 0) *
            (MLTD.tokensPerBoostAccumulatePlay +
              (MLTD.tokensPerBoostAccumulatePlay * MLTD.ptPerConsumePlay) /
                MLTD.tokensPerConsumePlay) *
            MLTD.boostAccumulatePlaysPerBoostItem,
        ) || 0,
    ),

    /**
     * 步骤1-2：白给道具带来的pt
     * @formula freeTokenClaimCount × 4540 × (2148/720)
     * @description 白给次数 × 每日白给道具 × 转换率
     */
    ptFromFreeTokens: computed(
      () =>
        Math.floor(
          (form.value.freeTokenClaimCount ?? 0) *
            ((MLTD.dailyFreeTokens * MLTD.ptPerConsumePlay) / MLTD.tokensPerConsumePlay),
        ) || 0,
    ),

    /**
     * 步骤1-3：现有道具带来的pt
     * @formula tokens × (2148/720)
     * @description 当前道具数 × 转换率
     */
    ptFromRemainingTokens: computed(
      () => Math.floor((form.value.tokens ?? 0) * MLTD.tokenToPtRatio) || 0,
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
     * 步骤4-预备：火攒道具消耗的体力
     * @formula boostCount × 4500
     * @description 火攒道具次数 × 每次火攒道具消耗体力（与普通攒道具相同，无双倍效果）
     */
    staminaForBoost: computed(
      () => (form.value.boostCount ?? 0) * MLTD.staminaCostPerBoostAccumulate || 0,
    ),

    /**
     * 步骤4-1：自然回复体力
     * @formula remainingTime × 288
     * @description 剩余天数 × 每日回复
     */
    staminaRecovered: computed(
      () => Math.floor((form.value.remainingTime ?? 0) * MLTD.staminaRecoverPerDay) || 0,
    ),

    /**
     * 步骤4-2：体力瓶提供的体力
     * @formula 满体瓶×maxStamina + 30体瓶×30 + 20体瓶×20 + 10体瓶×10
     */
    staminaFromBottles: computed(
      (): number =>
        (form.value.staminaMaxBottleCount ?? 0) * result.currentMaxStamina +
        (form.value.stamina30BottleCount ?? 0) * 30 +
        (form.value.stamina20BottleCount ?? 0) * 20 +
        (form.value.stamina10BottleCount ?? 0) * 10,
    ),

    /**
     * 步骤4-3：每日任务提供的体力
     * @formula (2 × maxStamina + 10 × 30) × 剩余天数
     * @description (每日回满次数 × maxStamina + 每日30体瓶 × 30) × 剩余天数
     */
    staminaFromDaily: computed(
      (): number =>
        (MLTD.dailyMaxStaminaBonusCount * result.currentMaxStamina +
          MLTD.dailyStamina30BottleCount * 30) *
        (form.value.freeTokenClaimCount ?? 0),
    ),

    /**
     * 步骤2：还需要获得的pt
     * @formula targetPt - currentPt - ptFromBoost - ptFromFreeTokens - ptFromRemainingTokens
     * @description 目标pt - 当前pt - 火攒道具贡献pt（双倍道具） - 白给pt - 现有道具pt
     */
    ptNeeded: computed((): number => {
      const needed =
        (form.value.targetPt ?? 0) -
        (form.value.pt ?? 0) -
        (result.ptFromBoost + result.ptFromFreeTokens + result.ptFromRemainingTokens);
      return needed && needed > 0 ? needed : 0;
    }),

    /**
     * 超出目标pt的数量
     * @formula currentPt + ptFromBoost + ptFromFreeTokens + ptFromRemainingTokens - targetPt
     * @description 当使用全部"火"道具后实际获得的pt超过目标时的超出数量
     */
    ptExceeded: computed((): number => {
      const total =
        (form.value.pt ?? 0) +
        result.ptFromBoost +
        result.ptFromFreeTokens +
        result.ptFromRemainingTokens;
      const exceeded = total - (form.value.targetPt ?? 0);
      return exceeded > 0 ? exceeded : 0;
    }),

    /**
     * 步骤3-1：还需要体力
     * @formula ptNeeded / 每体力产出pt效率
     * @description 每体力效率 = (1071 + 1071×2148/720) / 450 ≈ 9.48
     */
    staminaNeeded: computed((): number => {
      return Math.ceil(
        result.ptNeeded *
          (MLTD.staminaCostForTokenAccumulate /
            (MLTD.tokensPerAccumulatePlay +
              (MLTD.tokensPerAccumulatePlay / MLTD.tokensPerConsumePlay) * MLTD.ptPerConsumePlay)),
      );
    }),

    /**
     * 步骤3-2：还需要获取道具
     * @formula staminaNeeded / 450 × 1071
     */
    tokensNeeded: computed((): number => {
      return Math.ceil(
        (result.staminaNeeded / MLTD.staminaCostForTokenAccumulate) * MLTD.tokensPerAccumulatePlay,
      );
    }),

    /**
     * 步骤5：需要钻石数
     * @formula (staminaNeeded + staminaForBoost - staminaRecovered - staminaFromBottles - staminaFromDaily) / maxStamina × 50
     * @description (总需求体力 + 火攒道具消耗体力（无双倍效果） - 自然恢复 - 体力瓶 - 每日任务) / 最大体力 × 50
     */
    jewelNeeded: computed((): number => {
      const res = Math.ceil(
        ((result.staminaNeeded +
          result.staminaForBoost -
          result.staminaRecovered -
          result.staminaFromBottles -
          result.staminaFromDaily) /
          result.currentMaxStamina) *
          MLTD.jewelPerFullStamina,
      );
      return res > 0 ? res : 0;
    }),

    /**
     * 步骤6-1：火攒道具游玩次数
     * @formula boostCount × 10
     * @description 每个火可进行10次双倍道具攒取
     */
    boostPlays: computed(
      (): number => (form.value.boostCount ?? 0) * MLTD.boostAccumulatePlaysPerBoostItem || 0,
    ),

    /**
     * 步骤6-2：普通攒道具次数
     * @formula staminaNeeded / 450
     */
    tokenAccumulatePlays: computed(
      (): number => Math.ceil(result.staminaNeeded / MLTD.staminaCostForTokenAccumulate) || 0,
    ),

    /**
     * 步骤6-3：清道具次数
     * @formula (tokens + boostCount×(1071×2)×10 + freeTokenClaimCount×4540 + tokensNeeded) / 720
     * @description (现有道具 + 火攒道具获得双倍道具 + 白给道具 + 还需道具) / 720
     */
    tokenConsumePlays: computed(
      (): number =>
        Math.ceil(
          ((form.value.tokens ?? 0) +
            (form.value.boostCount ?? 0) *
              MLTD.tokensPerAccumulatePlay *
              2 *
              MLTD.boostAccumulatePlaysPerBoostItem +
            (form.value.freeTokenClaimCount ?? 0) * MLTD.dailyFreeTokens +
            result.tokensNeeded) /
            MLTD.tokensPerConsumePlay,
        ) || 0,
    ),

    /**
     * 步骤6-4：火攒道具模式时间
     * @formula boostPlays × tokenAccumulateTime
     */
    boostTimeSpent: computed(
      (): number => result.boostPlays * (form.value.tokenAccumulateTime ?? 0),
    ),

    /**
     * 步骤6-4：普通攒道具时间
     * @formula tokenAccumulatePlays × tokenAccumulateTime
     */
    tokenAccumulateTimeSpent: computed(
      (): number => result.tokenAccumulatePlays * (form.value.tokenAccumulateTime ?? 0),
    ),

    /**
     * 步骤6-4：清道具时间
     * @formula tokenConsumePlays × tokenConsumeTime
     */
    tokenConsumeTimeSpent: computed(
      (): number => result.tokenConsumePlays * (form.value.tokenConsumeTime ?? 0),
    ),

    /**
     * 步骤6-4：总时间
     * @formula boostTimeSpent + tokenAccumulateTimeSpent + tokenConsumeTimeSpent
     */
    totalTimeSpent: computed(
      (): number =>
        result.boostTimeSpent + result.tokenAccumulateTimeSpent + result.tokenConsumeTimeSpent,
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
      form.value.remainingTime > MLTD.eventTotalDays
        ? MLTD.eventTotalDays
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
      form.value.freeTokenClaimCount = form.value.boostCount;
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
