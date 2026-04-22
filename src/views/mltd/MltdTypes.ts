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
  minTokenAccumulatePlays: number;
  recommendedSongBoostPlays: number;
  recommendedSongNonBoostPlays: number;
  remainingBoostPlays: number;
  staminaForRecommendedSongs: number;
  tokensFromLogin: number;
  tokensFromRecommendedBonus: number;
  tokensFromRecommendedBoost: number;
  tokensFromRecommendedNonBoost: number;
  tokensFromRemaining: number;
  ptFromLogin: number;
  ptFromRecommendedBonus: number;
  ptFromRecommendedBoost: number;
  ptFromRecommendedNonBoost: number;
  ptFromRemainingTokens: number;
  ptFromFixedSources: number;
  ptFromRecommendedSongs: number;
  ptFromConfirmedSources: number;
  currentMaxStamina: number;
  ptStillNeeded: number;
  optimalBoostAccumulatePlays: number;
  ptFromBoostAccumulate: number;
  staminaForBoostAccumulate: number;
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
  normalAccumulateTimeSpent: number;
  tokenConsumeTimeSpent: number;
  totalTimeSpent: number;
}
