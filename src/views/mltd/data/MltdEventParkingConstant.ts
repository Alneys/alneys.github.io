/**
 * MLTD 活动控分相关常量定义
 */

import type { EventChoice } from '../MltdTypes';

/**
 * MLTD 活动控分 - 歌曲配置
 * @description 用于动态生成游玩选项
 */
interface SongConfigForParking {
  /** 歌曲名称（中文） */
  name: string;
  /** 体力等倍消耗时获得的积分 */
  value: number;
  /** 单倍打工票消耗所需的票数 */
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
 * 打工票消耗倍率配置 - Theater 活动
 * @description 从 10 到 1，每个值乘以 0.7 得到积分倍率
 * 原始倍率：[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
 * 积分倍率：[7.0, 6.3, 5.6, 4.9, 4.2, 3.5, 2.8, 2.1, 1.4, 0.7]
 */
const TICKET_MULTIPLIER_CONFIG = {
  /** 最大倍率 */
  maxMultiplier: 10,
  /** 积分计算系数 */
  pointCoefficient: 0.7,
} as const;

/**
 * 打工票消耗倍率配置 - Anniversary 活动
 * @description 从 15 到 1，每个值乘以 0.7 得到积分倍率
 * 原始倍率：[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
 * 积分倍率：[10.5, 9.8, 9.1, 8.4, 7.7, 7.0, 6.3, 5.6, 4.9, 4.2, 3.5, 2.8, 2.1, 1.4, 0.7]
 */
const ANNIVERSARY_TICKET_CONFIG = {
  /** 最大倍率 */
  maxMultiplier: 15,
  /** 积分计算系数 */
  pointCoefficient: 0.7,
} as const;

/**
 * 活动曲配置 - Theater 活动
 * @description 消耗活动道具获得大量积分
 */
const EVENT_LIVE_CONFIG_FOR_PARKING = {
  name: '活动曲',
  multiplier: '1倍',
  pt: 634,
  token: -180,
} as const;

/**
 * 活动曲配置 - Anniversary 活动
 * @description 消耗活动道具获得大量积分（pt 比 Theater 低）
 */
const ANNIVERSARY_EVENT_LIVE_CONFIG = {
  name: '活动曲',
  multiplier: '1倍',
  pt: 537,
  token: -180,
} as const;

/**
 * Trust 活动分数加成倍率
 * @description Trust 活动固定 1.5 倍分数加成，只对积分有效，对活动道具无效
 */
const TRUST_POINT_BONUS = 1.5;

/**
 * 活动曲配置 - Trust 活动
 * @description Trust 活动有 1倍/2倍/4倍 三个版本
 */
const TRUST_EVENT_LIVE_CONFIGS = [
  { name: '活动曲', multiplier: '4倍', pt: 3708, token: -720 },
  { name: '活动曲', multiplier: '2倍', pt: 1854, token: -360 },
  { name: '活动曲', multiplier: '1倍', pt: 927, token: -180 },
] as const;

/**
 * MLTD 活动控分 - Tune 歌曲配置
 * @description 用于动态生成游玩选项
 * Tune 活动曲目配置（体力等倍消耗时获得的积分）
 */
interface SongConfigForTune {
  name: string;
  value: number;
}

const TUNE_SONG_CONFIGS: SongConfigForTune[] = [
  { name: 'Million Mix', value: 75 },
  { name: '6 Mix', value: 54 },
  { name: '2 Mix+', value: 52 },
  { name: '4 Mix', value: 39 },
  { name: '2 Mix', value: 25 },
];

/**
 * 打工票消耗倍率配置 - Tune 活动
 * @description 从 1 到 10，每个值乘以 0.7 得到积分倍率
 * 原始倍率：[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * 积分倍率：[0.7, 1.4, 2.1, 2.8, 3.5, 4.2, 4.9, 5.6, 6.3, 7.0]
 * 与其他活动相反：Tune 使用升序（1→10），其他活动使用降序（10→1）
 */
const TUNE_TICKET_CONFIG = {
  maxMultiplier: 10,
  pointCoefficient: 0.7,
} as const;

/**
 * 活动曲基础积分（加成前）
 */
const TUNE_EVENT_LIVE_BASE_POINT = 490;

/**
 * 活动曲道具消耗基础值
 * 1倍 = -140, 2倍 = -280, 4倍 = -560
 */
const TUNE_EVENT_LIVE_TRIGGER_BASE = 140;

/**
 * 生成打工票消耗倍率数组（从大到小）
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
 * 计算打工票消耗时的积分
 * @param basePoint 基础积分
 * @param multiplier 打工票倍率
 * @returns 向上取整后的积分
 */
function calculateTicketPoint(basePoint: number, multiplier: number): number {
  return Math.ceil(basePoint * multiplier * TICKET_MULTIPLIER_CONFIG.pointCoefficient);
}

/**
 * 计算打工票消耗所需的票数
 * @param multiplier 打工票倍率
 * @param ticket 单倍打工票消耗所需的票数
 * @returns 票数
 */
function calculateTicketCount(multiplier: number, ticket: number): number {
  return multiplier * ticket;
}

/**
 * 生成 Anniversary 活动的完整游玩选项列表
 *
 * Anniversary 特点：
 * 1. 打工票倍率范围更大：15→1 × 0.7
 * 2. 有推荐曲（1.2倍体力消费）
 * 3. Million Mix 推荐曲可 PUSH + 打工票组合
 * 4. 活动曲积分较低：537（Theater 是 634）
 * 5. 活动曲所有倍率始终可用，不依赖活动折返
 *
 * 曲目类型区分：
 * - 通常曲：体力等倍消费，打工票等倍消费
 * - 推荐曲：体力1.2倍消费，打工票+PUSH组合（仅MM）
 *
 * 生成顺序：
 * 1. 活动曲（消耗活动道具）
 * 2. 体力消耗-通常曲（按体力消耗大到小）
 * 3. 体力消耗-推荐曲（按体力消耗大到小）
 * 4. 打工票消耗-推荐曲（仅MM，倍率从大到小）- 优先级最高
 * 5. 打工票消耗-通常曲（按体力消耗大到小，倍率从大到小）
 *
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateAnniversaryChoices(): EventChoice[] {
  const entries: EventChoice[] = [];

  // 1. 活动曲（消耗活动道具获得大量积分）
  // 1a. 活动曲（4倍消费）
  entries.push({
    name: ANNIVERSARY_EVENT_LIVE_CONFIG.name,
    type: '活动曲',
    multiplier: '4倍',
    pt: ANNIVERSARY_EVENT_LIVE_CONFIG.pt * 4,
    token: ANNIVERSARY_EVENT_LIVE_CONFIG.token * 4,
  });

  // 1b. 活动曲（2倍消费）
  entries.push({
    name: ANNIVERSARY_EVENT_LIVE_CONFIG.name,
    type: '活动曲',
    multiplier: '2倍',
    pt: ANNIVERSARY_EVENT_LIVE_CONFIG.pt * 2,
    token: ANNIVERSARY_EVENT_LIVE_CONFIG.token * 2,
  });

  // 1c. 活动曲（1倍消费）
  entries.push({
    name: ANNIVERSARY_EVENT_LIVE_CONFIG.name,
    type: '活动曲',
    multiplier: ANNIVERSARY_EVENT_LIVE_CONFIG.multiplier,
    pt: ANNIVERSARY_EVENT_LIVE_CONFIG.pt,
    token: ANNIVERSARY_EVENT_LIVE_CONFIG.token,
  });

  // 2. 体力消耗 - 推荐曲（体力1.2倍）
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

  // 3. 体力消耗 - 通常曲
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
 * 1. 活动曲（消耗活动道具）
 * 2. 体力消耗（体力等倍，按体力消耗大到小）
 * 3. 打工票消耗（按体力消耗大到小，倍率从大到小）
 *
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTheaterChoices(isBoostPeriod: boolean = true): EventChoice[] {
  const entries: EventChoice[] = [];

  // 1. 活动曲（消耗活动道具获得大量积分）
  // 1a. 活动曲（4倍消费，仅活动折返后可用）
  if (isBoostPeriod) {
    entries.push({
      name: EVENT_LIVE_CONFIG_FOR_PARKING.name,
      type: '活动曲',
      multiplier: '4倍',
      pt: EVENT_LIVE_CONFIG_FOR_PARKING.pt * 4,
      token: EVENT_LIVE_CONFIG_FOR_PARKING.token * 4,
    });
  }

  // 1b. 活动曲（2倍消费，仅活动折返后可用）
  if (isBoostPeriod) {
    entries.push({
      name: EVENT_LIVE_CONFIG_FOR_PARKING.name,
      type: '活动曲',
      multiplier: '2倍',
      pt: EVENT_LIVE_CONFIG_FOR_PARKING.pt * 2,
      token: EVENT_LIVE_CONFIG_FOR_PARKING.token * 2,
    });
  }

  // 1c. 活动曲（1倍消费，始终可用）
  entries.push({
    name: EVENT_LIVE_CONFIG_FOR_PARKING.name,
    type: '活动曲',
    multiplier: '1倍',
    pt: EVENT_LIVE_CONFIG_FOR_PARKING.pt,
    token: EVENT_LIVE_CONFIG_FOR_PARKING.token,
  });

  // 2. 体力消耗（体力等倍，按体力消耗大到小）
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: '1倍',
      pt: song.value,
      token: song.value,
    });
  }

  // 3. 打工票消耗（按体力消耗大到小，倍率从大到小）
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
 * 1. 1.5 倍分数加成（只对积分有效，对活动道具无效）
 * 2. 打工票倍率与 Theater 相同：10→1 × 0.7
 * 3. 活动曲有 1倍/2倍/4倍 三个版本
 *
 * 计算规则：
 * - 体力消费：活动道具 = 基础积分，积分 = ceil(活动道具 × 1.5)
 * - 打工票消费：活动道具 = ceil(基础积分 × 倍率)，积分 = ceil(活动道具 × 1.5)
 * - 活动曲：直接使用配置值（三个版本）
 *
 * 生成顺序：
 * 1. 活动曲（三个版本，消耗活动道具）
 * 2. 体力消耗（体力等倍，按体力消耗大到小）
 * 3. 打工票消耗（按体力消耗大到小，倍率从大到小）
 *
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTrustChoices(isBoostPeriod: boolean = true): EventChoice[] {
  const entries: EventChoice[] = [];

  // 1. 活动曲（消耗活动道具获得大量积分）
  // 注意：活动曲不设置 extra 属性，不参与更多倍率筛选
  // 1a. 活动曲（4倍消费，仅活动折返后可用）
  if (isBoostPeriod) {
    const config4x = TRUST_EVENT_LIVE_CONFIGS.find((c) => c.multiplier === '4倍');
    if (config4x) {
      entries.push({
        name: config4x.name,
        type: '活动曲',
        multiplier: config4x.multiplier,
        pt: config4x.pt,
        token: config4x.token,
      });
    }
  }

  // 1b. 活动曲（2倍消费，仅活动折返后可用）
  if (isBoostPeriod) {
    const config2x = TRUST_EVENT_LIVE_CONFIGS.find((c) => c.multiplier === '2倍');
    if (config2x) {
      entries.push({
        name: config2x.name,
        type: '活动曲',
        multiplier: config2x.multiplier,
        pt: config2x.pt,
        token: config2x.token,
      });
    }
  }

  // 1c. 活动曲（1倍消费，始终可用）
  const config1x = TRUST_EVENT_LIVE_CONFIGS.find((c) => c.multiplier === '1倍');
  if (config1x) {
    entries.push({
      name: config1x.name,
      type: '活动曲',
      multiplier: config1x.multiplier,
      pt: config1x.pt,
      token: config1x.token,
    });
  }

  // 2. 体力消耗（体力等倍）
  // 活动道具 = 基础积分，积分 = ceil(活动道具 × 1.5)
  for (const song of SONG_CONFIGS_FOR_PARKING) {
    const pt = Math.ceil(song.value * TRUST_POINT_BONUS);
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: '1倍',
      pt: pt,
      token: song.value, // 活动道具不受分数加成影响
    });
  }

  // 3. 打工票消耗
  // 活动道具 = ceil(基础积分 × 倍率)，积分 = ceil(活动道具 × 1.5)
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
 * 生成 Tune 活动的完整游玩选项列表
 *
 * Tune 特点：
 * 1. 获得pt加成（bonus）影响活动曲积分
 * 2. 活动折返（isBoostPeriod）解锁活动曲 2倍/4倍 消费
 * 3. 歌曲配置不同：2 Mix(25), 2 Mix+(52), 4 Mix(39), 6 Mix(54), Million Mix(75)
 * 4. 打工票倍率降序排列（10→1 × 0.7），与其他活动一致
 * 5. 体力/打工票游玩获得道具（token > 0），活动曲消耗道具（token < 0）
 *
 * 计算规则：
 * - 体力消费：获得积分 = 基础积分，获得道具 = 基础积分
 * - 打工票消费：获得积分 = ceil(基础积分 × 倍率)，获得道具 = ceil(基础积分 × 倍率)
 * - 活动曲消费：获得积分 = ceil(490 × 倍率 × (100 + bonus) / 100)，消耗道具 = -140 × 倍率
 *
 * 生成顺序：
 * 1. 活动曲（4倍消费，仅 isBoostPeriod）
 * 2. 活动曲（2倍消费，仅 isBoostPeriod）
 * 3. 活动曲（1倍消费，始终可用）
 * 4. 体力消耗（按体力消耗大到小）
 * 5. 打工票消耗（按体力消耗大到小，倍率从大到小）
 *
 * @param bonus 获得pt加成百分比（0-30），默认30
 * @param isBoostPeriod 活动折返（解锁高倍率消费），默认 false
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTuneChoices(bonus: number = 30, isBoostPeriod: boolean = true): EventChoice[] {
  const entries: EventChoice[] = [];

  // 1. 活动曲（4倍消费，仅活动折返后可用）
  if (isBoostPeriod) {
    const trigger = -(TUNE_EVENT_LIVE_TRIGGER_BASE * 4);
    const point = Math.ceil((TUNE_EVENT_LIVE_BASE_POINT * 4 * (100 + bonus)) / 100);
    entries.push({
      name: '活动曲',
      type: '活动曲',
      multiplier: '4倍',
      pt: point,
      token: trigger,
    });
  }

  // 2. 活动曲（2倍消费，仅活动折返后可用）
  if (isBoostPeriod) {
    const trigger = -(TUNE_EVENT_LIVE_TRIGGER_BASE * 2);
    const point = Math.ceil((TUNE_EVENT_LIVE_BASE_POINT * 2 * (100 + bonus)) / 100);
    entries.push({
      name: '活动曲',
      type: '活动曲',
      multiplier: '2倍',
      pt: point,
      token: trigger,
    });
  }

  // 3. 活动曲（1倍消费，始终可用）
  const trigger1x = -(TUNE_EVENT_LIVE_TRIGGER_BASE * 1);
  const point1x = Math.ceil((TUNE_EVENT_LIVE_BASE_POINT * 1 * (100 + bonus)) / 100);
  entries.push({
    name: '活动曲',
    type: '活动曲',
    multiplier: '1倍',
    pt: point1x,
    token: trigger1x,
  });

  // 4. 体力消耗（体力等倍，按体力消耗大到小）
  for (const song of TUNE_SONG_CONFIGS) {
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: '1倍',
      pt: song.value,
      token: song.value, // 体力游玩获得道具
    });
  }

  // 5. 打工票消耗（降序倍率，与其他活动一致）
  const multipliers = Array.from(
    { length: TUNE_TICKET_CONFIG.maxMultiplier },
    (_, i) => TUNE_TICKET_CONFIG.maxMultiplier - i,
  );
  for (const song of TUNE_SONG_CONFIGS) {
    for (const multiplier of multipliers) {
      const ticketPoint = Math.ceil(song.value * multiplier * TUNE_TICKET_CONFIG.pointCoefficient);
      entries.push({
        name: song.name,
        type: '打工票',
        multiplier: `${(multiplier * TUNE_TICKET_CONFIG.pointCoefficient).toFixed(1)} 倍`,
        pt: ticketPoint,
        token: ticketPoint,
        extra: multiplier < TUNE_TICKET_CONFIG.maxMultiplier,
      });
    }
  }

  return entries;
}

/**
 * Tour 活动歌曲配置
 * @description 用于动态生成游玩选项
 */
const TOUR_SONG_CONFIGS = [
  { name: '2 Mix', point: 58, progress: 3, multiplier: 1 },
  { name: '2 Mix', point: 70, progress: 3, multiplier: 1.2 },
  { name: '4 Mix', point: 77, progress: 4, multiplier: 1 },
  { name: '4 Mix', point: 93, progress: 4, multiplier: 1.2 },
  { name: '6 Mix', point: 96, progress: 5, multiplier: 1 },
  { name: '6 Mix', point: 116, progress: 5, multiplier: 1.2 },
  { name: 'Million Mix', point: 116, progress: 6, multiplier: 1 },
  { name: 'Million Mix', point: 140, progress: 6, multiplier: 1.2 },
] as const;

/**
 * Tour 活动曲配置（消耗道具）
 * @description 消耗活动道具获得大量积分
 */
const TOUR_EVENT_LIVE_CONFIGS = [
  { name: '活动曲', point: 720, trigger: -1, multiplier: '1倍' },
  { name: '活动曲', point: 1440, trigger: -2, multiplier: '2倍' },
  { name: '活动曲', point: 2160, trigger: -3, multiplier: '3倍' },
] as const;

/**
 * Treasure 活动歌曲配置
 * @description Platinum Star Treasure 活动中所有可用的游玩方式
 */
const TREASURE_SONG_CONFIGS: { name: string; value: number }[] = [
  { name: '2 Mix', value: 71 },
  { name: '4 Mix', value: 203 },
  { name: '6 Mix', value: 335 },
  { name: 'Million Mix', value: 467 },
];

/** Treasure 活动曲基础积分（元気等倍，不计 bonus） */
const TREASURE_EVENT_LIVE_BASE_POINT = 1500;

/** Treasure 打工票倍率配置（从 4 到 1，每个乘以 0.7） */
const TREASURE_TICKET_CONFIG = {
  maxMultiplier: 4,
  pointCoefficient: 0.7,
} as const;

/**
 * 生成 Treasure 打工票倍率数组（降序：[2.8, 2.1, 1.4, 0.7]）
 */
function generateTreasureTicketMultipliers(): number[] {
  const multipliers: number[] = [];
  for (let i = TREASURE_TICKET_CONFIG.maxMultiplier; i >= 1; i--) {
    multipliers.push(i * TREASURE_TICKET_CONFIG.pointCoefficient);
  }
  return multipliers;
}

/**
 * 生成 Treasure 活动的完整游玩选项列表
 *
 * 生成顺序按以下优先级排序：
 * 1. 体力在前，打工票在后
 * 2. 组曲在前，单首在后
 * 3. Million Mix 在前，后续为 6 Mix → 4 Mix → 2 Mix
 * 4. 倍率高在前，倍率低在后
 *
 * 共 4 歌曲 × 10 步 = 40 个选项
 *
 * @param bonus 获得pt加成倍率（1.0 ~ 1.7，步进 0.05）
 * @param isBoostPeriod 活动折返（解锁 2.8倍 打工票），默认 true
 * @returns 按优先级排列的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTreasureChoices(
  bonus: number = 1.7,
  isBoostPeriod: boolean = true,
): EventChoice[] {
  const entries: EventChoice[] = [];
  const ticketMultipliers = generateTreasureTicketMultipliers();
  const maxTicketMag = ticketMultipliers[0]; // 2.8（4 × 0.7）

  // 歌曲顺序：Million Mix → 6 Mix → 4 Mix → 2 Mix
  const songOrder = ['Million Mix', '6 Mix', '4 Mix', '2 Mix'];
  const sortedSongs = [...TREASURE_SONG_CONFIGS].sort(
    (a, b) => songOrder.indexOf(a.name) - songOrder.indexOf(b.name),
  );

  // 1. 体力（组曲 → 单首）
  // 1a. 体力 组曲（所有歌曲 MM → 6M → 4M → 2M）
  for (const song of sortedSongs) {
    const { name, value } = song;
    const lifePoint = Math.ceil(value * bonus);
    const eventLifePoint = Math.ceil(TREASURE_EVENT_LIVE_BASE_POINT * bonus);
    const life4thPt = eventLifePoint + lifePoint * 3;
    entries.push({
      name: `${name} [组曲]`,
      type: '体力',
      multiplier: '1倍',
      pt: life4thPt,
      token: 0,
    });
  }

  // 1b. 体力 单首（所有歌曲 MM → 6M → 4M → 2M）
  for (const song of sortedSongs) {
    const { name, value } = song;
    const lifePoint = Math.ceil(value * bonus);
    entries.push({
      name: `${name} [单首]`,
      type: '体力',
      multiplier: '1倍',
      pt: lifePoint,
      token: 0,
    });
  }

  // 2. 打工票（组曲 → 单首）
  // 2a. 打工票 组曲（每首歌曲 MM → 6M → 4M → 2M，倍率从大到小）
  for (const song of sortedSongs) {
    const { name, value } = song;
    for (const mag of ticketMultipliers) {
      if (!isBoostPeriod && mag === maxTicketMag) continue;
      const ticketEventPt = Math.ceil(TREASURE_EVENT_LIVE_BASE_POINT * bonus * mag);
      const ticketSongPt = Math.ceil(value * bonus * mag);
      const total4thPt = ticketEventPt + ticketSongPt * 3;
      entries.push({
        name: `${name} [组曲]`,
        type: '打工票',
        multiplier: `${mag.toFixed(1)}倍`,
        pt: total4thPt,
        token: 0,
        extra: mag !== maxTicketMag,
      });
    }
  }

  // 2b. 打工票 单首（每首歌曲 MM → 6M → 4M → 2M，倍率从大到小）
  for (const song of sortedSongs) {
    const { name, value } = song;
    for (const mag of ticketMultipliers) {
      if (!isBoostPeriod && mag === maxTicketMag) continue;
      const ticketSongPt = Math.ceil(value * bonus * mag);
      entries.push({
        name: `${name} [单首]`,
        type: '打工票',
        multiplier: `${mag.toFixed(1)}倍`,
        pt: ticketSongPt,
        token: 0,
        extra: mag !== maxTicketMag,
      });
    }
  }

  return entries;
}

/**
 * Tale 活动步骤配置
 * @description Platinum Star Tale 活动中所有可用的游玩方式及其对应的积分和进度变化
 *
 * 说明：
 * - "进度"为活动进度条，每首 3rd 歌曲增加 20-50 进度
 * - 当进度达到 100 时，Event Live 出现，消耗 100 进度获得 3000 pt
 * - 1st/2nd 标注表示需要在该曲目后退出组曲，进度 +0
 * - 3rd 曲目正常游玩并增加进度
 */
const TALE_CHOICE_CONFIGS = [
  // Event Live（消耗进度，获得大量积分）
  {
    name: '活动曲',
    type: '活动曲',
    multiplier: '1倍',
    pt: 3000,
    progress: -100,
  },
  // 3rd 阶段（正常游玩，增加进度）
  {
    name: 'Million Mix',
    type: '3rd',
    multiplier: '1倍',
    pt: 600,
    progress: 50,
  },
  {
    name: '6 Mix',
    type: '3rd',
    multiplier: '1倍',
    pt: 540,
    progress: 40,
  },
  {
    name: '4 Mix',
    type: '3rd',
    multiplier: '1倍',
    pt: 483,
    progress: 30,
  },
  {
    name: '2 Mix',
    type: '3rd',
    multiplier: '1倍',
    pt: 426,
    progress: 20,
  },
  // 2nd 阶段（2曲游玩后退出组曲，进度不变）
  {
    name: 'Million Mix',
    type: '2nd',
    multiplier: '1倍',
    pt: 400,
    progress: 0,
  },
  {
    name: '6 Mix',
    type: '2nd',
    multiplier: '1倍',
    pt: 360,
    progress: 0,
  },
  {
    name: '4 Mix',
    type: '2nd',
    multiplier: '1倍',
    pt: 322,
    progress: 0,
  },
  {
    name: '2 Mix',
    type: '2nd',
    multiplier: '1倍',
    pt: 284,
    progress: 0,
  },
  // 1st 阶段（1曲游玩后退出组曲，进度不变）
  {
    name: 'Million Mix',
    type: '1st',
    multiplier: '1倍',
    pt: 200,
    progress: 0,
  },
  {
    name: '6 Mix',
    type: '1st',
    multiplier: '1倍',
    pt: 180,
    progress: 0,
  },
  {
    name: '4 Mix',
    type: '1st',
    multiplier: '1倍',
    pt: 161,
    progress: 0,
  },
  {
    name: '2 Mix',
    type: '1st',
    multiplier: '1倍',
    pt: 142,
    progress: 0,
  },
] as const;

/**
 * 生成 Tale 活动的游玩选项列表
 *
 * Tale 特点：
 * 1. 不使用道具系统，使用进度（進捗）系统
 * 2. 进度 < 100 时不能打活动曲（Event Live）
 * 3. 进度 ≥ 100 时必须先打活动曲消耗进度
 * 4. 1st/2nd 退出组曲策略：获得积分但不增加进度
 * 5. 3rd 正常游玩：获得积分并增加进度
 *
 * 生成顺序：
 * 1. 活动曲（消耗进度）
 * 2. 3rd 阶段（增加进度，按 pt 降序）
 * 3. 2nd 阶段（进度不变，按 pt 降序）
 * 4. 1st 阶段（进度不变，按 pt 降序）
 *
 * @returns 按原始顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTaleChoices(): EventChoice[] {
  return TALE_CHOICE_CONFIGS.map((c) => ({
    name: c.name,
    type: c.type,
    multiplier: c.multiplier,
    pt: c.pt,
    token: 0, // Tale 不使用道具系统
    progress: c.progress,
  }));
}

/**
 * 生成 Tour 活动的游玩选项列表
 *
 * Tour 特点：
 * 1. 活动曲消耗道具获得大量积分，需要5倍进度满足条件
 * 2. 歌曲游玩获得积分并增加5倍进度
 * 3. 道具进度满 20 转换 1 个道具
 * 4. 5倍进度上限 40
 *
 * 生成顺序：
 * 1. 活动曲（消耗道具，按积分降序）
 * 2. 歌曲游玩（不消耗道具，按积分降序）
 *
 * @returns 按积分降序排列的选项列表
 */
function generateTourChoices(isBoostPeriod: boolean = true): EventChoice[] {
  const entries: EventChoice[] = [];

  // 1. 活动曲（消耗道具）
  for (const config of TOUR_EVENT_LIVE_CONFIGS) {
    // 3倍活动曲仅在活动折返后可用
    if (config.trigger === -3 && !isBoostPeriod) continue;
    entries.push({
      name: config.name,
      type: '活动曲',
      multiplier: config.multiplier,
      pt: config.point,
      token: config.trigger,
      progress: 0, // 活动曲不增加5倍进度
    });
  }

  // 2. 歌曲游玩（不消耗道具，获得积分和进度）
  for (const song of TOUR_SONG_CONFIGS) {
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: `${song.multiplier}倍`,
      pt: song.point,
      token: 0, // 不消耗道具
      progress: song.progress,
    });
  }

