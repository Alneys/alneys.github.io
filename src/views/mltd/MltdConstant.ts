/**
 * MLTD 周年活动相关常量定义
 *
 * 周年活动机制：
 * 1. 攒道具阶段：消耗体力打歌，获得道具
 * 2. 清道具阶段：消耗道具打活动专属歌曲，获得pt
 * 3. 火机制：特殊模式，消耗更多体力但获得双倍道具
 */
export const ANNIVERSARY_CONSTANTS = {
  /** 攒道具阶段 - 每次消耗体力 */
  STAMINA_COST_FOR_TOKEN_ACCUMULATE: 450,
  /** 攒道具阶段 - 每次获得道具数 */
  TOKENS_PER_ACCUMULATE_PLAY: 1071,

  /** 清道具阶段 - 每次消耗道具数 */
  TOKENS_PER_CONSUME_PLAY: 720,
  /** 清道具阶段 - 每次获得pt数 */
  PT_PER_CONSUME_PLAY: 2148,
  /** 道具转pt比例：2148/720 ≈ 2.983 */
  get TOKEN_TO_PT_RATIO() {
    return this.PT_PER_CONSUME_PLAY / this.TOKENS_PER_CONSUME_PLAY;
  },

  /** 火模式 - 每次火消耗体力（10次×450） */
  STAMINA_COST_PER_BOOST: 4500,
  /** 火模式 - 每个火可游玩次数 */
  BOOST_PLAYS_PER_BOOST_ITEM: 10,
  /** 火模式 - 每次获得道具数（双倍：1071×2） */
  TOKENS_PER_BOOST_PLAY: 1071 * 2,

  /** 白给道具 - 每日登录活动界面获得 */
  DAILY_LOGIN_TOKENS: 540,
  /** 白给道具 - 每日首次打推荐歌获得 */
  DAILY_FIRST_SONG_TOKENS: 4000,
  /** 白给道具 - 每日合计：540 + 4000 = 4540 */
  get DAILY_FREE_TOKENS() {
    return this.DAILY_LOGIN_TOKENS + this.DAILY_FIRST_SONG_TOKENS;
  },

  /** 体力资源 - 自然回复：每5分钟1点，每天288点 */
  STAMINA_RECOVER_PER_DAY: 24 * 12,

  /** 每日任务奖励 - 回满体力次数 */
  DAILY_MAX_STAMINA_BONUS_COUNT: 2,
  /** 每日任务奖励 - 30体力瓶数量 */
  DAILY_STAMINA_30_BOTTLE_COUNT: 10,

  /** 钻石回满体力 - 每次消耗钻石数 */
  JEWEL_PER_FULL_STAMINA: 50,

  /** 活动限制 - 总天数 */
  EVENT_TOTAL_DAYS: 13,
  /** 活动限制 - 总火数（首日1个，每次强制休息后1个） */
  EVENT_TOTAL_BOOSTS: 13,

  /** 输入限制 - 最大目标pt */
  MAX_TARGET_PT: 99999999,
  /** 输入限制 - 最大等级 */
  MAX_LEVEL: 999,
  /** 输入限制 - 最大道具数 */
  MAX_TOKENS: 9999999,
  /** 输入限制 - 最大体力瓶数量 */
  MAX_STAMINA_BOTTLES: 9999,
  /** 输入限制 - 最大时间（分钟） */
  MAX_TIME_MINUTES: 30,
} as const;
