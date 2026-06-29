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
 * ├── 步骤1：计算固定来源道具（登录赠送 + 推荐歌曲赠送 + 现有道具）
 * ├── 步骤2：计算火使用总数和最优分配
 * ├── 步骤3：计算火攒道具、火清道具的直接pt贡献
 * ├── 步骤4：迭代计算普通攒道具次数（含清道具pt）
 * ├── 步骤5：计算普通清道具次数和pt
 * ├── 步骤6：计算所需资源（体力）
 * ├── 步骤7：计算可用资源（自然恢复、体力瓶、每日任务）
 * ├── 步骤8：计算钻石需求
 * └── 步骤9：计算时间和次数
 */

import { reactive, computed, type Ref } from 'vue';

import { MLTD_ANNIVERSARY_CONSTANTS as MLTD } from '../data/MltdAnniversaryConstant';
import type { AnniversaryForm, AnniversaryResult, BoostAllocationResult } from '../utils/MltdTypes';
import { levelToMaxStamina } from '../utils/MltdUtils';

const STORAGE_KEY = 'mltd-anni';

interface PtWithoutNormalAccumulateResult {
  totalPt: number;
  boostConsumePlays: number;
  normalConsumePlays: number;
  remainingTokens: number;
  unusedBoostPlays: number;
}

/**
 * 计算给定火攒次数下，不进行普通攒道具时的总PT
 *
 * @param boostAccumulatePlays - 火攒道具次数
 * @param totalBoostPlays - 总火使用次数
 * @param availableTokens - 可用道具
 * @param ptNeeded - 还需要获得的PT
 * @returns 总PT及相关信息，不可行返回 totalPt=-1
 */
function calculatePtWithoutNormalAccumulate(
  boostAccumulatePlays: number,
  totalBoostPlays: number,
  availableTokens: number,
  ptNeeded: number,
): PtWithoutNormalAccumulateResult {
  const ptFromBoostAccumulate = boostAccumulatePlays * MLTD.ptPerBoostAccumulatePlay;
  const totalTokens = availableTokens + boostAccumulatePlays * MLTD.tokensPerBoostAccumulatePlay;

  const ptNeededAfterAccumulate = Math.max(0, ptNeeded - ptFromBoostAccumulate);
  const minConsumePlaysNeeded = Math.ceil(ptNeededAfterAccumulate / MLTD.ptPerBoostConsumePlay);
  const maxConsumeFromTokens = Math.floor(totalTokens / MLTD.tokensPerConsumePlay);
  const boostConsumePlays = Math.max(
    0,
    Math.min(
      Math.max(minConsumePlaysNeeded, maxConsumeFromTokens),
      totalBoostPlays - boostAccumulatePlays,
    ),
  );
  const unusedBoostPlays = totalBoostPlays - boostAccumulatePlays - boostConsumePlays;

  if (totalTokens < boostConsumePlays * MLTD.tokensPerConsumePlay) {
    return {
      totalPt: -1,
      boostConsumePlays,
      normalConsumePlays: 0,
      remainingTokens: totalTokens,
      unusedBoostPlays,
    };
  }

  const remainingTokens = totalTokens - boostConsumePlays * MLTD.tokensPerConsumePlay;
  const normalConsumePlays = Math.floor(remainingTokens / MLTD.tokensPerConsumePlay);
  const tokensAfterNormalConsume = remainingTokens - normalConsumePlays * MLTD.tokensPerConsumePlay;

  const ptFromBoost = ptFromBoostAccumulate + boostConsumePlays * MLTD.ptPerBoostConsumePlay;
  const ptFromNormalConsume = normalConsumePlays * MLTD.ptPerConsumePlay;
  const totalPt = ptFromBoost + ptFromNormalConsume;

  return {
    totalPt,
    boostConsumePlays,
    normalConsumePlays,
    remainingTokens: tokensAfterNormalConsume,
    unusedBoostPlays,
  };
}

/**
 * 计算最优火分配（火攒道具次数 + 火清道具次数）
 *
 * 最优化目标：在不进行普通攒道具的前提下，找到能满足目标PT的最小火攒次数
 *
 * 算法原理（二分搜索）：
 * - 火攒次数增加 → 总PT单调递增（每增加1次约+4290pt）
 * - 可行区域起点：minX = ceil((720N - T) / 2862)
 * - 使用二分搜索找满足条件的最小火攒次数
 * - 火清次数根据实际PT需求动态计算，不超过剩余火次数
 *
 * @param ptNeeded - 还需要获得的PT
 * @param totalBoostPlaysAvailable - 总火使用次数（b×10，最大130）
 * @param availableTokens - 可用道具（现有+即将获得，不含火攒道具贡献）
 * @returns 最优火攒道具次数、火清道具次数和未使用火次数
 */
