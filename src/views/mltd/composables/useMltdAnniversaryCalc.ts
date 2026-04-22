/**
 * 周年活动计算器状态管理组合式函数
 * 统一管理表单状态、计算结果和本地存储操作
 *
 * 完整数据流：
 *
 * 输入参数
 * ├── 活动目标：目标pt、结束时间
 * ├── 当前状态：等级、当前pt、当前道具
 * ├── 资源状况：火数量、赠送道具次数、体力瓶数量
 * └── 时间设置：攒道具时间、清道具时间
 *
 * 计算流程
 * ├── 步骤1：计算推荐歌曲相关（最低攒道具次数限制）
 * ├── 步骤2：计算固定来源pt（登录赠送 + 推荐歌曲赠送 + 现有道具）
 * ├── 步骤3：计算推荐歌曲贡献pt（用火 + 不用火）
 * ├── 步骤4：计算还需要pt和最优火攒道具次数
 * ├── 步骤5：计算普通攒道具次数
 * ├── 步骤6：计算所需资源（体力、道具）
 * ├── 步骤7：计算可用资源（自然恢复、体力瓶、每日任务）
 * ├── 步骤8：计算钻石需求
 * └── 步骤9：计算时间和次数
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
  const f = computed(() => form.value.freeTokenClaimCount ?? 0);
  const b = computed(() => form.value.boostCount ?? 0);

  const result = reactive({
    /**
     * 步骤1-1：最低攒道具次数（推荐歌曲游玩次数）
     * @formula freeTokenClaimCount × 4
     * @description 每天需要游玩4首推荐歌曲各一次
     */
    minTokenAccumulatePlays: computed((): number => f.value * MLTD.dailyRecommendedSongCount),

    /**
     * 步骤1-2：推荐歌曲用火次数
     * @formula min(f×4, b×4)
     * @description 每个火最多可用于4次推荐歌曲
     */
    recommendedSongBoostPlays: computed((): number =>
      Math.min(
        f.value * MLTD.dailyRecommendedSongCount,
        b.value * MLTD.boostPlaysPerBoostItemForRecommendedSongs,
      ),
    ),

    /**
     * 步骤1-3：推荐歌曲不用火次数
     * @formula max(0, f×4 - b×4)
     * @description 当火不足以覆盖所有推荐歌曲时，剩余次数不用火
     */
    recommendedSongNonBoostPlays: computed((): number =>
      Math.max(
        0,
        f.value * MLTD.dailyRecommendedSongCount -
          b.value * MLTD.boostPlaysPerBoostItemForRecommendedSongs,
      ),
    ),

    /**
     * 步骤1-4：剩余火使用次数（可用于火攒道具）
     * @formula b×10 - recommendedSongBoostPlays
     * @description 推荐歌曲消耗火次数后，剩余可用于普通火攒道具
     */
    remainingBoostPlays: computed(
      (): number => b.value * MLTD.boostPlaysPerBoostItem - result.recommendedSongBoostPlays,
    ),

    /**
     * 步骤1-5：推荐歌曲消耗体力
     * @formula minTokenAccumulatePlays × 450
     * @description 推荐歌曲游玩消耗的体力（必须完成）
     */
    staminaForRecommendedSongs: computed(
      (): number => result.minTokenAccumulatePlays * MLTD.staminaCostForTokenAccumulate,
    ),

    /**
     * 步骤2-1：登录赠送道具
     * @formula f × 540
     * @description 每日登录活动界面获得的道具
     */
    tokensFromLogin: computed((): number => f.value * MLTD.dailyLoginTokens),

    /**
     * 步骤2-2：推荐歌曲赠送奖励道具
     * @formula f × 4000
     * @description 每日游玩4首推荐歌曲获得的额外奖励道具（无论用不用火都获得）
     */
    tokensFromRecommendedBonus: computed(
      (): number => f.value * MLTD.dailyRecommendedSongsBonusTokens,
    ),

    /**
     * 步骤2-3：推荐歌曲用火获得道具
     * @formula recommendedSongBoostPlays × 2142
     * @description 推荐歌曲用火游玩时，获得双倍普通道具（不含赠送奖励）
     */
    tokensFromRecommendedBoost: computed(
      (): number => result.recommendedSongBoostPlays * MLTD.tokensPerBoostAccumulatePlay,
    ),

    /**
     * 步骤2-4：推荐歌曲不用火获得道具
     * @formula recommendedSongNonBoostPlays × 1071
     * @description 推荐歌曲不用火游玩时，获得普通道具
     */
    tokensFromRecommendedNonBoost: computed(
      (): number => result.recommendedSongNonBoostPlays * MLTD.tokensPerAccumulatePlay,
    ),

    /**
     * 步骤2-5：现有道具
     */
    tokensFromRemaining: computed((): number => form.value.tokens ?? 0),

    /**
     * 步骤2-6：登录赠送道具贡献pt
     * @formula tokensFromLogin × (2148/720)
     */
    ptFromLogin: computed(
      (): number => Math.floor(result.tokensFromLogin * MLTD.tokenToPtRatio) || 0,
    ),

    /**
     * 步骤2-7：推荐歌曲赠送奖励贡献pt
     * @formula tokensFromRecommendedBonus × (2148/720)
     */
    ptFromRecommendedBonus: computed(
      (): number => Math.floor(result.tokensFromRecommendedBonus * MLTD.tokenToPtRatio) || 0,
    ),

    /**
     * 步骤2-8：推荐歌曲用火道具贡献pt
     * @formula tokensFromRecommendedBoost × (2148/720)
     */
    ptFromRecommendedBoost: computed(
      (): number => Math.floor(result.tokensFromRecommendedBoost * MLTD.tokenToPtRatio) || 0,
    ),

    /**
     * 步骤2-9：推荐歌曲不用火道具贡献pt
     * @formula tokensFromRecommendedNonBoost × (2148/720)
     */
    ptFromRecommendedNonBoost: computed(
      (): number => Math.floor(result.tokensFromRecommendedNonBoost * MLTD.tokenToPtRatio) || 0,
    ),

    /**
     * 步骤2-10：现有道具贡献pt
     * @formula tokens × (2148/720)
     */
    ptFromRemainingTokens: computed(
      (): number => Math.floor((form.value.tokens ?? 0) * MLTD.tokenToPtRatio) || 0,
    ),

    /**
     * 步骤2-11：固定来源pt合计
     * @formula ptFromLogin + ptFromRecommendedBonus + ptFromRemainingTokens
     * @description 登录赠送 + 推荐歌曲赠送奖励 + 现有道具（不含推荐歌曲的普通道具部分）
     */
    ptFromFixedSources: computed(
      (): number =>
        result.ptFromLogin + result.ptFromRecommendedBonus + result.ptFromRemainingTokens,
    ),

    /**
     * 步骤3-1：推荐歌曲贡献pt合计（普通道具部分）
     * @formula ptFromRecommendedBoost + ptFromRecommendedNonBoost
     * @description 推荐歌曲游玩获得的普通道具转pt
     */
    ptFromRecommendedSongs: computed(
      (): number => result.ptFromRecommendedBoost + result.ptFromRecommendedNonBoost,
    ),

    /**
     * 步骤3-2：已确定来源的pt合计
     * @formula ptFromFixedSources + ptFromRecommendedSongs
     * @description 固定来源 + 推荐歌曲普通道具
     */
    ptFromConfirmedSources: computed(
      (): number => result.ptFromFixedSources + result.ptFromRecommendedSongs,
    ),

    /**
     * 辅助计算：根据等级计算最大体力
     * @description 默认返回60
     */
    currentMaxStamina: computed((): number => {
      if (!form.value.plv) return 60;
      const { levelToMaxStamina } = useMltdUtils();
      return levelToMaxStamina(form.value.plv) || 60;
    }),

    /**
     * 步骤4-1：还需要获得的pt（目标 - 当前 - 已确定来源）
     */
    ptStillNeeded: computed((): number => {
      const needed =
        (form.value.targetPt ?? 0) - (form.value.pt ?? 0) - result.ptFromConfirmedSources;
      return needed > 0 ? needed : 0;
    }),

    /**
     * 步骤4-2：最优火攒道具次数
     * @formula ceil(ptStillNeeded / ptPerBoostPlay) 限制不超过剩余火使用次数
     * @description 使用剩余火使用次数进行火攒道具
     */
    optimalBoostAccumulatePlays: computed((): number => {
      if (result.ptStillNeeded <= 0) return 0;
      const neededPlays = Math.ceil(result.ptStillNeeded / MLTD.ptPerBoostPlay);
      return Math.min(neededPlays, result.remainingBoostPlays);
    }),

    /**
     * 步骤4-3：火攒道具贡献pt
     * @formula optimalBoostAccumulatePlays × ptPerBoostPlay
     */
    ptFromBoostAccumulate: computed(
      (): number => Math.floor(result.optimalBoostAccumulatePlays * MLTD.ptPerBoostPlay) || 0,
    ),

    /**
     * 步骤4-4：火攒道具消耗体力
     * @formula optimalBoostAccumulatePlays × 450（每次游玩消耗450体力）
     */
    staminaForBoostAccumulate: computed(
      (): number => result.optimalBoostAccumulatePlays * MLTD.staminaCostForTokenAccumulate || 0,
    ),

    /**
     * 步骤5-1：使用火后还需要获得的pt
     * @formula ptStillNeeded - ptFromBoostAccumulate
     */
    ptNeededAfterBoost: computed((): number => {
      const needed = result.ptStillNeeded - result.ptFromBoostAccumulate;
      return needed > 0 ? needed : 0;
    }),

    /**
     * 步骤5-2：普通攒道具每次贡献pt
     * @formula 1071 × (1 + 2148/720) ≈ 4267
     * @description 每次普通攒道具获得道具 + 道具转pt
     */
    ptPerNormalAccumulatePlay: computed(
      (): number => MLTD.tokensPerAccumulatePlay * (1 + MLTD.tokenToPtRatio),
    ),

    /**
     * 步骤5-3：普通攒道具次数
     * @formula ceil(ptNeededAfterBoost / ptPerNormalAccumulatePlay)
     * @description 火攒道具后还需要普通攒道具的次数
     */
    normalAccumulatePlays: computed((): number => {
      if (result.ptNeededAfterBoost <= 0) return 0;
      return Math.ceil(result.ptNeededAfterBoost / result.ptPerNormalAccumulatePlay);
    }),

    /**
     * 步骤5-4：普通攒道具贡献pt
     * @formula normalAccumulatePlays × ptPerNormalAccumulatePlay
     */
    ptFromNormalAccumulate: computed(
      (): number =>
        Math.floor(result.normalAccumulatePlays * result.ptPerNormalAccumulatePlay) || 0,
    ),

    /**
     * 步骤5-5：普通攒道具消耗体力
     * @formula normalAccumulatePlays × 450（每次游玩消耗450体力）
     */
    staminaForNormalAccumulate: computed(
      (): number => result.normalAccumulatePlays * MLTD.staminaCostForTokenAccumulate || 0,
    ),

    /**
     * 步骤2：还需要获得的pt（汇总）
     * @formula targetPt - currentPt - ptFromBoostAccumulate - ptFromConfirmedSources
     */
    ptNeeded: computed((): number => {
      const needed =
        (form.value.targetPt ?? 0) -
        (form.value.pt ?? 0) -
        (result.ptFromBoostAccumulate + result.ptFromConfirmedSources);
      return needed && needed > 0 ? needed : 0;
    }),

    /**
     * 超出目标pt的数量
     * @formula currentPt + ptFromBoostAccumulate + ptFromConfirmedSources - targetPt
     */
    ptExceeded: computed((): number => {
      const total =
        (form.value.pt ?? 0) + result.ptFromBoostAccumulate + result.ptFromConfirmedSources;
      const exceeded = total - (form.value.targetPt ?? 0);
      return exceeded > 0 ? exceeded : 0;
    }),

    /**
     * 步骤6-1：火攒道具游玩次数汇总
     * @formula recommendedSongBoostPlays + optimalBoostAccumulatePlays
     */
    boostPlays: computed(
      (): number => result.recommendedSongBoostPlays + result.optimalBoostAccumulatePlays,
    ),

    /**
     * 步骤6-2：总攒道具次数
     * @formula minTokenAccumulatePlays + optimalBoostAccumulatePlays + normalAccumulatePlays
     * @description 推荐歌曲 + 火攒道具 + 普通攒道具
     */
    totalTokenAccumulatePlays: computed(
      (): number =>
        result.minTokenAccumulatePlays +
        result.optimalBoostAccumulatePlays +
        result.normalAccumulatePlays,
    ),

    /**
     * 步骤6-3：总清道具次数
     * @formula (tokens + 所有来源道具) / 720
     */
    tokenConsumePlays: computed((): number => {
      const totalTokens =
        (form.value.tokens ?? 0) +
        result.tokensFromLogin +
        result.tokensFromRecommendedBonus +
        result.tokensFromRecommendedBoost +
        result.tokensFromRecommendedNonBoost +
        result.optimalBoostAccumulatePlays * MLTD.tokensPerBoostAccumulatePlay +
        result.normalAccumulatePlays * MLTD.tokensPerAccumulatePlay;
      return Math.ceil(totalTokens / MLTD.tokensPerConsumePlay) || 0;
    }),

    /**
     * 步骤7-1：总消耗体力
     * @formula staminaForRecommendedSongs + staminaForBoostAccumulate + staminaForNormalAccumulate
     */
    totalStaminaNeeded: computed(
      (): number =>
        result.staminaForRecommendedSongs +
        result.staminaForBoostAccumulate +
        result.staminaForNormalAccumulate,
    ),

    /**
     * 步骤7-2：自然回复体力
     * @formula remainingTime × 288
     */
    staminaRecovered: computed(
      (): number => Math.floor((form.value.remainingTime ?? 0) * MLTD.staminaRecoverPerDay) || 0,
    ),

    /**
     * 步骤7-3：体力瓶提供的体力
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
     * 步骤7-4：每日任务提供的体力
     * @formula (2 × maxStamina + 10 × 30) × freeTokenClaimCount
     */
    staminaFromDaily: computed(
      (): number =>
        (MLTD.dailyMaxStaminaBonusCount * result.currentMaxStamina +
          MLTD.dailyStamina30BottleCount * 30) *
        f.value,
    ),

    /**
     * 步骤8：需要钻石数
     * @formula (totalStaminaNeeded - staminaRecovered - staminaFromBottles - staminaFromDaily) / maxStamina × 50
     */
    jewelNeeded: computed((): number => {
      const res = Math.ceil(
        ((result.totalStaminaNeeded -
          result.staminaRecovered -
          result.staminaFromBottles -
          result.staminaFromDaily) /
          result.currentMaxStamina) *
          MLTD.jewelPerFullStamina,
      );
      return res > 0 ? res : 0;
    }),

    /**
     * 步骤9-1：火攒道具模式时间
     * @formula boostPlays × tokenAccumulateTime
     */
    boostTimeSpent: computed(
      (): number => result.boostPlays * (form.value.tokenAccumulateTime ?? 0),
    ),

    /**
     * 步骤9-2：普通攒道具时间
     * @formula normalAccumulatePlays × tokenAccumulateTime
     */
    normalAccumulateTimeSpent: computed(
      (): number => result.normalAccumulatePlays * (form.value.tokenAccumulateTime ?? 0),
    ),

    /**
     * 步骤9-3：清道具时间
     * @formula tokenConsumePlays × tokenConsumeTime
     */
    tokenConsumeTimeSpent: computed(
      (): number => result.tokenConsumePlays * (form.value.tokenConsumeTime ?? 0),
    ),

    /**
     * 步骤9-4：总时间
     * @formula boostTimeSpent + normalAccumulateTimeSpent + tokenConsumeTimeSpent
     */
    totalTimeSpent: computed(
      (): number =>
        result.boostTimeSpent + result.normalAccumulateTimeSpent + result.tokenConsumeTimeSpent,
    ),
  });

  /**
   * 重置当前剩余时间
   * @returns 计算后的剩余天数
   */
  const resetCurrentRemainingTime = (): number => {
    const remainingTime = Number(
      ((form.value.eventEndTime.getTime() - new Date().getTime()) / (1000 * 3600 * 24)).toFixed(3),
    );
    form.value.remainingTime = remainingTime > 0 ? remainingTime : 0;
    form.value.remainingTime =
      form.value.remainingTime > MLTD.eventTotalDays
        ? MLTD.eventTotalDays
        : form.value.remainingTime;
    return form.value.remainingTime;
  };

  /**
   * 根据剩余时间设置火数量和赠送道具次数
   */
  const setBoostFromRemainingTime = () => {
    if (form.value.remainingTime && form.value.remainingTime > 0) {
      form.value.boostCount = Math.floor(form.value.remainingTime);
      form.value.freeTokenClaimCount = form.value.boostCount;
    }
  };

  /**
   * 保存表单数据到本地存储
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
   */
  const loadFromLocalStorage = (): boolean => {
    try {
      const formFromLocal = localStorage.getItem(STORAGE_KEY);
      if (!formFromLocal) return false;
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
   */
  const getExportData = (): string => {
    return JSON.stringify({
      ...form.value,
      eventEndTime: form.value.eventEndTime.toISOString(),
    });
  };

  /**
   * 从JSON字符串导入数据
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
