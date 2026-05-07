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
function generateAnniversaryChoices(): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

  // 1. 活动曲（消耗活动道具获得大量积分）
  entries.push({
    name: ANNIVERSARY_EVENT_LIVE_CONFIG.name,
    type: '',
    multiplier: ANNIVERSARY_EVENT_LIVE_CONFIG.multiplier,
    pt: ANNIVERSARY_EVENT_LIVE_CONFIG.pt,
    token: ANNIVERSARY_EVENT_LIVE_CONFIG.token,
  });

  // 2. 体力消耗 - 通常曲（体力等倍）
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

  // 3. 体力消耗 - 推荐曲（体力1.2倍）
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
 * 1. 活动曲（消耗活动道具）
 * 2. 体力消耗（体力等倍，按体力消耗大到小）
 * 3. 打工票消耗（按体力消耗大到小，倍率从大到小）
 *
 * @returns 按固定顺序生成的选项列表（搜索算法中会按 pt 降序排序）
 */
function generateTheaterChoices(): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

  // 1. 活动曲（消耗活动道具获得大量积分）
  entries.push({
    name: EVENT_LIVE_CONFIG_FOR_PARKING.name,
    type: '',
    multiplier: EVENT_LIVE_CONFIG_FOR_PARKING.multiplier,
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
function generateTrustChoices(): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

  // 1. 活动曲（三个版本，消耗活动道具获得大量积分）
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
function generateTuneChoices(
  bonus: number = 30,
  isBoostPeriod: boolean = true,
): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

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
      neededForStep: '活动曲',
      mag: '4',
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
      neededForStep: '活动曲',
      mag: '2',
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
    neededForStep: '活动曲',
    mag: '1',
  });

  // 4. 体力消耗（体力等倍，按体力消耗大到小）
  for (const song of TUNE_SONG_CONFIGS) {
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: '1倍',
      pt: song.value,
      token: song.value, // 体力游玩获得道具
      neededForStep: '体力',
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
        neededForStep: '打工票',
        mag: (multiplier * TUNE_TICKET_CONFIG.pointCoefficient).toFixed(1),
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
  { name: 'Million Mix', point: 116, progress: 6, multiplier: 1 },
  { name: 'Million Mix', point: 140, progress: 6, multiplier: 1.2 },
] as const;

/**
 * Tour Event Live 配置（消耗道具）
 * @description 消耗活动道具获得大量积分
 */
const TOUR_EVENT_LIVE_CONFIGS = [
  { name: 'Event Live', point: 720, trigger: -1, mag: '1' },
  { name: 'Event Live', point: 1440, trigger: -2, mag: '2' },
  { name: 'Event Live', point: 2160, trigger: -3, mag: '3' },
] as const;

/**
 * 生成 Tour 活动的游玩选项列表
 *
 * Tour 特点：
 * 1. Event Live 消耗道具获得大量积分，需要 Live 进度满足条件
 * 2. 歌曲游玩获得积分并增加 Live 进度
 * 3. 道具进度满 20 转换 1 个道具
 * 4. 未折返时 Live 进度上限 40
 *
 * 生成顺序：
 * 1. Event Live（消耗道具，按积分降序）
 * 2. 歌曲游玩（不消耗道具，按积分降序）
 *
 * @returns 按积分降序排列的选项列表
 */
function generateTourChoices(): EventTheaterChoice[] {
  const entries: EventTheaterChoice[] = [];

  // 1. Event Live（消耗道具）
  for (const config of TOUR_EVENT_LIVE_CONFIGS) {
    entries.push({
      name: config.name,
      type: '活动曲',
      multiplier: `${config.mag}倍`,
      pt: config.point,
      token: config.trigger,
      neededForStep: 'trigger',
      mag: config.mag,
      progress: 0, // Event Live 不增加 Live 进度
    });
  }

  // 2. 歌曲游玩（不消耗道具，获得积分和进度）
  for (const song of TOUR_SONG_CONFIGS) {
    const is1_2x = song.multiplier === 1.2;
    entries.push({
      name: song.name,
      type: '体力',
      multiplier: `${song.multiplier}倍`,
      pt: song.point,
      token: 0, // 不消耗道具
      neededForStep: is1_2x ? 'life1.2' : 'life',
      progress: song.progress,
    });
  }

  // 按积分降序排序
  return entries.sort((a, b) => b.pt - a.pt);
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

  /** Tune 活动剧场选择项生成器（需要 bonus 和 isEnded 参数） */
  generateTuneChoices,

  /** Tour 活动剧场选择项列表（动态生成） */
  eventTourChoices: generateTourChoices(),
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
    '注意：积分加成以 1.5 倍为前提',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
  tune: [
    '注意：积分加成最大为 1.3 倍',
    '由于向上取整，消耗1倍打工票游玩两次，与消耗2倍打工票游玩一次的结果可能并不一样',
  ],
  tour: [
    '5倍活动曲需要在进度达到限制后才能使用',
    '道具进度满 20 自动转换 1 个道具',
    '进度上限为 40',
  ],
} as const;

/**
 * 活动控分计算说明
 */
export const EVENT_PARKING_TIPS = {
  theater: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    '使用打工票游玩普通曲时的计算公式：基础积分 × 打工票倍率（向上取整）',
  ],
  anniversary: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    '使用打工票游玩普通曲时的计算公式：基础积分 × 打工票倍率（向上取整）',
    '消耗体力游玩推荐曲（PUSH）时的计算公式：基础积分 × 1.2倍奖励（向上取整）',
    '使用打工票游玩推荐曲（PUSH）时的计算公式：(基础积分 × 1.2倍奖励（向上取整)) × 打工票倍率（向上取整）',
  ],
  trust: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    'Trust 活动有 1.5 倍分数加成，只对积分有效，对活动道具无效',
    '消耗体力游玩时的计算公式：基础积分 × 1.5倍分数加成（向上取整）',
    '使用打工票游玩时的计算公式：(基础积分 × 打工票倍率（向上取整)) × 1.5倍分数加成（向上取整）',
  ],
  tune: [
    '消耗 1 倍体力游玩时获得的积分即为基础积分',
    'Trust 活动有最大 1.3 倍分数加成，只对活动曲积分有效，对普通曲无效',
    '使用打工票游玩时的计算公式：基础积分 × 打工票倍率（向上取整）',
    '活动曲积分公式：基础积分 × 消费倍率 × (100 + 获得pt加成百分比) / 100（向上取整）',
  ],
  tour: [
    '歌曲游玩不消耗道具，获得积分并增加 Live 进度',
    'Event Live 消耗道具获得大量积分，并重置 Live 进度为 0',
  ],
} as const;
