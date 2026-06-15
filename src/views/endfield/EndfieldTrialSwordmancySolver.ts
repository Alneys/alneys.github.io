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
  /** 各行动的今日总期望（含未来局数），null 表示该行动不可用 */
  drawTotal: number | null;
  doubleTotal: number | null;
  stopTotal: number | null;
  abandonTotal: number | null;
  /** 结算本局后剩余局数的期望 */
  expectedAfterStop: number;
  /** 各战力点 (0~10) 的最优策略概率分布 */
  distribution: number[];
  /** 放弃本局的概率 */
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

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.value;
    }
    return undefined;
  }

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

  clear(): void {
    this.map.clear();
  }
}

/** 缓存键：由牌组、奖励表、溢出参数唯一决定一组 DP 结果 */
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
const adviceMemoCache = new LRUCache<Map<string, DpResult>>(MAX_CACHED_CONFIGS);

/** 安全获取奖励值（防止越界） */
function safeReward(rewards: number[], s: number): number {
  const idx = Math.min(Math.max(0, s), rewards.length - 1);
  return rewards[idx]!;
}

/** 计算调整后奖励（溢出厌恶模型） */
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
 * 状态 (r_tuple, M, P, B)：
 *   r_tuple = (r1,r2,r3,r4,r5) 各等级剩余牌数
 *   M = 当前局倍率 (1 或 2)
 *   P = 今日剩余游玩次数 (含当前局)
 *   B = 今日剩余翻倍次数
 *
 * 每一步可选行动：
 *   - 继续抽取铭牌：抽一张，状态转移到 (r_tuple - 1_i, M, P, B)
 *   - 开启翻倍：M 置为 2，B 减 1（条件：已抽 < 3、M=1、B>0）
 *   - 结算本局：获得当前奖励，进入下一局 (deckInit, 1, P-1, B)
 *
 * 决策规则：优先选择翻倍（期望相同时翻倍优先于继续/停止）
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

    if (P === 0) {
      const r: DpResult = {
        ev: 0,
        distribution: new Array<number>(modValue).fill(0),
        abandonProb: 0,
      };
      memo.set(key, r);
      return r;
    }

    const rem = r1 + r2 + r3 + r4 + r5;
    const drn = totalCards - rem;
    const dv = initialTotal - (r1 * 1 + r2 * 2 + r3 * 3 + r4 * 4 + r5 * 5);
    const sp = ((dv % modValue) + modValue) % modValue;
    const rawCr = safeReward(rewards, sp);
    const adjustedCr = computeAdjustedReward(rawCr, dv, modValue, overflowParams);
    const cr = adjustedCr * Mv;

    const rs = [r1, r2, r3, r4, r5];

    const cannotStop = drn === 0;

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

    let vDouble = -Infinity;
    if (drn > 0 && drn < 3 && Mv === 1 && B > 0) {
      vDouble = dpDaily(r1, r2, r3, r4, r5, 2, P, B - 1, A).ev;
    }

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

    const best = Math.max(vDouble, vDraw, vAbandon, vStop);

    // ── 依据最优策略计算分布 ──
    let distribution: number[];
    let abandonProb: number;

    if (drn === 0) {
      // 未抽取铭牌，必须继续 → 子分布加权平均
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
      // 翻倍最优
      const child = dpDaily(r1, r2, r3, r4, r5, 2, P, B - 1, A);
      distribution = child.distribution;
      abandonProb = child.abandonProb;
    } else if (vDraw >= vAbandon && vDraw >= vStop) {
      // 继续最优
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
      // 放弃最优
      distribution = new Array<number>(modValue).fill(0);
      abandonProb = 1;
    } else {
      // 停止
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

  const r = remaining;
  const rState = [r[0]!, r[1]!, r[2]!, r[3]!, r[4]!];

  let vDraw = 0;
  for (let i = 0; i < 5; i++) {
    if (r[i]! > 0) {
      const prob = r[i]! / totalRemaining;
      const next = [...rState];
      next[i]!--;
      vDraw += prob * dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, M, P, B, A).ev;
    }
  }

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

  let vStop = -Infinity;
  if (drawn > 0) {
    vStop = currentReward + futureValue;
  }

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

/** 手动清除所有缓存（铭牌配置或奖励表变化时可调用） */
export function clearSolverCache(): void {
  adviceMemoCache.clear();
}
