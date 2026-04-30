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

import type { EventTheaterChoice } from './MltdTypes';
export const MLTD_ANNIVERSARY_CONSTANTS = {
  /** 攒道具阶段 - 每次消耗体力 */
  staminaCostForTokenAccumulate: 450,

  /** 攒道具阶段 - 每次获得道具数 */
  tokensPerAccumulatePlay: 1071,

  /** 攒道具阶段 - 每次直接获得pt数 */
  ptPerAccumulatePlay: 1071,

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
  /** 火攒道具阶段 - 每次消耗体力（与普通相同：450） */
  staminaCostForBoostAccumulate: 450,
  /** 火攒道具模式 - 每次获得道具数（双倍：1071×2） */
  tokensPerBoostAccumulatePlay: 1071 * 2,
  /** 火攒道具模式 - 每次直接获得pt数（双倍：1071×2） */
  ptPerBoostAccumulatePlay: 1071 * 2,
  /** 火清道具模式 - 每次消耗道具数（与普通相同：720） */
  tokensPerBoostConsumePlay: 720,
  /** 火清道具模式 - 每次获得pt数（双倍：2148×2） */
  ptPerBoostConsumePlay: 2148 * 2,

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

/**
 * MLTD 活动控分 - 歌曲配置
 * @description 用于动态生成游玩选项
 */
interface SongConfigForParking {
  /** 歌曲名称（中文） */
  name: string;
  /** 元气等倍消耗时获得的点数 */
  value: number;
  /** 单倍票券消耗所需的票数 */
  ticket: number;
}

/**
 * 歌曲基础配置表
 */
const SONG_CONFIGS_FOR_PARKING: SongConfigForParking[] = [
  { name: 'MM 通常曲', value: 85, ticket: 30 },
  { name: '6M 通常曲', value: 64, ticket: 25 },
  { name: '2M+ 通常曲', value: 62, ticket: 25 },
  { name: '4M 通常曲', value: 49, ticket: 20 },
  { name: '2M 通常曲', value: 35, ticket: 15 },
];

/**
 * 票券消耗倍率配置 - Theater 活动
 * @description 从 10 到 1，每个值乘以 0.7 得到点数倍率
 * 原始倍率：[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
 * 点数倍率：[7.0, 6.3, 5.6, 4.9, 4.2, 3.5, 2.8, 2.1, 1.4, 0.7]
 */
const TICKET_MULTIPLIER_CONFIG = {
  /** 最大倍率 */
  maxMultiplier: 10,
  /** 点数计算系数 */
  pointCoefficient: 0.7,
} as const;

/**
 * 票券消耗倍率配置 - Anniversary 活动
 * @description 从 15 到 1，每个值乘以 0.7 得到点数倍率
 * 原始倍率：[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
 * 点数倍率：[10.5, 9.8, 9.1, 8.4, 7.7, 7.0, 6.3, 5.6, 4.9, 4.2, 3.5, 2.8, 2.1, 1.4, 0.7]
 */
const ANNIVERSARY_TICKET_CONFIG = {
  /** 最大倍率 */
  maxMultiplier: 15,
  /** 点数计算系数 */
  pointCoefficient: 0.7,
} as const;

/**
 * Event Live 配置 - Theater 活动
 * @description 消耗活动道具获得大量点数
 */
const EVENT_LIVE_CONFIG_FOR_PARKING = {
  name: '活动曲',
  multiplier: '1倍',
  pt: 634,
  token: -180,
} as const;

/**
 * Event Live 配置 - Anniversary 活动
 * @description 消耗活动道具获得大量点数（pt 比 Theater 低）
 */
const ANNIVERSARY_EVENT_LIVE_CONFIG = {
  name: '活动曲',
  multiplier: '1倍',
  pt: 537,
  token: -180,
} as const;

/**
 * 计算票券消耗时的点数
 * @param basePoint 基础点数
 * @param multiplier 票券倍率
 * @returns 向上取整后的点数
 */
function calculateTicketPoint(basePoint: number, multiplier: number): number {
  return Math.ceil(basePoint * multiplier * TICKET_MULTIPLIER_CONFIG.pointCoefficient);
}

/**
 * 计算票券消耗所需的票数
 * @param multiplier 票券倍率
 * @param ticket 单倍票券消耗所需的票数
 * @returns 票数
 */
function calculateTicketCount(multiplier: number, ticket: number): number {
  return multiplier * ticket;
}

/**
 * 生成票券消耗倍率数组（从大到小）
 * @param x 最大倍率数
 * @returns 倍率数组
 */
function generateTicketMultipliers(x: number = TICKET_MULTIPLIER_CONFIG.maxMultiplier): number[] {
  return Array.from({ length: x }, (_, i) => x - i);
}

/**
 * 提取歌曲基础名称（去掉 '通常曲' 后缀）
 * @param name 完整歌曲名称
 * @returns 基础名称
 */
function extractSongBaseName(name: string): string {
  return name.replace('通常曲', '').trim();
}

/**
 * 生成 Anniversary 活动的完整游玩选项列表
 *
 * Anniversary 特点：
 * 1. 票券倍率范围更大：15→1 × 0.7
 * 2. 有推荐曲（1.2倍元气消费，PUSH 系统）
 * 3. Million Mix 推荐曲可 PUSH + 票券组合
 * 4. Event Live 点数较低：537（Theater 是 634）
 *
 * 曲目类型区分：
 * - 通常曲：元气等倍消费，打工票等倍消费
 * - 推荐曲：元气1.2倍消费（PUSH），打工票+PUSH组合（仅MM）
 *
 * 生成顺序：
 * 1. 活动曲（消耗道具）
 * 2. 体力消耗-通常曲（按体力消耗大到小）
 * 3. 体力消耗-推荐曲（按体力消耗大到小）
 * 4. 打工票消耗-推荐曲（仅MM，倍率从大到小）- 优先级最高
 * 5. 打工票消耗-通常曲（按体力消耗大到小，倍率从大到小）
 *
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateAnniversaryChoices(): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

  // 1. 活动曲（消耗道具获得大量点数）
  entries.push({
    name: ANNIVERSARY_EVENT_LIVE_CONFIG.name,
    type: '',
    multiplier: ANNIVERSARY_EVENT_LIVE_CONFIG.multiplier,
    pt: ANNIVERSARY_EVENT_LIVE_CONFIG.pt,
    token: ANNIVERSARY_EVENT_LIVE_CONFIG.token,
  });

  // 2. 体力消耗 - 通常曲（元气等倍）
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    const baseName = extractSongBaseName(song.name);
    entries.push({
      name: `${baseName} 通常曲`,
      type: '体力',
      multiplier: '1倍',
      pt: song.value,
      token: song.value,
    });
  }

  // 3. 体力消耗 - 推荐曲（元气1.2倍，PUSH）
  // 公式：pt = round(value × 1.2)
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    const baseName = extractSongBaseName(song.name);
    const pushPt = Math.round(song.value * 1.2);
    entries.push({
      name: `${baseName} 推荐曲`,
      type: '体力',
      multiplier: '1.2倍',
      pt: pushPt,
      token: pushPt,
    });
  }

  // 4. 打工票消耗 - 推荐曲（仅 Million Mix）- 优先级最高
  // 公式：pt = ceil(ceil(value × 1.2) × multiplier × 0.7)
  const multipliers = generateTicketMultipliers(ANNIVERSARY_TICKET_CONFIG.maxMultiplier);
  const mmSong = SONG_CONFIGS_FOR_PARKING.find((s) => s.name.includes('MM'));
  if (mmSong) {
    const baseName = extractSongBaseName(mmSong.name);
    for (const m of multipliers) {
      const displayMultiplier = (m * ANNIVERSARY_TICKET_CONFIG.pointCoefficient).toFixed(1);
      const pushPt = Math.ceil(mmSong.value * 1.2);
      const ticketPushPt = Math.ceil(pushPt * m * ANNIVERSARY_TICKET_CONFIG.pointCoefficient);
      entries.push({
        name: `${baseName} 推荐曲`,
        type: '打工票',
        multiplier: `${displayMultiplier}倍`,
        pt: ticketPushPt,
        token: ticketPushPt,
        extra: m < ANNIVERSARY_TICKET_CONFIG.maxMultiplier,
      });
    }
  }

  // 5. 打工票消耗 - 通常曲
  // 公式：pt = ceil(value × multiplier × 0.7)
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    const baseName = extractSongBaseName(song.name);
    for (const m of multipliers) {
      const displayMultiplier = (m * ANNIVERSARY_TICKET_CONFIG.pointCoefficient).toFixed(1);
      const ticketPt = Math.ceil(song.value * m * ANNIVERSARY_TICKET_CONFIG.pointCoefficient);
      entries.push({
        name: `${baseName} 通常曲`,
        type: '打工票',
        multiplier: `${displayMultiplier}倍`,
        pt: ticketPt,
        token: ticketPt,
        extra: m < ANNIVERSARY_TICKET_CONFIG.maxMultiplier,
      });
    }
  }

  return entries;
}

/**
 * 生成 Theater 活动的完整游玩选项列表
 *
 * 生成顺序：
 * 1. 活动曲（消耗道具）
 * 2. 体力消耗（元气等倍，按体力消耗大到小）
 * 3. 票券消耗（按体力消耗大到小，倍率从大到小）
 *
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTheaterChoices(): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

  // 1. 活动曲（消耗道具获得大量点数）
  entries.push({
    name: EVENT_LIVE_CONFIG_FOR_PARKING.name,
    type: '',
    multiplier: EVENT_LIVE_CONFIG_FOR_PARKING.multiplier,
    pt: EVENT_LIVE_CONFIG_FOR_PARKING.pt,
    token: EVENT_LIVE_CONFIG_FOR_PARKING.token,
  });

  // 2. 体力消耗（元气等倍，按体力消耗大到小）
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: '1倍',
      pt: song.value,
      token: song.value,
    });
  }

  // 3. 票券消耗（按体力消耗大到小，倍率从大到小）
  const multipliers = generateTicketMultipliers();
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    for (const multiplier of multipliers) {
      const ticketPoint = calculateTicketPoint(song.value, multiplier);
      const ticketCount = calculateTicketCount(multiplier, song.ticket);
      entries.push({
        name: song.name,
        type: '打工票',
        multiplier: `${(multiplier * 0.7).toFixed(1)} 倍`,
        pt: ticketPoint,
        token: ticketPoint,
        extra: multiplier < TICKET_MULTIPLIER_CONFIG.maxMultiplier,
      });
    }
  }

  return entries;
}

/**
 * MLTD 活动控分相关常量定义
 */
export const MLTD_PARKING_CONSTANTS = {
  /** Theater 活动剧场选择项列表（动态生成） */
  eventTheaterChoices: generateTheaterChoices(),

  /** Anniversary 活动剧场选择项列表（动态生成） */
  eventAnniversaryChoices: generateAnniversaryChoices(),
} as const;

/**
 * 等级到最大体力值的映射表
 * @description 索引为等级（0-999），值为对应的最大体力值
 */
export const LEVEL_TO_MAX_STAMINA_TABLE: number[] = [
  60, 60, 61, 61, 62, 62, 63, 63, 64, 64, 65, 65, 66, 66, 67, 67, 68, 68, 69, 69, 70, 70, 71, 71,
  72, 72, 73, 73, 74, 74, 75, 75, 76, 76, 77, 77, 78, 78, 79, 79, 80, 80, 81, 81, 82, 82, 83, 83,
  84, 84, 85, 85, 86, 86, 87, 87, 88, 88, 89, 89, 90, 90, 90, 91, 91, 91, 92, 92, 92, 93, 93, 93,
  94, 94, 94, 95, 95, 95, 96, 96, 96, 97, 97, 97, 98, 98, 98, 99, 99, 99, 100, 100, 100, 101, 101,
  101, 102, 102, 102, 103, 103, 103, 104, 104, 104, 105, 105, 105, 106, 106, 106, 107, 107, 107,
  108, 108, 108, 109, 109, 109, 110, 110, 110, 111, 111, 111, 112, 112, 112, 113, 113, 113, 114,
  114, 114, 115, 115, 115, 116, 116, 116, 117, 117, 117, 118, 118, 118, 119, 119, 119, 120, 120,
  120, 120, 121, 121, 121, 121, 122, 122, 122, 122, 123, 123, 123, 123, 124, 124, 124, 124, 125,
  125, 125, 125, 126, 126, 126, 126, 127, 127, 127, 127, 128, 128, 128, 128, 129, 129, 129, 129,
  130, 130, 130, 130, 131, 131, 131, 131, 132, 132, 132, 132, 133, 133, 133, 133, 134, 134, 134,
  134, 135, 135, 135, 135, 136, 136, 136, 136, 137, 137, 137, 137, 138, 138, 138, 138, 139, 139,
  139, 139, 140, 140, 140, 140, 141, 141, 141, 141, 142, 142, 142, 142, 143, 143, 143, 143, 144,
  144, 144, 144, 145, 145, 145, 145, 146, 146, 146, 146, 147, 147, 147, 147, 148, 148, 148, 148,
  149, 149, 149, 149, 150, 150, 150, 150, 151, 151, 151, 151, 152, 152, 152, 152, 153, 153, 153,
  153, 154, 154, 154, 154, 155, 155, 155, 155, 156, 156, 156, 156, 157, 157, 157, 157, 158, 158,
  158, 158, 159, 159, 159, 159, 160, 160, 160, 160, 161, 161, 161, 161, 162, 162, 162, 162, 163,
  163, 163, 163, 164, 164, 164, 164, 165, 165, 165, 165, 166, 166, 166, 166, 167, 167, 167, 167,
  168, 168, 168, 168, 169, 169, 169, 169, 170, 170, 170, 170, 171, 171, 171, 171, 172, 172, 172,
  172, 173, 173, 173, 173, 174, 174, 174, 174, 175, 175, 175, 175, 176, 176, 176, 176, 177, 177,
  177, 177, 178, 178, 178, 178, 179, 179, 179, 179, 180, 180, 180, 180, 181, 181, 181, 181, 182,
  182, 182, 182, 183, 183, 183, 183, 184, 184, 184, 184, 185, 185, 185, 185, 186, 186, 186, 186,
  187, 187, 187, 187, 188, 188, 188, 188, 189, 189, 189, 189, 189, 190, 190, 190, 190, 190, 191,
  191, 191, 191, 191, 192, 192, 192, 192, 192, 193, 193, 193, 193, 193, 194, 194, 194, 194, 194,
  195, 195, 195, 195, 195, 196, 196, 196, 196, 196, 197, 197, 197, 197, 197, 198, 198, 198, 198,
  198, 199, 199, 199, 199, 199, 200, 200, 200, 200, 200, 201, 201, 201, 201, 201, 202, 202, 202,
  202, 202, 203, 203, 203, 203, 203, 204, 204, 204, 204, 204, 205, 205, 205, 205, 205, 206, 206,
  206, 206, 206, 207, 207, 207, 207, 207, 208, 208, 208, 208, 208, 209, 209, 209, 209, 209, 210,
  210, 210, 210, 210, 211, 211, 211, 211, 211, 212, 212, 212, 212, 212, 213, 213, 213, 213, 213,
  214, 214, 214, 214, 214, 215, 215, 215, 215, 215, 216, 216, 216, 216, 216, 217, 217, 217, 217,
  217, 218, 218, 218, 218, 218, 219, 219, 219, 219, 219, 220, 220, 220, 220, 220, 221, 221, 221,
  221, 221, 221, 222, 222, 222, 222, 222, 222, 223, 223, 223, 223, 223, 223, 224, 224, 224, 224,
  224, 224, 225, 225, 225, 225, 225, 225, 226, 226, 226, 226, 226, 226, 227, 227, 227, 227, 227,
  227, 228, 228, 228, 228, 228, 228, 229, 229, 229, 229, 229, 229, 230, 230, 230, 230, 230, 230,
  231, 231, 231, 231, 231, 231, 232, 232, 232, 232, 232, 232, 233, 233, 233, 233, 233, 233, 234,
  234, 234, 234, 234, 234, 235, 235, 235, 235, 235, 235, 236, 236, 236, 236, 236, 236, 237, 237,
  237, 237, 237, 237, 238, 238, 238, 238, 238, 238, 239, 239, 239, 239, 239, 239, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
  240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240,
];

/**
 * 活动控分计算说明
 */
export const EVENT_PARKING_TIPS = {
  theater: [
    '消耗 1 倍体力游玩时获得的点数即为基础点数',
    '使用打工票游玩普通曲时的计算公式：基础点数 × 打工票倍率（向上取整）',
  ],
  anniversary: [
    '消耗 1 倍体力游玩时获得的点数即为基础点数',
    '使用打工票游玩普通曲时的计算公式：基础点数 × 打工票倍率（向上取整）',
    '消耗体力游玩推荐曲（PUSH）时的计算公式：基础点数 × 1.2倍奖励（向上取整）',
    '使用打工票游玩推荐曲（PUSH）时的计算公式：(基础点数 × 1.2倍奖励（向上取整)) × 打工票倍率（向上取整）',
  ],
} as const;
