/**
 * MLTD 周年活动相关常量定义
 *
 * 周年活动机制：
 * 1. 攒道具阶段：消耗体力打歌，获得道具
 * 2. 清道具阶段：消耗道具打活动专属歌曲，获得pt
 * 3. 火机制：
 *    - 火攒道具：消耗体力获得双倍道具
 *    - 火清道具：消耗双倍道具获得双倍pt
 */
export const MLTD_ANNIVERSARY_CONSTANTS = {
  /** 攒道具阶段 - 每次消耗体力 */
  staminaCostForTokenAccumulate: 450,
  /** 攒道具阶段 - 每次获得道具数 */
  tokensPerAccumulatePlay: 1071,

  /** 清道具阶段 - 每次消耗道具数 */
  tokensPerConsumePlay: 720,
  /** 清道具阶段 - 每次获得pt数 */
  ptPerConsumePlay: 2148,
  /** 道具转pt比例：2148/720 ≈ 2.983 */
  get tokenToPtRatio() {
    return this.ptPerConsumePlay / this.tokensPerConsumePlay;
  },

  /** 火模式 - 每个火可游玩次数（攒道具和清道具共用） */
  boostPlaysPerBoostItem: 10,
  /** 火攒道具模式 - 每次获得道具数（双倍：1071×2） */
  tokensPerBoostAccumulatePlay: 1071 * 2,
  /** 火清道具模式 - 每次消耗道具数（双倍：720×2） */
  tokensPerBoostConsumePlay: 720 * 2,
  /** 火清道具模式 - 每次获得pt数（双倍：2148×2） */
  ptPerBoostConsumePlay: 2148 * 2,

  /** 每次火攒道具贡献的pt（含道具转pt）：2142 × (1 + 2148/720) ≈ 8534 */
  get ptPerBoostPlay() {
    return this.tokensPerBoostAccumulatePlay * (1 + this.tokenToPtRatio);
  },

  /** 赠送道具 - 每日登录活动界面获得 */
  dailyLoginTokens: 540,
  /** 赠送道具 - 每首推荐歌曲首次游玩额外奖励 */
  dailyRecommendedSongBonusTokens: 1000,
  /** 每日推荐歌曲数量 */
  dailyRecommendedSongCount: 4,
  /** 赠送道具 - 每日推荐歌曲赠送奖励合计：4 × 1000 = 4000 */
  get dailyRecommendedSongsBonusTokens() {
    return this.dailyRecommendedSongCount * this.dailyRecommendedSongBonusTokens;
  },
  /** 赠送道具 - 每日合计：540 + 4000 = 4540 */
  get dailyFreeTokens() {
    return this.dailyLoginTokens + this.dailyRecommendedSongsBonusTokens;
  },
  /** 每个火可用于推荐歌曲的最大次数 */
  boostPlaysPerBoostItemForRecommendedSongs: 4,

  /** 体力资源 - 自然回复：每5分钟1点，每天288点 */
  staminaRecoverPerDay: 24 * 12,

  /** 每日任务奖励 - 回满体力次数 */
  dailyMaxStaminaBonusCount: 2,
  /** 每日任务奖励 - 30体力瓶数量 */
  dailyStamina30BottleCount: 10,

  /** 钻石回满体力 - 每次消耗钻石数 */
  jewelPerFullStamina: 50,

  /** 活动限制 - 总天数 */
  eventTotalDays: 13,
  /** 活动限制 - 总火数（首日1个，每次强制休息后1个） */
  eventTotalBoosts: 13,

  /** 输入限制 - 最大目标pt */
  maxTargetPt: 99999999,
  /** 输入限制 - 最大等级 */
  maxLevel: 999,
  /** 输入限制 - 最大道具数 */
  maxTokens: 9999999,
  /** 输入限制 - 最大体力瓶数量 */
  maxStaminaBottles: 9999,
  /** 输入限制 - 最大时间（分钟） */
  maxTimeMinutes: 30,
} as const;
