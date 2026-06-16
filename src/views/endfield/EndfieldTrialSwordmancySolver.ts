/** 溢出厌恶心理模型参数 */
export interface OverflowParams {
  /** 比例衰减系数 0~1，每溢出 1 圈奖励乘以此值 */
  aversionFactor: number;
  /** 固定扣除值，每溢出 1 圈扣除一次，结果可为负 */
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
  const k = Math.floor(drawnValue / modValue);
  return rawReward * Math.pow(params.aversionFactor, k) - k * params.fixedPenalty;
}

/**
 * 多局 + 翻倍 DP 求解：计算当前状态的最优行动建议
 *
 * ## 玩法概述
 * 玩家从牌组中抽取 5 个等级（1~5）的"铭牌"，累计抽牌点数（drawnValue）对奖励表长度（modValue）
 * 取模得到当前奖励。核心决策是：在当前抽牌结果下，选择继续抽、翻倍（本局奖励×2）、结算或放弃。
 *
 * ## DP 状态 (r1,r2,r3,r4,r5, M, P, B, A)
 *   r1~r5 = 牌组各等级剩余张数
 *   M     = 当前局倍率（1 或 2）
 *   P     = 今日剩余游玩次数（含当前局）
 *   B     = 今日剩余翻倍次数
 *   A     = 今日剩余放弃次数
 *
 * ## 可选行动
 *   继续   抽一张 i 级牌 → (r_i-1, …, M, P, B, A)
 *   翻倍   倍率 1→2，B-1  ∥ 条件：0<已抽<3、M=1、B>0
 *   结算   获 cr，重置牌组进下一局 → (deckInit, 1, P-1, B, A)
 *   放弃   重置牌组重开（消耗 A 或 P）
 *
 * ## 决策规则
 *   优先选择翻倍（期望相同时翻倍优先于继续/停止）
 *   已抽 0 张必须继续；已抽已满只能结算或放弃
 *
 * @param drawnCounts - 当前已抽各等级（1~5）铭牌数量
 * @param deck - 牌组初始各等级数量
 * @param rewards - 奖励表
 * @param doubled - 当前局是否已翻倍
 * @param remainingGames - 今日剩余游玩次数
 * @param remainingDoubles - 今日剩余翻倍次数
 * @param remainingAbandons - 今日剩余放弃次数
 * @param overflowParams - 溢出厌恶参数（可选）
 * @returns 最优行动建议，含各行动期望值、战力点概率分布等信息；输入非法时返回 null
 */
