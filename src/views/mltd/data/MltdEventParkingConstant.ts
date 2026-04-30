/**
 * MLTD 活动控分相关常量定义
 */

import type { EventTheaterChoice } from '../MltdTypes';

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
 * Trust 活动分数加成倍率
 * @description Trust 活动固定 1.5 倍分数加成，只对积分有效，对道具无效
 */
const TRUST_POINT_BONUS = 1.5;

/**
 * Event Live 配置 - Trust 活动
 * @description Trust 活动有 1倍/2倍/4倍 三个版本
 */
const TRUST_EVENT_LIVE_CONFIGS = [
  { name: '活动曲', multiplier: '4倍', pt: 3708, token: -720 },
  { name: '活动曲', multiplier: '2倍', pt: 1854, token: -360 },
  { name: '活动曲', multiplier: '1倍', pt: 927, token: -180 },
] as const;

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
 * 生成 Trust 活动的完整游玩选项列表
 *
 * Trust 特点：
 * 1. 1.5 倍分数加成（只对积分有效，对道具无效）
 * 2. 票券倍率与 Theater 相同：10→1 × 0.7
 * 3. Event Live 有 1倍/2倍/4倍 三个版本
 *
 * 计算规则：
 * - 元气消费：道具 = 基础点数，积分 = ceil(道具 × 1.5)
 * - 票券消费：道具 = ceil(基础点数 × 倍率)，积分 = ceil(道具 × 1.5)
 * - Event Live：直接使用配置值（三个版本）
 *
 * 生成顺序：
 * 1. 活动曲（三个版本，消耗道具）
 * 2. 体力消耗（元气等倍，按体力消耗大到小）
 * 3. 票券消耗（按体力消耗大到小，倍率从大到小）
 *
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTrustChoices(): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

  // 1. 活动曲（三个版本，消耗道具获得大量点数）
  // 注意：活动曲不设置 extra 属性，不参与更多倍率筛选
  for (const config of TRUST_EVENT_LIVE_CONFIGS) {
    entries.push({
      name: config.name,
      type: '',
      multiplier: config.multiplier,
      pt: config.pt,
      token: config.token,
    });
  }

  // 2. 体力消耗（元气等倍）
  // 道具 = 基础点数，积分 = ceil(道具 × 1.5)
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    const pt = Math.ceil(song.value * TRUST_POINT_BONUS);
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: '1倍',
      pt: pt,
      token: song.value, // 道具不受分数加成影响
    });
  }

  // 3. 票券消耗
  // 道具 = ceil(基础点数 × 倍率)，积分 = ceil(道具 × 1.5)
  const multipliers = generateTicketMultipliers();
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    for (const multiplier of multipliers) {
      const token = Math.ceil(song.value * multiplier * TICKET_MULTIPLIER_CONFIG.pointCoefficient);
      const pt = Math.ceil(token * TRUST_POINT_BONUS);
      entries.push({
        name: song.name,
        type: '打工票',
        multiplier: `${(multiplier * 0.7).toFixed(1)} 倍`,
        pt: pt,
        token: token,
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

  /** Trust 活动剧场选择项列表（动态生成） */
  eventTrustChoices: generateTrustChoices(),
} as const;

/**
 * 活动控分注意事项（显示在表单区域的警告提示）
 */
export const EVENT_PARKING_NOTICES = {
  theater: ['由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样'],
  anniversary: [
    '注意：周年活动有每日推荐曲和普通曲的区别',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
  trust: [
    '注意：分数加成以 1.5 倍为前提',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
} as const;

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
  trust: [
    '消耗 1 倍体力游玩时获得的点数即为基础点数',
    'Trust 活动有 1.5 倍分数加成，只对积分有效，对道具无效',
    '消耗体力游玩时的计算公式：基础点数 × 1.5倍分数加成（向上取整）',
    '使用打工票游玩时的计算公式：(基础点数 × 打工票倍率（向上取整)) × 1.5倍分数加成（向上取整）',
  ],
} as const;