function calculateOptimalBoostAllocation(
  ptNeeded: number,
  totalBoostPlaysAvailable: number,
  availableTokens: number,
): BoostAllocationResult {
  const totalBoostPlays = totalBoostPlaysAvailable;
  const tokens = availableTokens;

  let lo = 0;
  let hi = totalBoostPlays;

  if (ptNeeded <= 0 || totalBoostPlaysAvailable <= 0) {
    hi = 0;
  }

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const result = calculatePtWithoutNormalAccumulate(mid, totalBoostPlays, tokens, ptNeeded);

    if (result.totalPt < 0) {
      lo = mid + 1;
      continue;
    }

    if (result.totalPt >= ptNeeded) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  const finalResult = calculatePtWithoutNormalAccumulate(lo, totalBoostPlays, tokens, ptNeeded);
  return {
    totalBoostAccumulate: lo,
    boostConsume: finalResult.boostConsumePlays,
    unusedBoostPlays: finalResult.unusedBoostPlays,
  };
}

/**
 * 使用二分搜索计算普通攒道具次数
 *
 * 算法原理：
 * - 每次普通攒道具获得 1071pt + 1071道具
 * - 道具可用于清道具获得额外 2148pt/次
 * - PT随攒次数单调递增，可用二分搜索
 *
 * 计算逻辑：
 * - totalTokens = availableTokens + z * 1071
 * - totalConsumePlays = floor(totalTokens / 720)
 * - normalConsumePlays = max(0, totalConsumePlays - boostConsumePlays)
 * - totalPt = z * 1071 + normalConsumePlays * 2148
 *
 * @param ptNeeded - 还需要获得的PT（火贡献后）
 * @param availableTokens - 可用道具（固定来源 + 火攒道具贡献）
 * @param boostConsumePlays - 火清道具次数（优先占用道具）
 * @returns 最小普通攒道具次数
 */
function calculateNormalAccumulatePlays(
  ptNeeded: number,
  availableTokens: number,
  boostConsumePlays: number,
): number {
  const tokensNeededForBoostConsume = boostConsumePlays * MLTD.tokensPerConsumePlay;
  const minAccumulateForBoostConsume =
    availableTokens >= tokensNeededForBoostConsume
      ? 0
      : Math.ceil((tokensNeededForBoostConsume - availableTokens) / MLTD.tokensPerAccumulatePlay);

  if (ptNeeded <= 0) {
    return minAccumulateForBoostConsume;
  }

  const baseTokens = availableTokens + minAccumulateForBoostConsume * MLTD.tokensPerAccumulatePlay;
  const upperBound = Math.ceil(ptNeeded / MLTD.ptPerAccumulatePlay) + 1;
  let lo = 0;
  let hi = upperBound;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const totalTokens = baseTokens + mid * MLTD.tokensPerAccumulatePlay;
    const totalConsumePlays = Math.floor(totalTokens / MLTD.tokensPerConsumePlay);
    const normalConsumePlays = Math.max(0, totalConsumePlays - boostConsumePlays);
    const totalPt =
      (minAccumulateForBoostConsume + mid) * MLTD.ptPerAccumulatePlay +
      normalConsumePlays * MLTD.ptPerConsumePlay;

    if (totalPt >= ptNeeded) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return minAccumulateForBoostConsume + lo;
}

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
  boostCount: 13,
  freeTokenClaimCount: 13,
  staminaMaxBottleCount: 0,
  stamina30BottleCount: 0,
  stamina20BottleCount: 0,
  stamina10BottleCount: 0,
  tokenAccumulateTime: 6.5,
  tokenConsumeTime: 3,
  remainingTime: 0,
  userTotalBoostAccumulatePlays: undefined,
  userBoostConsumePlays: undefined,
  useAutoOptimize: true,
});

/**
 * 周年活动计算器组合式函数
 * @param form - 表单数据引用
 * @returns 计算结果和操作方法
 */
