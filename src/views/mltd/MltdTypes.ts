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
}

export interface AnniversaryResult {
  ptFromBoost: number;
  ptFromFreeTokens: number;
  ptFromRemainingTokens: number;
  currentMaxStamina: number;
  staminaForBoost: number;
  staminaRecovered: number;
  staminaFromBottles: number;
  staminaFromDaily: number;
  ptNeeded: number;
  staminaNeeded: number;
  tokensNeeded: number;
  jewelNeeded: number;
  boostPlays: number;
  tokenAccumulatePlays: number;
  tokenConsumePlays: number;
  boostTimeSpent: number;
  tokenAccumulateTimeSpent: number;
  tokenConsumeTimeSpent: number;
  totalTimeSpent: number;
}