  // 按积分降序排序
  return entries.sort((a, b) => b.pt - a.pt);
}

/**
 * MLTD 活动控分相关函数
 */
export const MLTD_PARKING_CONSTANTS = {
  /** Theater 活动剧场选择项生成器（需要 isBoostPeriod 参数） */
  generateTheaterChoices,

  /** Anniversary 活动剧场选择项生成器（需要 isBoostPeriod 参数） */
  generateAnniversaryChoices,

  /** Trust 活动剧场选择项生成器（需要 isBoostPeriod 参数） */
  generateTrustChoices,

  /** Tune 活动剧场选择项生成器（需要 bonus 和 isBoostPeriod 参数） */
  generateTuneChoices,

  /** Tour 活动剧场选择项生成器 */
  generateTourChoices,

  /** Tale 活动剧场选择项生成器 */
  generateTaleChoices,

  /** Treasure 活动剧场选择项生成器（需要 bonus 参数） */
  generateTreasureChoices,
} as const;

/**
 * 活动控分注意事项（显示在表单区域的警告提示）
 */
export const EVENT_PARKING_NOTICES = {
  theater: [
    '活动曲 2倍/4倍 消费仅在活动折返后可用',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
  anniversary: [
    '周年活动有每日推荐曲和普通曲的区别，推荐曲有 1.2 倍奖励',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
  trust: [
    '注意：积分加成以 1.5 倍为前提',
    '活动曲 2倍/4倍 消费仅在活动折返后可用',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
  tune: [
    '获得pt加成最大为 30%，仅对活动曲积分有效',
    '活动曲 2倍/4倍 消费仅在活动折返后可用',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
  tour: [
    '活动曲需要在5倍进度达到 40 后才能使用',
    '3倍活动曲额外需要在活动折返后才能使用',
    '道具进度满 20 自动转换 1 个道具',
  ],
  tale: [
    '活动进度达到 100 后出现活动曲，消耗 100 进度获得 3000pt',
    '1st/2nd 阶段退出组曲，进度不变但获得较少积分',
    '完成 3rd 阶段会增加进度并获得更多积分',
    '进度 ≥ 100 时，溢出的进度不显示，此时强烈建议先打活动曲消耗进度，否则可能导致错误的输入和计算结果',
  ],
  treasure: [
    '[单首] 表示单次游玩，[组曲] 表示3首通常曲 + 活动曲的组合',
    '获得pt加成倍率影响所有积分计算（与 Tune 活动的百分比加成不同）',
    '2.8倍 打工票仅在活动折返后可用',
  ],
} as const;

/**
 * 活动控分计算说明
 */
export const EVENT_PARKING_TIPS = {
  theater: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    '使用打工票游玩普通曲时：基础积分 × 打工票倍率（向上取整）',
    '活动曲有 1倍/2倍/4倍 三种消费倍率，2倍/4倍仅在活动折返后可用',
  ],
  anniversary: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    '使用打工票游玩普通曲时：基础积分 × 打工票倍率（向上取整）',
    '消耗体力游玩推荐曲时：基础积分 × 1.2（向上取整）',
    '使用打工票游玩推荐曲时：(基础积分 × 1.2（向上取整）) × 打工票倍率（向上取整）',
    '活动曲有 1倍/2倍/4倍 三种消费倍率',
  ],
  trust: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    '所有积分享受 1.5 倍分数加成（向上取整），道具不受影响',
    '消耗体力游玩时：基础积分 × 1.5（向上取整）',
    '使用打工票游玩时：(基础积分 × 打工票倍率（向上取整）) × 1.5（向上取整）',
    '活动曲有 1倍/2倍/4倍 三种消费倍率，2倍/4倍仅在活动折返后可用',
  ],
  tune: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    '使用打工票游玩时：基础积分 × 打工票倍率（向上取整）',
    '活动曲积分公式：基础积分 × 消费倍率 × (100 + 获得积分加成百分比) / 100（向上取整）',
    '活动曲有 1倍/2倍/4倍 三种消费倍率，2倍/4倍仅在活动折返后可用',
  ],
  tour: [
    '歌曲游玩不消耗道具，获得积分并增加5倍进度',
    '活动曲需要在5倍进度达到 40 后才能使用，消耗道具获得大量积分，并重置5倍进度为 0',
    '3倍活动曲额外需要在活动折返后才能使用',
  ],
  tale: [
    '1st/2nd 阶段退出组曲，进度不变但获得较少积分',
    '3rd 阶段正常游玩，增加进度 20-50 并获得较多积分',
    '活动曲需要活动进度达到 100 后才能使用，消耗 100 进度获得 3000 积分',
  ],
  treasure: [
    '消耗 1 倍体力游玩通常曲：积分 = 基础积分 × 获得积分加成倍率（向上取整）',
    '使用打工票游玩通常曲：积分 = 基础积分 × 获得积分加成倍率 × 打工票倍率（向上取整）',
    '[组曲] 体力：积分 = (活动曲基础积分 + 基础积分 × 3) × 加成倍率（各步向上取整）',
    '[组曲] 打工票：积分 = (活动曲基础积分 + 基础积分 × 3) × 加成倍率 × 打工票倍率（各步向上取整）',
    '打工票倍率 4 档：2.8 / 2.1 / 1.4 / 0.7，其中 2.8倍 仅在活动折返后可用',
  ],
} as const;
