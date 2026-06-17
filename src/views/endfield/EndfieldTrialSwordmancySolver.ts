/**
 * DP 求解器
 *
 * 玩家从牌组抽 5 张"铭牌"（等级 1~5），累计点数对奖励表长度取模得到奖励。
 * 核心决策：继续抽 / 翻倍 / 结算 / 放弃，最大化当日总期望收益。
 */

/** 溢出厌恶心理模型参数 */
export interface OverflowParams {
  /**
   * 比例衰减系数 0~1，每溢出 1 圈奖励乘以此值
   * 连续溢出 n 圈时奖励乘以 aversionFactor^n，该值越小溢出厌恶越强
   */
  aversionFactor: number;
  /**
   * 固定扣除值，每溢出 1 圈扣除一次，结果可为负
   * 每次溢出扣除固定数额作为惩罚，可用来模拟极端厌恶型玩家
   */
  fixedPenalty: number;
}

/** 当前状态的实时建议 */
export interface AdviceResult {
  currentReward: number;
  expectedContinueReward: number | null;
  expectedToday: number;
  optimalAction: 'stop' | 'continue' | 'must_continue' | 'must_stop' | 'double' | 'abandon';
  drawTotal: number | null;
  doubleTotal: number | null;
  stopTotal: number | null;
  abandonTotal: number | null;
  expectedAfterStop: number;
  distribution: number[];
  abandonProb: number;
}

/** 内部 DP 复合返回类型：期望值 + 战力点概率分布 */
interface DpResult {
  ev: number;
  distribution: number[];
  abandonProb: number;
}

/**
 * 简易 LRU 缓存，最多存放 maxSize 个条目，超限时淘汰最久未访问的条目
 */
class LRUCache<V> {
  private maxSize: number;
  private map: Map<string, { value: V; lastAccessed: number }>;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.map = new Map();
  }

  /** 获取缓存条目，更新最后访问时间 */
  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.value;
    }
    return undefined;
  }

  /** 设置缓存条目，超限时淘汰最久未访问的条目 */
  set(key: string, value: V): void {
    if (this.map.has(key)) {
      this.map.get(key)!.value = value;
      this.map.get(key)!.lastAccessed = Date.now();
      return;
    }
    if (this.map.size >= this.maxSize) {
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [k, v] of this.map) {
        if (v.lastAccessed < lruTime) {
          lruTime = v.lastAccessed;
          lruKey = k;
        }
      }
      if (lruKey) this.map.delete(lruKey);
    }
    this.map.set(key, { value, lastAccessed: Date.now() });
  }

  /** 清空所有缓存 */
  clear(): void {
    this.map.clear();
  }
}

/**
 * 生成缓存键，由牌组、奖励表、溢出参数唯一决定一组 DP 结果
 * @param deck - 牌组各等级数量
 * @param rewards - 奖励表
 * @param overflowParams - 溢出参数（可选）
 * @returns 缓存键字符串
 */
function cacheKey(deck: number[], rewards: number[], overflowParams?: OverflowParams): string {
  const deckK = deck.join(',');
  const rewardK = rewards.join(',');
  const paramK = overflowParams
    ? `${overflowParams.aversionFactor},${overflowParams.fixedPenalty}`
    : '';
  return `${deckK}|${rewardK}|${paramK}`;
}

/** 最多缓存 10 种不同（牌组 + 奖励表 + 溢出参数）组合 */
const MAX_CACHED_CONFIGS = 10;
/** 外层缓存：key=config → memo map，每种配置独立缓存 */
const adviceMemoCache = new LRUCache<Map<string, DpResult>>(MAX_CACHED_CONFIGS);

/**
 * 安全获取奖励值（防止越界）
 * @param rewards - 奖励表
 * @param s - 模位置
 * @returns 安全索引下的奖励值
 */
function safeReward(rewards: number[], s: number): number {
  const idx = Math.min(Math.max(0, s), rewards.length - 1);
  return rewards[idx]!;
}

/**
 * 计算调整后奖励（溢出厌恶模型）
 * @param rawReward - 原始奖励值
 * @param drawnValue - 已抽牌点数之和
 * @param modValue - 奖励表长度（模数）
 * @param params - 溢出厌恶参数（可选）
 * @returns 调整后的奖励值
 */