export function getCurrentAdvice(
  drawnCounts: number[],
  deck: number[],
  rewards: number[],
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
  const s = ((drawnValue % modValue) + modValue) % modValue;
  const M = doubled ? 2 : 1;
  const rawReward = safeReward(rewards, s);
  const currentReward = computeAdjustedReward(rawReward, drawnValue, modValue, overflowParams) * M;

  const remaining = deck.map((d, i) => d - drawnCounts[i]!);
  const totalRemaining = remaining.reduce((a, b) => a + b, 0);
  const P = remainingGames;
  const B = remainingDoubles - (doubled ? 1 : 0);
  const A = remainingAbandons;

  const adviceKey = cacheKey(deck, rewards, overflowParams);
  const existingAdviceMemo = adviceMemoCache.get(adviceKey);
  const memo = existingAdviceMemo ?? new Map<string, DpResult>();
  if (!existingAdviceMemo) adviceMemoCache.set(adviceKey, memo);

  /**
   * DP 递归求解：计算当前状态下的最优期望值、概率分布和放弃概率
   *
   * @param r1 ~ r5 - 牌组各等级（1~5）剩余张数
   * @param Mv - 当前局倍率（1 或 2）
   * @param P - 今日剩余游玩次数（含当前局）
   * @param B - 今日剩余翻倍次数
   * @param A - 今日剩余放弃次数
   * @returns 包含最优期望值、战力点概率分布、放弃概率的结果
   */
  function dpDaily(
    r1: number,
    r2: number,
    r3: number,
    r4: number,
    r5: number,
    Mv: number,
    P: number,
    B: number,
    A: number,
  ): DpResult {
    const key = `${r1},${r2},${r3},${r4},${r5},${Mv},${P},${B},${A}`;
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

    // 计算当前已抽张数、点数、模位置和即时奖励
    const rem = r1 + r2 + r3 + r4 + r5;
    const drn = totalCards - rem;
    const dv = initialTotal - (r1 * 1 + r2 * 2 + r3 * 3 + r4 * 4 + r5 * 5);
    const sp = ((dv % modValue) + modValue) % modValue;
    const rawCr = safeReward(rewards, sp);
    const adjustedCr = computeAdjustedReward(rawCr, dv, modValue, overflowParams);
    const cr = adjustedCr * Mv;

    const rs = [r1, r2, r3, r4, r5];

    const cannotStop = drn === 0;

    // 继续抽：下一张牌各等级概率加权
    let vDraw = -Infinity;
    if (drn < maxDraws && rem > 0) {
      vDraw = 0;
      for (let i = 0; i < 5; i++) {
        if (rs[i]! > 0) {
          const prob = rs[i]! / rem;
          const next = [...rs];
          next[i]!--;
          vDraw += prob * dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, Mv, P, B, A).ev;
        }
      }
    }

    // 翻倍：倍率×2，消耗翻倍次数
    let vDouble = -Infinity;
    if (drn > 0 && drn < 3 && Mv === 1 && B > 0) {
      vDouble = dpDaily(r1, r2, r3, r4, r5, 2, P, B - 1, A).ev;
    }

    // 结算：获取当前奖励，重置牌组进下一局
    let vStop = -Infinity;
    if (drn > 0) {
      vStop =
        cr +
        dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          B,
          A,
        ).ev;
    }

    // 放弃：重置牌组，消耗放弃或游玩次数
    // 注意放弃时返还已消耗的翻倍（B + (Mv - 1)）
    let vAbandon = -Infinity;
    if (!cannotStop) {
      if (A > 0) {
        vAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P,
          B + (Mv - 1),
          A - 1,
        ).ev;
      } else if (P > 0) {
        vAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          B + (Mv - 1),
          0,
        ).ev;
      }
    }

    // 最优期望 = 四种行动的最大值
    const best = Math.max(vDouble, vDraw, vAbandon, vStop);

    // 依据最优策略计算最终战力点概率分布和放弃概率
    // 按决策优先级分 4 种情况，将"最优行动"的子状态分布传播到当前层
    let distribution: number[];
    let abandonProb: number;

    if (drn === 0) {
      // 必须继续：子分布按抽牌概率加权平均
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 0;
      for (let i = 0; i < 5; i++) {
        if (rs[i]! > 0) {
          const prob = rs[i]! / rem;
          const next = [...rs];
          next[i]!--;
          const child = dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, Mv, P, B, A);
          for (let j = 0; j < modValue; j++) {
            distribution[j]! += prob * child.distribution[j]!;
          }
          abandonProb += prob * child.abandonProb;
        }
      }
    } else if (
      drn > 0 &&
      drn < 3 &&
      Mv === 1 &&
      B > 0 &&
      vDouble >= vDraw &&
      vDouble >= vStop &&
      vDouble >= vAbandon
    ) {
      // 翻倍最优：直接继承翻倍后的子分布
      const child = dpDaily(r1, r2, r3, r4, r5, 2, P, B - 1, A);
      distribution = child.distribution;
      abandonProb = child.abandonProb;
    } else if (vDraw >= vAbandon && vDraw >= vStop) {
      // 继续最优：子分布加权平均
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 0;
      for (let i = 0; i < 5; i++) {
        if (rs[i]! > 0) {
          const prob = rs[i]! / rem;
          const next = [...rs];
          next[i]!--;
          const child = dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, Mv, P, B, A);
          for (let j = 0; j < modValue; j++) {
            distribution[j]! += prob * child.distribution[j]!;
          }
          abandonProb += prob * child.abandonProb;
        }
      }
    } else if (!cannotStop && vAbandon >= vStop) {
      // 放弃最优：100% 概率放弃（无任何终点分布）
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 1;
    } else {
      // 停止最优：当前模位置概率集中为 1
      distribution = new Array<number>(modValue).fill(0);
      distribution[sp] = 1;
      abandonProb = 0;
    }

    const result: DpResult = { ev: best, distribution, abandonProb };
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
          B,
          A,
        ).ev
      : 0;

  // 情况 A：已抽满或无牌可抽 → 只剩结算或放弃
  if (drawn >= maxDraws || totalRemaining === 0) {
    let vAbandon = -Infinity;
    if (drawn > 0) {
      if (A > 0) {
        vAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P,
          B + (M - 1),
          A - 1,
        ).ev;
      } else if (P > 0) {
        vAbandon = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          B + (M - 1),
          0,
        ).ev;
      }
    }

    const vStop = currentReward + futureValue;
    const best = Math.max(vAbandon, vStop);
    const expectedToday = Math.round(best * 100) / 100;

    let optimalAction: AdviceResult['optimalAction'];
    let distribution: number[];
    let abandonProb: number;

    if (drawn > 0 && vAbandon >= vStop) {
      optimalAction = 'abandon';
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 1;
    } else {
      optimalAction = 'must_stop';
      distribution = new Array<number>(modValue).fill(0);
      distribution[s] = 1;
      abandonProb = 0;
    }

    return {
      currentReward: currentReward,
      expectedContinueReward: null,
      expectedToday: expectedToday,
      optimalAction: optimalAction,
      drawTotal: null,
      doubleTotal: null,
      stopTotal: Math.round(vStop * 100) / 100,
      abandonTotal: drawn > 0 ? Math.round(vAbandon * 100) / 100 : null,
      expectedAfterStop: Math.round(futureValue * 100) / 100,
      distribution: distribution.map((p) => Math.round(p * 10000) / 10000),
      abandonProb: Math.round(abandonProb * 10000) / 10000,
    };
  }

  // 情况 B：可继续抽牌 → 比较四种行动的期望
  const r = remaining;
  const rState = [r[0]!, r[1]!, r[2]!, r[3]!, r[4]!];

  // 继续抽：下一张牌各等级概率加权
  let vDraw = 0;
  for (let i = 0; i < 5; i++) {
    if (r[i]! > 0) {
      const prob = r[i]! / totalRemaining;
      const next = [...rState];
      next[i]!--;
      vDraw += prob * dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, M, P, B, A).ev;
    }
  }

  // 翻倍：倍率×2，消耗翻倍次数
  let vDouble = -Infinity;
  if (drawn > 0 && drawn < 3 && !doubled && B > 0) {
    vDouble = dpDaily(
      rState[0]!,
      rState[1]!,
      rState[2]!,
      rState[3]!,
      rState[4]!,
      2,
      P,
      B - 1,
      A,
    ).ev;
  }

  // 结算：获取当前奖励，重置牌组进下一局
  let vStop = -Infinity;
  if (drawn > 0) {
    vStop = currentReward + futureValue;
  }

  // 放弃：重置牌组，消耗放弃或游玩次数
  let vAbandon = -Infinity;
  if (drawn > 0) {
    if (A > 0) {
      vAbandon = dpDaily(
        deckInit[0]!,
        deckInit[1]!,
        deckInit[2]!,
        deckInit[3]!,
        deckInit[4]!,
        1,
        P,
        B + (M - 1),
        A - 1,
      ).ev;
    } else if (P > 0) {
      vAbandon = dpDaily(
        deckInit[0]!,
        deckInit[1]!,
        deckInit[2]!,
        deckInit[3]!,
        deckInit[4]!,
        1,
        P - 1,
        B + (M - 1),
        0,
      ).ev;
    }
  }

  // 选择最优行动
  const evContinue = Math.max(vDraw, vDouble);
  const expectedContinueReward = Math.round((evContinue - futureValue) * 100) / 100;
  const expectedToday = Math.round(Math.max(evContinue, vAbandon, vStop) * 100) / 100;

  const isDoubleOptimal =
    drawn > 0 &&
    drawn < 3 &&
    M === 1 &&
    B > 0 &&
    vDouble >= vDraw &&
    vDouble >= vStop &&
    vDouble >= vAbandon;

  let optimalAction: AdviceResult['optimalAction'];
  if (drawn === 0) {
    optimalAction = 'must_continue';
  } else if (isDoubleOptimal) {
    optimalAction = 'double';
  } else if (vDraw >= vAbandon && vDraw >= vStop) {
    optimalAction = 'continue';
  } else if (vAbandon >= vStop) {
    optimalAction = 'abandon';
  } else {
    optimalAction = 'stop';
  }

  const currentResult = dpDaily(
    rState[0]!,
    rState[1]!,
    rState[2]!,
    rState[3]!,
    rState[4]!,
    M,
    P,
    B,
    A,
  );

  return {
    currentReward: currentReward,
    expectedContinueReward: expectedContinueReward,
    expectedToday: expectedToday,
    optimalAction: optimalAction,
    drawTotal: Math.round(vDraw * 100) / 100,
    doubleTotal:
      drawn > 0 && drawn < 3 && !doubled && B > 0 ? Math.round(vDouble * 100) / 100 : null,
    stopTotal: drawn > 0 ? Math.round(vStop * 100) / 100 : null,
    abandonTotal: drawn > 0 ? Math.round(vAbandon * 100) / 100 : null,
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
