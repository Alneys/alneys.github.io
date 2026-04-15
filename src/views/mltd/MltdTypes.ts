/**
 * MLTD 周年活动计算器类型定义
 */

export interface AnniversaryForm {
  eventEndTime: Date;
  targetPt?: number;
  plv?: number;
  maxStamina?: number;
  pt?: number;
  token?: number;
  boostCount?: number;
  freeTokenCount?: number;
  staminaMaxCount?: number;
  stamina30Count?: number;
  stamina20Count?: number;
  stamina10Count?: number;
  gainTokenTime?: number;
  burnTokenTime?: number;
  remainingTime?: number;
}

export interface AnniversaryResult {
  ptFromBoost: number;
  ptFromFreeToken: number;
  ptFromRemainingToken: number;
  currentMaxStamina: number;
  staminaForBoost: number;
  staminaRecover: number;
  staminaFromBottles: number;
  staminaFromDaily: number;
  ptNeeded: number;
  staminaNeeded: number;
  tokenNeeded: number;
  jewelNeeded: number;
  boostPlays: number;
  gainTokenPlays: number;
  burnTokenPlays: number;
  boostTimeSpend: number;
  gainTokenTimeSpend: number;
  burnTokenTimeSpend: number;
  totalTimeSpend: number;
}
