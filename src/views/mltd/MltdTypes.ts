/**
 * MLTD 周年活动计算器类型定义
 */

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
  remainingTime?: number;
  userTotalBoostAccumulatePlays?: number;
  userBoostConsumePlays?: number;
  useAutoOptimize?: boolean;
}

export interface AnniversaryResult {
  totalBoostPlaysAvailable: number;
  optimalTotalBoostAccumulatePlays: number;
  optimalBoostConsumePlays: number;
  totalBoostAccumulatePlays: number;
  boostConsumePlays: number;
  tokensFromLogin: number;
  tokensFromRecommendedBonus: number;
  tokensFromRemaining: number;
  ptFromLogin: number;
  ptFromRecommendedBonus: number;
  ptFromRemainingTokens: number;
  ptFromFixedSources: number;
  currentMaxStamina: number;
  ptStillNeeded: number;
  tokensAvailableBeforeBoostAllocation: number;
  useAutoOptimize: boolean;
  ptFromBoostAccumulate: number;
  ptFromBoostConsume: number;
  tokensFromBoostAccumulate: number;
  tokensConsumedByBoost: number;
  staminaForBoostAccumulate: number;
  ptFromConfirmedSources: number;
  ptNeededAfterBoost: number;
  ptPerNormalAccumulatePlay: number;
  normalAccumulatePlays: number;
  ptFromNormalAccumulate: number;
  staminaForNormalAccumulate: number;
  ptNeeded: number;
  ptExceeded: number;
  boostPlays: number;
  totalTokenAccumulatePlays: number;
  tokenConsumePlays: number;
  totalStaminaNeeded: number;
  staminaRecovered: number;
  staminaFromBottles: number;
  staminaFromDaily: number;
  jewelNeeded: number;
  boostTimeSpent: number;
  boostConsumeTimeSpent: number;
  normalAccumulateTimeSpent: number;
  tokenConsumeTimeSpent: number;
  totalTimeSpent: number;
  finalTokensRemaining: number;
}