export function useMltdAnniversaryCalc(form: Ref<AnniversaryForm>) {
  const f = computed(() => form.value.freeTokenClaimCount || 0);
  const b = computed(() => form.value.boostCount || 0);

  const result = reactive<AnniversaryResult>({
    /**
     * 步骤1-1：登录赠送道具
     * @formula f × 540
     * @description 每日登录活动界面获得的道具
     */
    tokensFromLogin: computed((): number => f.value * MLTD.dailyLoginTokens),

    /**
     * 步骤1-2：推荐歌曲赠送奖励道具
     * @formula f × 4000
     * @description 每日游玩4首推荐歌曲获得的额外奖励道具（假设用户会游玩）
     */
    tokensFromRecommendedBonus: computed(
      (): number => f.value * MLTD.dailyRecommendedSongsBonusTokens,
    ),

    /**
     * 步骤1-3：现有道具
     */
    tokensFromRemaining: computed((): number => form.value.tokens || 0),

    /**
     * 步骤1-4：固定来源道具总和
     * @formula tokens + tokensFromLogin + tokensFromRecommendedBonus
     * @description 现有道具 + 登录赠送 + 推荐歌曲赠送
     */
    tokensFromFixedSources: computed(
      (): number =>
        (form.value.tokens || 0) + result.tokensFromLogin + result.tokensFromRecommendedBonus,
    ),

    /**
     * 辅助计算：根据等级计算最大体力
     * @description 默认返回60
     */
    currentMaxStamina: computed((): number => {
      const plv = form.value.plv || 0;
      if (!plv) return 60;
      return levelToMaxStamina(plv) || 60;
    }),

    /**
     * 步骤2-1：还需要获得的pt（目标 - 当前）
     * @description 不含固定来源道具贡献的pt（道具需通过清道具获得pt）
     */
    ptStillNeeded: computed((): number => {
      const needed = (form.value.targetPt || 0) - (form.value.pt || 0);
      return needed > 0 ? needed : 0;
    }),

    /**
     * 步骤2-2：火分配前的可用道具
     * @formula tokensFromFixedSources
     * @description 用于计算火清道具的道具上限
     */
    tokensAvailableBeforeBoostAllocation: computed((): number => result.tokensFromFixedSources),

    /**
     * 步骤2-3：总火使用次数
     * @formula boostCount × 10
     * @description 每个火可用于10次游玩
     */
    totalBoostPlaysAvailable: computed((): number => b.value * MLTD.boostPlaysPerBoostItem),

    /**
     * 步骤2-4：最优火分配结果
     * @description 根据目标PT和道具情况，计算最优的火攒道具次数和火清道具次数
     */
    optimalBoostAllocation: computed(
      (): BoostAllocationResult =>
        calculateOptimalBoostAllocation(
          result.ptStillNeeded,
          result.totalBoostPlaysAvailable,
          result.tokensAvailableBeforeBoostAllocation,
        ),
    ),

    /**
     * 步骤2-5：是否使用自动优化模式
     * @description true时使用算法计算最优分配，false时使用用户自定义值
     */
    useAutoOptimize: computed((): boolean => form.value.useAutoOptimize ?? true),

    /**
     * 步骤2-6：最优火攒道具次数
     * @formula optimalBoostAllocation.totalBoostAccumulate
     */
    optimalTotalBoostAccumulatePlays: computed(
      (): number => result.optimalBoostAllocation.totalBoostAccumulate,
    ),

    /**
     * 步骤2-7：最优火清道具次数
     * @formula optimalBoostAllocation.boostConsume
     */
    optimalBoostConsumePlays: computed((): number => result.optimalBoostAllocation.boostConsume),

    /**
     * 步骤2-7a：最优未使用火次数
     * @formula optimalBoostAllocation.unusedBoostPlays
     * @description 当PT需求较少时，不需要用完全部火，节省的火次数
     */
    optimalUnusedBoostPlays: computed((): number => result.optimalBoostAllocation.unusedBoostPlays),

    /**
     * 步骤2-8：实际火攒道具次数
     * @description 自动优化时使用最优值，否则使用用户自定义值
     */
    totalBoostAccumulatePlays: computed((): number => {
      if (result.useAutoOptimize) {
        return result.optimalTotalBoostAccumulatePlays;
      }
      return form.value.userTotalBoostAccumulatePlays || 0;
    }),

    /**
     * 步骤2-9：实际火清道具次数
     * @description 自动优化时使用最优值，否则使用用户自定义值
     */
    boostConsumePlays: computed((): number => {
      if (result.useAutoOptimize) {
        return result.optimalBoostConsumePlays;
      }
      return form.value.userBoostConsumePlays || 0;
    }),

    /**
     * 步骤3-1：火攒道具直接获得pt
     * @formula totalBoostAccumulatePlays × 2142
     */
    ptFromBoostAccumulate: computed(
      (): number => result.totalBoostAccumulatePlays * MLTD.ptPerBoostAccumulatePlay,
    ),

    /**
     * 步骤3-2：火清道具获得pt
     * @formula boostConsumePlays × 4296
     * @description 火清道具不消耗体力，消耗720道具获得4296pt
     */
    ptFromBoostConsume: computed(
      (): number => result.boostConsumePlays * MLTD.ptPerBoostConsumePlay,
    ),

    /**
     * 步骤3-3：火攒道具获得道具数
     * @formula totalBoostAccumulatePlays × 2142
     */
    tokensFromBoostAccumulate: computed(
      (): number => result.totalBoostAccumulatePlays * MLTD.tokensPerBoostAccumulatePlay,
    ),

    /**
     * 步骤3-4：火清道具消耗道具数
     * @formula boostConsumePlays × 720
     */
    tokensConsumedByBoost: computed(
      (): number => result.boostConsumePlays * MLTD.tokensPerConsumePlay,
    ),

    /**
     * 步骤3-5：火攒道具消耗体力
     * @formula totalBoostAccumulatePlays × 450
     */
    staminaForBoostAccumulate: computed(
      (): number => result.totalBoostAccumulatePlays * MLTD.staminaCostForBoostAccumulate,
    ),

    /**
     * 步骤4-1：火攒道具和火清道具的直接pt合计
     * @formula ptFromBoostAccumulate + ptFromBoostConsume
     */
    ptFromBoostSources: computed(
      (): number => result.ptFromBoostAccumulate + result.ptFromBoostConsume,
    ),

    /**
     * 步骤4-2：使用火后还需要获得的pt
     * @formula ptStillNeeded - ptFromBoostSources
     */
    ptNeededAfterBoost: computed((): number => {
      const needed = result.ptStillNeeded - result.ptFromBoostSources;
      return needed > 0 ? needed : 0;
    }),

    /**
     * 步骤4-3：迭代计算普通攒道具次数
     * @description 每次攒道具获得1071pt+1071道具，道具可用于清道具获得额外pt
     */
    normalAccumulatePlays: computed((): number => {
      const availableTokens = result.tokensFromFixedSources + result.tokensFromBoostAccumulate;
      return calculateNormalAccumulatePlays(
        result.ptNeededAfterBoost,
        availableTokens,
        result.boostConsumePlays,
      );
    }),

    /**
     * 步骤4-4：普通攒道具直接获得pt
     * @formula normalAccumulatePlays × 1071
     */
    ptFromNormalAccumulate: computed(
      (): number => result.normalAccumulatePlays * MLTD.ptPerAccumulatePlay,
    ),

    /**
     * 步骤4-5：普通攒道具获得道具数
     * @formula normalAccumulatePlays × 1071
     */
    tokensFromNormalAccumulate: computed(
      (): number => result.normalAccumulatePlays * MLTD.tokensPerAccumulatePlay,
    ),

    /**
     * 步骤4-6：普通攒道具消耗体力
     * @formula normalAccumulatePlays × 450
     */
    staminaForNormalAccumulate: computed(
      (): number => result.normalAccumulatePlays * MLTD.staminaCostForTokenAccumulate,
    ),

    /**
     * 步骤5-1：总道具数
     * @formula tokensFromFixedSources + tokensFromBoostAccumulate + tokensFromNormalAccumulate
     */
    totalTokensAllSources: computed(
      (): number =>
        result.tokensFromFixedSources +
        result.tokensFromBoostAccumulate +
        result.tokensFromNormalAccumulate,
    ),

    /**
     * 步骤5-2：总清道具次数
     * @formula floor(totalTokensAllSources / 720)
     */
    totalConsumePlays: computed((): number =>
      Math.floor(result.totalTokensAllSources / MLTD.tokensPerConsumePlay),
    ),

    /**
     * 步骤5-3：普通清道具次数
     * @formula totalConsumePlays - boostConsumePlays
     */
    normalConsumePlays: computed((): number =>
      Math.max(0, result.totalConsumePlays - result.boostConsumePlays),
    ),

    /**
     * 步骤5-4：普通清道具获得pt
     * @formula normalConsumePlays × 2148
     */
    ptFromNormalConsume: computed((): number => result.normalConsumePlays * MLTD.ptPerConsumePlay),

    /**
     * 步骤5-5：已获得的总pt（不含当前pt）
     * @formula ptFromBoostSources + ptFromNormalAccumulate + ptFromNormalConsume
     */
    ptTotalFromOperations: computed(
      (): number =>
        result.ptFromBoostSources + result.ptFromNormalAccumulate + result.ptFromNormalConsume,
    ),

    /**
     * 步骤5-6：还需要获得的pt（汇总）
     * @formula targetPt - currentPt - ptTotalFromOperations
     */
    ptNeeded: computed((): number => {
      const needed =
        (form.value.targetPt || 0) - (form.value.pt || 0) - result.ptTotalFromOperations;
      return needed > 0 ? needed : 0;
    }),

    /**
     * 超出目标pt的数量
     * @formula currentPt + ptTotalFromOperations - targetPt
     */
    ptExceeded: computed((): number => {
      const total = (form.value.pt || 0) + result.ptTotalFromOperations;
      const exceeded = total - (form.value.targetPt || 0);
      return exceeded > 0 ? exceeded : 0;
    }),

    /**
     * 步骤5-7：火使用游玩次数汇总
     * @formula totalBoostAccumulatePlays + boostConsumePlays
     */
    boostPlays: computed((): number => result.totalBoostAccumulatePlays + result.boostConsumePlays),

    /**
     * 步骤5-8：总攒道具次数
     * @formula totalBoostAccumulatePlays + normalAccumulatePlays
     * @description 火攒道具 + 普通攒道具
     */
    totalTokenAccumulatePlays: computed(
      (): number => result.totalBoostAccumulatePlays + result.normalAccumulatePlays,
    ),

    /**
     * 步骤5-9：总清道具次数
     * @formula boostConsumePlays + normalConsumePlays
     * @description 火清道具 + 普通清道具
     */
    totalTokenConsumePlays: computed(
      (): number => result.boostConsumePlays + result.normalConsumePlays,
    ),

    /**
     * 步骤5-10：最终剩余道具数
     * @formula totalTokensAllSources - totalTokenConsumePlays × 720
     * @description 用于检查道具是否接近清空
     */
    finalTokensRemaining: computed(
      (): number =>
        result.totalTokensAllSources - result.totalTokenConsumePlays * MLTD.tokensPerConsumePlay,
    ),

    /**
     * 步骤5-11：火清道具是否有足够的道具支持
     * @formula tokensFromFixedSources + tokensFromBoostAccumulate >= boostConsumePlays × 720
     * @description 用于判断道具是否足以支持火清道具次数
     */
    isBoostConsumeTokensInsufficient: computed((): boolean => {
      const tokensAvailable = result.tokensFromFixedSources + result.tokensFromBoostAccumulate;
      const tokensNeeded = result.boostConsumePlays * MLTD.tokensPerConsumePlay;
      return tokensNeeded > tokensAvailable;
    }),

    /**
     * 步骤6-1：总消耗体力
     * @formula staminaForBoostAccumulate + staminaForNormalAccumulate
     */
    totalStaminaNeeded: computed(
      (): number => result.staminaForBoostAccumulate + result.staminaForNormalAccumulate,
    ),

    /**
     * 步骤6-2：自然回复体力
     * @formula remainingTime × 288
     */
    staminaRecovered: computed((): number =>
      Math.floor((form.value.remainingTime || 0) * MLTD.staminaRecoverPerDay),
    ),

    /**
     * 步骤6-3：体力瓶提供的体力
     * @formula 满体瓶×maxStamina + 30体瓶×30 + 20体瓶×20 + 10体瓶×10
     */
    staminaFromBottles: computed(
      (): number =>
        (form.value.staminaMaxBottleCount || 0) * result.currentMaxStamina +
        (form.value.stamina30BottleCount || 0) * 30 +
        (form.value.stamina20BottleCount || 0) * 20 +
        (form.value.stamina10BottleCount || 0) * 10,
    ),

    /**
     * 步骤6-4：每日任务提供的体力
     * @formula (2 × maxStamina + 10 × 30) × freeTokenClaimCount
     */
    staminaFromDaily: computed(
      (): number =>
        (MLTD.dailyMaxStaminaBonusCount * result.currentMaxStamina +
          MLTD.dailyStamina30BottleCount * 30) *
        f.value,
    ),

    /**
     * 步骤7-1：需要额外体力
     * @formula totalStaminaNeeded - staminaRecovered - staminaFromBottles - staminaFromDaily
     */
    extraStaminaNeeded: computed((): number => {
      const extra =
        result.totalStaminaNeeded -
        result.staminaRecovered -
        result.staminaFromBottles -
        result.staminaFromDaily;
      return extra > 0 ? extra : 0;
    }),

    /**
     * 步骤7-2：需要回满体力的次数
     * @formula ceil(extraStaminaNeeded / maxStamina)
     * @description 钻石回满体力不能部分回复，必须整数次
     */
    fullStaminaRecoveriesNeeded: computed((): number => {
      if (result.extraStaminaNeeded <= 0) return 0;
      return Math.ceil(result.extraStaminaNeeded / result.currentMaxStamina);
    }),

    /**
     * 步骤7-3：需要钻石数
     * @formula fullStaminaRecoveriesNeeded × 50
     * @description 每次回满体力消耗50钻石，必须整数次
     */
    jewelNeeded: computed((): number => {
      return result.fullStaminaRecoveriesNeeded * MLTD.jewelPerFullStamina;
    }),

    /**
     * 步骤8-1：火攒道具模式时间
     * @formula totalBoostAccumulatePlays × tokenAccumulateTime
     */
    boostTimeSpent: computed(
      (): number => result.totalBoostAccumulatePlays * (form.value.tokenAccumulateTime || 0),
    ),

    /**
     * 步骤8-2：火清道具模式时间
     * @formula boostConsumePlays × tokenConsumeTime
     */
    boostConsumeTimeSpent: computed(
      (): number => result.boostConsumePlays * (form.value.tokenConsumeTime || 0),
    ),

    /**
     * 步骤8-3：普通攒道具时间
     * @formula normalAccumulatePlays × tokenAccumulateTime
     */
    normalAccumulateTimeSpent: computed(
      (): number => result.normalAccumulatePlays * (form.value.tokenAccumulateTime || 0),
    ),

    /**
     * 步骤8-4：普通清道具时间
     * @formula normalConsumePlays × tokenConsumeTime
     */
    normalConsumeTimeSpent: computed(
      (): number => result.normalConsumePlays * (form.value.tokenConsumeTime || 0),
    ),

    /**
     * 步骤8-5：总清道具时间
     * @formula boostConsumeTimeSpent + normalConsumeTimeSpent
     */
    totalConsumeTimeSpent: computed(
      (): number => result.boostConsumeTimeSpent + result.normalConsumeTimeSpent,
    ),

    /**
     * 步骤8-6：总时间
     * @formula boostTimeSpent + normalAccumulateTimeSpent + totalConsumeTimeSpent
     */
    totalTimeSpent: computed(
      (): number =>
        result.boostTimeSpent + result.normalAccumulateTimeSpent + result.totalConsumeTimeSpent,
    ),

    /**
     * 步骤8-7：总攒道具时间
     * @formula boostTimeSpent + normalAccumulateTimeSpent
     */
    totalTokenAccumulateTimeSpent: computed(
      (): number => result.boostTimeSpent + result.normalAccumulateTimeSpent,
    ),

    /**
     * 步骤9-1：总游玩次数
     * @formula totalTokenAccumulatePlays + totalTokenConsumePlays
     */
    totalPlays: computed(
      (): number => result.totalTokenAccumulatePlays + result.totalTokenConsumePlays,
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
   * 应用自动优化分配
   * @description 将火分配恢复为算法计算的最优值
   */
  const applyOptimalAllocation = () => {
    form.value.useAutoOptimize = true;
    form.value.userTotalBoostAccumulatePlays = undefined;
    form.value.userBoostConsumePlays = undefined;
  };

  /**
   * 设置用户自定义火攒道具次数
   * @param plays - 火攒道具次数
   * @description 自动切换到自定义模式，火清道具次数自动推算为总火次数 - 火攒道具次数
   */
  const setUserTotalBoostAccumulatePlays = (plays: number) => {
    form.value.useAutoOptimize = false;
    const totalBoostPlays = result.totalBoostPlaysAvailable;
    const accumulate = Math.max(0, Math.min(plays, totalBoostPlays));
    const consume = totalBoostPlays - accumulate;
    form.value.userTotalBoostAccumulatePlays = accumulate;
    form.value.userBoostConsumePlays = consume;
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
    applyOptimalAllocation,
    setUserTotalBoostAccumulatePlays,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    getExportData,
    importFromString,
  };
}