function computeAdjustedReward(
  rawReward: number,
  drawnValue: number,
  modValue: number,
  params?: OverflowParams,
): number {
  if (!params || (params.aversionFactor === 1 && params.fixedPenalty === 0)) return rawReward;
  const k = Math.floor(drawnValue / modValue); // k = 溢出圈数
  // 溢出调整公式：reward × a^k - k × p
  // a = aversionFactor, p = fixedPenalty, k = floor(drawnValue / modValue)
  return rawReward * Math.pow(params.aversionFactor, k) - k * params.fixedPenalty;
}

/**
 * 多局 + 翻倍 DP 求解：计算当前状态的最优行动建议
 *
 * ## 玩法概述
 * 玩家从牌组中抽取 5 个等级（1~5）的"铭牌"，累计抽牌点数对奖励表长度
 * 取模得到当前奖励。核心决策是：在当前抽牌结果下，选择继续抽、翻倍（本局奖励×2）、结算或放弃。
 *
 * ## DP 状态 (r1, r2, r3, r4, r5, M, P, D, A)
 *   r1~r5 = 牌组各等级剩余张数
 *   M     = 当前局倍率（1 或 2）
 *   P     = 今日剩余游玩次数（含当前局）
 *   D     = 今日剩余翻倍次数
 *   A     = 今日剩余放弃次数
 *
 * ## 可选行动
 *
 *   ### 继续抽（Draw）
 *     条件：已抽 < 5 张 且 牌组有剩余
 *     下一状态：(牌组扣除一张牌（5种情况）, 相同 M, P, D, A)，按抽牌的概率加权
 *     期望：evDraw = Σ 该等级概率 × EV(抽到该等级后的状态)
 *
 *   ### 翻倍（Double）
 *     条件：已抽 1~2 张、M=1（未翻倍）、D>0（有翻倍次数）
 *     下一状态：(牌组当前状态, M=2, P, D-1, A)
 *     期望：evDouble = EV(牌组当前状态, 倍率=2, D-1)
 *     注意：不立即产生奖励，后续结算时当前奖励 ×2
 *
 *   ### 结算（Stop）
 *     条件：已抽 > 0 张
 *     下一状态：即时获得当前奖励（调整后 × 倍率），然后重置进入下一局
 *              (牌组初始状态, M=1, P-1, D, A)
 *     期望：evStop = 当前奖励 + EV(下一局初态)
 *
 *   ### 放弃（Abandon）
 *     条件：已抽 > 0 张
 *     下一状态：重置牌组重新开局
 *       - A>0：用放弃次数，(牌组初始状态, 1, P, D+(M-1), A-1)
 *       - A=0：用游玩次数，(牌组初始状态, 1, P-1, D+(M-1), 0)
 *     期望：evAbandon = EV(重置后的状态)
 *     特殊规则：放弃时返还本局已消耗的翻倍次数 D+(M-1)，
 *             因为翻倍尚未兑现即作废
 *
 * ## 决策规则
 *   期望相同时按此优先级：翻倍 > 继续 > 放弃 > 停止
 *   已抽 0 张 → must_continue
 *   已抽满 5 张或无牌可抽 → 仅结算或放弃
 *
 * @param deck - 牌组初始各等级数量
 * @param rewards - 奖励表
 * @param drawnCounts - 当前已抽各等级（1~5）铭牌数量
 * @param doubled - 当前局是否已翻倍
 * @param remainingGames - 今日剩余游玩次数
 * @param remainingDoubles - 今日剩余翻倍次数
 * @param remainingAbandons - 今日剩余放弃次数
 * @param overflowParams - 溢出厌恶参数（可选）
 * @returns 最优行动建议，含各行动期望值、战力点概率分布等信息；输入非法时返回 null
 */
