/**
 * MLTD 周年活动计算器类型定义
 */

import type { ComputedRef } from 'vue';

export interface AnniversaryForm {
  eventEndTime: Date;
  targetPt?: number;
  plv?: number;
  maxStamina?: number;
  pt?: number;
  tokens?: number;
  boostCount?: number;
  freeTokenClaimCount?: number;
  staminaMaxBottleCount?: number;
  stamina30BottleCount?: number;
  stamina20BottleCount?: number;
  stamina10BottleCount?: number;
  tokenAccumulateTime?: number;
  tokenConsumeTime?: number;
  singlePlayTime?: number;
  dailySkipPassCount?: number;
  remainingTime?: number;
  userTotalBoostAccumulatePlays?: number;
  userBoostConsumePlays?: number;
  useAutoOptimize?: boolean;
}

export interface BoostAllocationResult {
  totalBoostAccumulate: number;
  boostConsume: number;
  unusedBoostPlays: number;
}

export interface AnniversaryResult {
  tokensFromLogin: ComputedRef<number>;
  tokensFromRecommendedBonus: ComputedRef<number>;
  tokensFromRemaining: ComputedRef<number>;
  tokensFromFixedSources: ComputedRef<number>;
  currentMaxStamina: ComputedRef<number>;
  ptStillNeeded: ComputedRef<number>;
  tokensAvailableBeforeBoostAllocation: ComputedRef<number>;
  totalBoostPlaysAvailable: ComputedRef<number>;
  optimalBoostAllocation: ComputedRef<BoostAllocationResult>;
  useAutoOptimize: ComputedRef<boolean>;
  optimalTotalBoostAccumulatePlays: ComputedRef<number>;
  optimalBoostConsumePlays: ComputedRef<number>;
  optimalUnusedBoostPlays: ComputedRef<number>;
  totalBoostAccumulatePlays: ComputedRef<number>;
  boostConsumePlays: ComputedRef<number>;
  ptFromBoostAccumulate: ComputedRef<number>;
  ptFromBoostConsume: ComputedRef<number>;
  tokensFromBoostAccumulate: ComputedRef<number>;
  tokensConsumedByBoost: ComputedRef<number>;
  staminaForBoostAccumulate: ComputedRef<number>;
  ptFromBoostSources: ComputedRef<number>;
  ptNeededAfterBoost: ComputedRef<number>;
  normalAccumulatePlays: ComputedRef<number>;
  ptFromNormalAccumulate: ComputedRef<number>;
  tokensFromNormalAccumulate: ComputedRef<number>;
  staminaForNormalAccumulate: ComputedRef<number>;
  totalTokensAllSources: ComputedRef<number>;
  totalConsumePlays: ComputedRef<number>;
  normalConsumePlays: ComputedRef<number>;
  ptFromNormalConsume: ComputedRef<number>;
  ptTotalFromOperations: ComputedRef<number>;
  ptNeeded: ComputedRef<number>;
  ptExceeded: ComputedRef<number>;
  boostPlays: ComputedRef<number>;
  totalTokenAccumulatePlays: ComputedRef<number>;
  totalTokenConsumePlays: ComputedRef<number>;
  finalTokensRemaining: ComputedRef<number>;
  isBoostConsumeTokensInsufficient: ComputedRef<boolean>;
  totalStaminaNeeded: ComputedRef<number>;
  staminaRecovered: ComputedRef<number>;
  staminaFromBottles: ComputedRef<number>;
  staminaFromDaily: ComputedRef<number>;
  extraStaminaNeeded: ComputedRef<number>;
  fullStaminaRecoveriesNeeded: ComputedRef<number>;
  jewelNeeded: ComputedRef<number>;
  boostTimeSpent: ComputedRef<number>;
  boostConsumeTimeSpent: ComputedRef<number>;
  normalAccumulateTimeSpent: ComputedRef<number>;
  normalConsumeTimeSpent: ComputedRef<number>;
  totalConsumeTimeSpent: ComputedRef<number>;
  totalTimeSpent: ComputedRef<number>;
  totalTokenAccumulateTimeSpent: ComputedRef<number>;
  totalPlays: ComputedRef<number>;

  /** 每日来源的跳过券数 */
  skipPassesFromDaily: ComputedRef<number>;
  /** 累计pt奖励来源的跳过券数 */
  skipPassesFromPtReward: ComputedRef<number>;
  /** 可用跳过券总数 */
  skipPassesAvailable: ComputedRef<number>;
  /** 实际使用的跳过券数（≤ totalPlays） */
  skipPassesUsed: ComputedRef<number>;
  /** 节省的时间（分钟） */
  totalTimeSaved: ComputedRef<number>;
  /** 调整后的总时间（分钟） */
  adjustedTotalTimeSpent: ComputedRef<number>;
}

/**
 * MLTD 活动控分计算器类型定义
 */

// Parking 表单类型
export interface ParkingForm {
  eventType: string;
  targetPt?: number;
  pt?: number;
  token?: number;
  enableExtraChoices?: boolean;
  // Tune 专属字段
  bonus?: number;
  isBoostPeriod?: boolean;
  // Tour 专属字段
  itemProgress?: number; // 道具进度（0-19）
  eventLiveProgress?: number; // 5倍进度
  // isBoostPeriod 同时用于 Tune（活动折返）和 Tour（已折返/可5倍）
  // Tale 专属字段
  progress?: number; // 进度（0-99+，≥100 表示 Event Live 已出现）
}

// Parking 计算结果项
export interface ParkingResultItem {
  name: string;
  multiplier: string;
  value: number;
  type?: string; // Tale 活动区分阶段（1st/2nd/3rd/"活动曲"），其他活动类型为空
}

// Parking 计算结果
export interface ParkingResult {
  flag: boolean;
  message?: string;
  result?: ParkingResultItem[];
}

/**
 * MLTD 活动剧场选择项类型定义
 */
export interface EventChoice {
  name: string;
  type?: string;
  multiplier: string;
  pt: number;
  token: number;
  extra?: boolean;
  progress?: number;
}