export function getCurrentAdvice(
  deck: number[],
  rewards: number[],
  drawnCounts: number[],
  doubled: boolean,
  remainingGames: number,
  remainingDoubles: number,
  remainingAbandons: number,
  overflowParams?: OverflowParams,
): AdviceResult | null {
  const modValue = rewards.length;
  const maxDraws = 5;

  if (
    drawnCounts.length !== 5 ||
    deck.length !== 5 ||
    rewards.length === 0 ||
    drawnCounts.some((c) => c < 0) ||
    deck.some((c) => c < 0) ||
    deck.some((c) => c > 99) ||
    remainingGames < 0 ||
    remainingDoubles < 0 ||
    remainingDoubles - (doubled ? 1 : 0) < 0 ||
    remainingAbandons < 0 ||
    drawnCounts.some((c, i) => c > deck[i]!)
  ) {
    return null;
  }

  const totalCards = deck.reduce((a, b) => a + b, 0);
  const initialTotal = deck.reduce((sum, count, i) => sum + count * (i + 1), 0);
  const deckInit = [...deck];

  const drawn = drawnCounts.reduce((a, b) => a + b, 0);
  if (drawn > maxDraws) return null;

  const drawnValue = drawnCounts.reduce((sum, count, i) => sum + count * (i + 1), 0);
  const slotIndex = ((drawnValue % modValue) + modValue) % modValue;
  const multiplier = doubled ? 2 : 1;
  const rawReward = safeReward(rewards, slotIndex);
  const currentReward =
    computeAdjustedReward(rawReward, drawnValue, modValue, overflowParams) * multiplier;

  const remaining = deck.map((d, i) => d - drawnCounts[i]!);
  const totalRemaining = remaining.reduce((a, b) => a + b, 0);
  const P = remainingGames;
  const D = remainingDoubles - (doubled ? 1 : 0);
  const A = remainingAbandons;

  const adviceKey = cacheKey(deck, rewards, overflowParams);
  const existingAdviceMemo = adviceMemoCache.get(adviceKey);
  const memo = existingAdviceMemo ?? new Map<string, DpResult>();
  if (!existingAdviceMemo) adviceMemoCache.set(adviceKey, memo);

  /**
   * DP 递归求解：计算当前状态下的最优期望值、概率分布和放弃概率
   *
   * @param r1 ~ r5 - 牌组各等级（1~5）剩余张数
   * @param M - 当前局倍率（1 或 2）
   * @param P - 今日剩余游玩次数（含当前局）
   * @param D - 今日剩余翻倍次数
   * @param A - 今日剩余放弃次数
   * @returns 包含最优期望值、战力点概率分布、放弃概率的结果
   */
  function dpDaily(
    r1: number,
    r2: number,
    r3: number,
    r4: number,
    r5: number,
    M: number,
    P: number,
    D: number,
    A: number,
  ): DpResult {
    const key = `${r1},${r2},${r3},${r4},${r5},${M},${P},${D},${A}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    // 边界：无剩余次数，期望为 0
    if (P === 0) {
      const r: DpResult = {
        ev: 0,
        distribution: new Array<number>(modValue).fill(0),
        abandonProb: 0,
      };
      memo.set(key, r);
      return r;
    }

    // 从剩余牌组反推当前局已抽状态
    const remainingCount = r1 + r2 + r3 + r4 + r5;
    const roundDrawn = totalCards - remainingCount;
    const roundPoints = initialTotal - (r1 * 1 + r2 * 2 + r3 * 3 + r4 * 4 + r5 * 5);
    const slotIndex = ((roundPoints % modValue) + modValue) % modValue;
    const rawSlotReward = safeReward(rewards, slotIndex);
    const adjustedReward = computeAdjustedReward(
      rawSlotReward,
      roundPoints,
      modValue,
      overflowParams,
    );
    const roundReward = adjustedReward * M;

    const remainingCards = [r1, r2, r3, r4, r5];

    const cannotStop = roundDrawn === 0;

    // [Draw] 按等级比例加权：evDraw = Σ prob_i × EV(下一状态)
    let evDraw = -Infinity;
    if (roundDrawn < maxDraws && remainingCount > 0) {
      evDraw = 0;
      for (let i = 0; i < 5; i++) {
        if (remainingCards[i]! > 0) {
          const prob = remainingCards[i]! / remainingCount;
          const next = [...remainingCards];
          next[i]!--;
          evDraw += prob * dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, M, P, D, A).ev;
        }
      }
    }

    // [Double] 条件 roundDrawn∈{1,2} ∧ M=1 ∧ D>0 → M=2, D-1
    let evDouble = -Infinity;
    if (roundDrawn > 0 && roundDrawn < 3 && M === 1 && D > 0) {
      evDouble = dpDaily(r1, r2, r3, r4, r5, 2, P, D - 1, A).ev;
    }

    // [Stop] 即时获得当前奖励, 重置进下一局: (deckInit, 1, P-1, D, A)
    let evStop = -Infinity;
    if (roundDrawn > 0) {
      evStop =
        roundReward +
        dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          D,
          A,
        ).ev;
    }

    // [Abandon] 重置牌组重新开局
    // A>0 → 用放弃次数, 保留游玩次数; A=0 → 用游玩次数, A 置 0
    // 返还翻倍 D+(M-1): 翻倍尚未兑现即作废
    let evAbandon = -Infinity;
    if (!cannotStop) {
      if (A > 0) {
        evAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P,
          D + (M - 1),
          A - 1,
        ).ev;
      } else if (P > 0) {
        evAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          D + (M - 1),
          0,
        ).ev;
      }
    }

    // 最优期望 = 四种行动的最大值
    const bestValue = Math.max(evDouble, evDraw, evAbandon, evStop);

    // 【概率分布传播】按最优行动选择对应的子分布传播方式：
    // ① 已抽0张(必须继续) → 加权平均子分布
    // ② 翻倍最优 → 直接继承翻倍后分布
    // ③ 继续最优 → 加权平均子分布
    // ④ 放弃最优 → 放弃概率=1, 无终点分布
    // ⑤ 停止最优 → 当前模位置概率=1
    let distribution: number[];
    let abandonProb: number;

    if (roundDrawn === 0) {
      // 必须继续：子分布按抽牌概率加权平均
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 0;
      for (let i = 0; i < 5; i++) {
        if (remainingCards[i]! > 0) {
          const prob = remainingCards[i]! / remainingCount;
          const next = [...remainingCards];
          next[i]!--;
          const child = dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, M, P, D, A);
          for (let j = 0; j < modValue; j++) {
            distribution[j]! += prob * child.distribution[j]!;
          }
          abandonProb += prob * child.abandonProb;
        }
      }
    } else if (
      roundDrawn > 0 &&
      roundDrawn < 3 &&
      M === 1 &&
      D > 0 &&
      evDouble >= evDraw &&
      evDouble >= evStop &&
      evDouble >= evAbandon
    ) {
      // 翻倍最优：直接继承翻倍后的子分布
      const child = dpDaily(r1, r2, r3, r4, r5, 2, P, D - 1, A);
      distribution = child.distribution;
      abandonProb = child.abandonProb;
    } else if (evDraw >= evAbandon && evDraw >= evStop) {
      // 继续最优：子分布加权平均
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 0;
      for (let i = 0; i < 5; i++) {
        if (remainingCards[i]! > 0) {
          const prob = remainingCards[i]! / remainingCount;
          const next = [...remainingCards];
          next[i]!--;
          const child = dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, M, P, D, A);
          for (let j = 0; j < modValue; j++) {
            distribution[j]! += prob * child.distribution[j]!;
          }
          abandonProb += prob * child.abandonProb;
        }
      }
    } else if (!cannotStop && evAbandon >= evStop) {
      // 放弃最优：100% 概率放弃（无任何终点分布）
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 1;
    } else {
      // 停止最优：当前模位置概率集中为 1
      distribution = new Array<number>(modValue).fill(0);
      distribution[slotIndex] = 1;
      abandonProb = 0;
    }

    const result: DpResult = { ev: bestValue, distribution, abandonProb };
    memo.set(key, result);
    return result;
  }

  const futureValue =
    P > 0
      ? dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          D,
          A,
        ).ev
      : 0;

  // 分支 A：已抽满(5张) 或 牌组已空 → 不能继续/翻倍，仅比较结算 vs 放弃
  if (drawn >= maxDraws || totalRemaining === 0) {
    let evAbandon = -Infinity;
    if (drawn > 0) {
      if (A > 0) {
        evAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P,
          D + (multiplier - 1),
          A - 1,
        ).ev;
      } else if (P > 0) {
        evAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          D + (multiplier - 1),
          0,
        ).ev;
      }
    }

    const evStop = currentReward + futureValue;
    const bestValue = Math.max(evAbandon, evStop);
    const expectedToday = Math.round(bestValue * 100) / 100;

    let optimalAction: AdviceResult['optimalAction'];
    let distribution: number[];
    let abandonProb: number;

    if (drawn > 0 && evAbandon >= evStop) {
      optimalAction = 'abandon';
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 1;
    } else {
      optimalAction = 'must_stop';
      distribution = new Array<number>(modValue).fill(0);
      distribution[slotIndex] = 1;
      abandonProb = 0;
    }

    return {
      currentReward: currentReward,
      expectedContinueReward: null,
      expectedToday: expectedToday,
      optimalAction: optimalAction,
      drawTotal: null,
      doubleTotal: null,
      stopTotal: Math.round(evStop * 100) / 100,
      abandonTotal: drawn > 0 ? Math.round(evAbandon * 100) / 100 : null,
      expectedAfterStop: Math.round(futureValue * 100) / 100,
      distribution: distribution.map((p) => Math.round(p * 10000) / 10000),
      abandonProb: Math.round(abandonProb * 10000) / 10000,
    };
  }

  // 分支 B：可继续抽牌 → 比较四种行动的期望，选最优
  const stateCards = [remaining[0]!, remaining[1]!, remaining[2]!, remaining[3]!, remaining[4]!];

  // 继续抽：下一张牌各等级概率加权
  let evDraw = 0;
  for (let i = 0; i < 5; i++) {
    if (remaining[i]! > 0) {
      const prob = remaining[i]! / totalRemaining;
      const next = [...stateCards];
      next[i]!--;
      evDraw +=
        prob * dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, multiplier, P, D, A).ev;
    }
  }

  // 翻倍：倍率×2，消耗翻倍次数
  let evDouble = -Infinity;
  if (drawn > 0 && drawn < 3 && !doubled && D > 0) {
    evDouble = dpDaily(
      stateCards[0]!,
      stateCards[1]!,
      stateCards[2]!,
      stateCards[3]!,
      stateCards[4]!,
      2,
      P,
      D - 1,
      A,
    ).ev;
  }

  // 结算：获取当前奖励，重置牌组进下一局
  let evStop = -Infinity;
  if (drawn > 0) {
    evStop = currentReward + futureValue;
  }

  // 放弃：重置牌组，消耗放弃或游玩次数
  let evAbandon = -Infinity;
  if (drawn > 0) {
    if (A > 0) {
      evAbandon = dpDaily(
        deckInit[0]!,
        deckInit[1]!,
        deckInit[2]!,
        deckInit[3]!,
        deckInit[4]!,
        1,
        P,
        D + (multiplier - 1),
        A - 1,
      ).ev;
    } else if (P > 0) {
      evAbandon = dpDaily(
        deckInit[0]!,
        deckInit[1]!,
        deckInit[2]!,
        deckInit[3]!,
        deckInit[4]!,
        1,
        P - 1,
        D + (multiplier - 1),
        0,
      ).ev;
    }
  }

  // 最优决策（优先级：翻倍 > 继续 > 放弃 > 停止）
  const evContinue = Math.max(evDraw, evDouble);
  const expectedContinueReward = Math.round((evContinue - futureValue) * 100) / 100;
  const expectedToday = Math.round(Math.max(evContinue, evAbandon, evStop) * 100) / 100;

  const isDoubleOptimal =
    drawn > 0 &&
    drawn < 3 &&
    multiplier === 1 &&
    D > 0 &&
    evDouble >= evDraw &&
    evDouble >= evStop &&
    evDouble >= evAbandon;

  let optimalAction: AdviceResult['optimalAction'];
  if (drawn === 0) {
    optimalAction = 'must_continue';
  } else if (isDoubleOptimal) {
    optimalAction = 'double';
  } else if (evDraw >= evAbandon && evDraw >= evStop) {
    optimalAction = 'continue';
  } else if (evAbandon >= evStop) {
    optimalAction = 'abandon';
  } else {
    optimalAction = 'stop';
  }

  const currentResult = dpDaily(
    stateCards[0]!,
    stateCards[1]!,
    stateCards[2]!,
    stateCards[3]!,
    stateCards[4]!,
    multiplier,
    P,
    D,
    A,
  );

  return {
    currentReward: currentReward,
    expectedContinueReward: expectedContinueReward,
    expectedToday: expectedToday,
    optimalAction: optimalAction,
    drawTotal: Math.round(evDraw * 100) / 100,
    doubleTotal:
      drawn > 0 && drawn < 3 && !doubled && D > 0 ? Math.round(evDouble * 100) / 100 : null,
    stopTotal: drawn > 0 ? Math.round(evStop * 100) / 100 : null,
    abandonTotal: drawn > 0 ? Math.round(evAbandon * 100) / 100 : null,
    expectedAfterStop: Math.round(futureValue * 100) / 100,
    distribution: currentResult.distribution.map((p) => Math.round(p * 10000) / 10000),
    abandonProb: Math.round(currentResult.abandonProb * 10000) / 10000,
  };
}

/**
 * 手动清除所有缓存
 * 铭牌配置或奖励表变化时可调用
 * @returns void
 */
export function clearSolverCache(): void {
  adviceMemoCache.clear();
}
