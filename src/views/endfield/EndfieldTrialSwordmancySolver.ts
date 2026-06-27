/**
 * DP 求解器
 *
 * 玩家从牌组抽 5 张"铭牌"（等级 1~5），累计点数对奖励表长度取模得到奖励。
 * 核心决策：继续抽 / 翻倍 / 结算 / 放弃，最大化当日总期望收益。
 */

/** 期望效用模型参数 */
export interface ExpectedUtilityParams {
  /**
   * 比例衰减系数 0~1，每溢出 1 圈奖励乘以此值
   * 连续溢出 n 圈时奖励乘以 aversionFactor^n，该值越小对溢出的折扣越大
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
  /** 原始奖励期望（左列展示） */
  rewardCurrent: number;
  rewardRound: number;
  rewardToday: number;
  rewardDraw: number | null;
  rewardDouble: number | null;
  rewardStop: number | null;
  rewardAbandon: number | null;
  rewardAfterStop: number;
  /** 期望效用模型调整后的期望（右列展示），无模型时与左列值相同 */
  euCurrentReward: number;
  euRound: number;
  euToday: number;
  euDraw: number | null;
  euDouble: number | null;
  euStop: number | null;
  euAbandon: number | null;
  euAfterStop: number;
  optimalAction: 'stop' | 'draw' | 'must_draw' | 'must_stop' | 'double' | 'abandon';
  distribution: number[];
  abandonProb: number;
}

/** 内部 DP 复合返回类型：期望值 + 各行动期望 + 战力点概率分布 */
interface DpResult {
  /** EU 调整后的期望值（用于决策 + 右列展示） */
  eu: number;
  euDraw: number;
  euDouble: number;
  euStop: number;
  euAbandon: number;
  euRound: number;
  /** 原始奖励期望（遵循 EU 最优策略，用于左列展示） */
  rewardExp: number;
  rewardDraw: number;
  rewardDouble: number;
  rewardStop: number;
  rewardAbandon: number;
  rewardRound: number;
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
 * @param euParams - 期望效用参数（可选）
 * @returns 缓存键字符串
 */
function cacheKey(deck: number[], rewards: number[], euParams?: ExpectedUtilityParams): string {
  const deckK = deck.join(',');
  const rewardK = rewards.join(',');
  const paramK = euParams ? `${euParams.aversionFactor},${euParams.fixedPenalty}` : '';
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
export function safeGetReward(rewards: number[], s: number): number {
  const idx = Math.min(Math.max(0, s), rewards.length - 1);
  return rewards[idx]!;
}

/**
 * 计算调整后奖励（期望效用模型）
 * @param rawReward - 原始奖励值
 * @param drawnValue - 已抽牌点数之和
 * @param modValue - 奖励表长度（模数）
 * @param params - 期望效用参数（可选）
 * @returns 调整后的奖励值
 */
export function computeEuReward(
  rawReward: number,
  drawnValue: number,
  modValue: number,
  params?: ExpectedUtilityParams,
): number {
  if (!params || (params.aversionFactor === 1 && params.fixedPenalty === 0)) return rawReward;
  const k = Math.floor(drawnValue / modValue); // k = 溢出圈数
  // 溢出调整公式：reward × a^k - k × p
  // a = aversionFactor, p = fixedPenalty, k = floor(drawnValue / modValue)
  return rawReward * Math.pow(params.aversionFactor, k) - k * params.fixedPenalty;
}

/**
 * 从候选数组中选取 value 最大的条目，等值时先入者（数组靠前）胜出
 * 使用 EPSILON = 1e-6 容限消除浮点数误差
 */
const EPSILON = 1e-6;

function pickBest<T extends { value: number }>(items: T[]): T {
  let best = items[0]!;
  for (let i = 1; i < items.length; i++) {
    if (items[i]!.value - best.value > EPSILON) {
      best = items[i]!;
    }
  }
  return best;
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
 *   P     = 今日剩余结算次数（含当前局）
 *   D     = 今日剩余翻倍次数
 *   A     = 今日剩余放弃次数
 *
 * DP 求解以 EU（期望效用）为决策依据，
 * reward（原始奖励期望）作为副产物按 EU 最优策略同步计算。
 *
 * ## 可选行动（以下 EU 为期望效用模型调整后的值）
 *
 *   ### 继续抽（Draw）
 *     条件：已抽 < 5 张 且 牌组有剩余
 *     下一状态：(牌组扣除一张牌（5种情况）, 相同 M, P, D, A)，按抽牌的概率加权
 *     期望：euDraw = Σ 该等级概率 × EU(抽到该等级后的状态)
 *
 *   ### 翻倍（Double）
 *     条件：已抽 1~2 张、M=1（未翻倍）、D>0（有翻倍次数）
 *     下一状态：(牌组当前状态, M=2, P, D, A)（不立即扣减 D）
 *     期望：euDouble = EU(牌组当前状态, 倍率=2, D)
 *     注意：不立即产生奖励，后续结算时当前奖励 ×2；翻倍次数在结算时扣除
 *
 *   ### 结算（Stop）
 *     条件：已抽 > 0 张
 *     下一状态：即时获得当前奖励（调整后 × 倍率），然后重置进入下一局
 *              (牌组初始状态, M=1, P-1, D-(M>1?1:0), A)
 *             翻倍次数在结算时扣除（已翻倍则 D-1，否则 D 不变）
 *     期望：euStop = 调整后本局奖励 + EU(下一局初态)
 *
 *   ### 放弃（Abandon）
 *     条件：已抽 > 0 张
 *     下一状态：重置牌组重新开局（翻倍未消耗，无需返还）
 *       - A>0：用放弃次数，(牌组初始状态, 1, P, D, A-1)
 *       - A=0：有结算次数且求解器未禁止时，用结算次数
 *         (牌组初始状态, 1, P-1, D, 0)
 *       - 在没有翻倍次数（A=0）时，以下条件满足任意一条禁止放弃（仅求解器避免非最优解，玩家实际可以放弃）：
 *           ① M=1（未翻倍）
 *           ② P=1（仅剩一次结算次数）
 *           ③ D=P（剩余翻倍数等于可玩次数）
 *     期望：euAbandon = EU(重置后的状态)
 *     特殊规则：翻倍在结算时才扣除，放弃时翻倍尚未消耗，所以无需返还
 *
 * ## 决策规则
 *   以 EU（期望效用）为决策依据，期望相同时按此优先级：继续 > 翻倍 > 放弃 > 停止
 *   已抽满 5 张或无牌可抽 → 仅结算或放弃
 *   已抽 0 张时 optimalAction 强制返回 must_draw（求解器内部 DP 仍考虑结算已用于计算结算本局后的期望）
 *
 * @param deck - 牌组初始各等级数量
 * @param rewards - 奖励表
 * @param drawnCounts - 当前已抽各等级（1~5）铭牌数量
 * @param doubled - 当前局是否已翻倍
 * @param remainingGames - 今日剩余结算次数
 * @param remainingDoubles - 今日剩余翻倍次数
 * @param remainingAbandons - 今日剩余放弃次数
 * @param euParams - 期望效用参数（可选）
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
  euParams?: ExpectedUtilityParams,
): AdviceResult | null {
  const modValue = rewards.length;

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
  if (drawn > MAX_DRAWS) return null;

  const drawnValue = drawnCounts.reduce((sum, count, i) => sum + count * (i + 1), 0);
  const slotIndex = ((drawnValue % modValue) + modValue) % modValue;
  const multiplier = doubled ? 2 : 1;
  const rawReward = safeGetReward(rewards, slotIndex);
  // drawn === 0 时没有实际奖励
  const currentReward = drawn === 0 ? 0 : rawReward * multiplier;
  const euCurrentReward =
    drawn === 0 ? 0 : computeEuReward(rawReward, drawnValue, modValue, euParams) * multiplier;

  const remaining = deck.map((d, i) => d - drawnCounts[i]!);
  const totalRemaining = remaining.reduce((a, b) => a + b, 0);
  const P = remainingGames;
  const D = remainingDoubles;
  const A = remainingAbandons;

  const adviceKey = cacheKey(deck, rewards, euParams);
  const existingAdviceMemo = adviceMemoCache.get(adviceKey);
  const memo = existingAdviceMemo ?? new Map<string, DpResult>();
  if (!existingAdviceMemo) adviceMemoCache.set(adviceKey, memo);

  /**
   * DP 递归求解：计算当前状态下的最优期望值、概率分布和放弃概率
   *
   * @param r1 ~ r5 - 牌组各等级（1~5）剩余张数
   * @param M - 当前局倍率（1 或 2）
   * @param P - 今日剩余结算次数（含当前局）
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
        eu: 0,
        euDraw: 0,
        euDouble: 0,
        euStop: 0,
        euAbandon: 0,
        euRound: 0,
        rewardExp: 0,
        rewardDraw: 0,
        rewardDouble: 0,
        rewardStop: 0,
        rewardAbandon: 0,
        rewardRound: 0,
        distribution: Array.from({ length: modValue }, () => 0),
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
    const rawSlotReward = safeGetReward(rewards, slotIndex);
    const adjustedReward = computeEuReward(rawSlotReward, roundPoints, modValue, euParams);
    const roundReward = adjustedReward * M;
    const roundRewardRaw = rawSlotReward * M;

    const remainingCards = [r1, r2, r3, r4, r5];

    // 缓存子状态结果避免重复计算
    let childDouble: DpResult | undefined;
    let childAbandonA: DpResult | undefined;
    let childAbandonP: DpResult | undefined;
    const childStop = dpDaily(
      deckInit[0]!,
      deckInit[1]!,
      deckInit[2]!,
      deckInit[3]!,
      deckInit[4]!,
      1,
      P - 1,
      M === 1 ? D : D - 1,
      A,
    );

    // [Double] 条件 roundDrawn∈{1,2} ∧ M=1 ∧ D>0 → M=2（D 不变，结算时扣减）
    if (roundDrawn > 0 && roundDrawn < 3 && M === 1 && D > 0) {
      childDouble = dpDaily(r1, r2, r3, r4, r5, 2, P, D, A);
    }

    // [Abandon] 重置牌组重新开局（翻倍未消耗，无需返还）
    // drawing===0 时不允许放弃，其他条件不变
    if (roundDrawn > 0) {
      if (A > 0) {
        childAbandonA = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P,
          D,
          A - 1,
        );
      } else if (P > 0 && M === 2 && P !== 1 && D !== P) {
        childAbandonP = dpDaily(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          1,
          P - 1,
          D,
          0,
        );
      }
    }

    // 各行动的 EU 调整期望值（决策依据）和原始奖励期望（左列展示）
    // [Draw] 按等级比例加权，同时聚合子分布
    let euDraw = -Infinity;
    let rewardDraw = -Infinity;
    const drawDistribution = Array.from({ length: modValue }, () => 0);
    let drawAbandonProb = 0;
    let euRoundDraw = 0;
    let rewardRoundDraw = 0;
    if (roundDrawn < MAX_DRAWS && remainingCount > 0) {
      euDraw = 0;
      rewardDraw = 0;
      for (let i = 0; i < 5; i++) {
        if (remainingCards[i]! > 0) {
          const prob = remainingCards[i]! / remainingCount;
          const child = dpDaily(
            i === 0 ? r1 - 1 : r1,
            i === 1 ? r2 - 1 : r2,
            i === 2 ? r3 - 1 : r3,
            i === 3 ? r4 - 1 : r4,
            i === 4 ? r5 - 1 : r5,
            M,
            P,
            D,
            A,
          );
          euDraw += prob * child.eu;
          rewardDraw += prob * child.rewardExp;
          euRoundDraw += prob * child.euRound;
          rewardRoundDraw += prob * child.rewardRound;
          for (let j = 0; j < modValue; j++) {
            drawDistribution[j]! += prob * child.distribution[j]!;
          }
          drawAbandonProb += prob * child.abandonProb;
        }
      }
    }

    // ====== 中间变量 ======
    const stopRoundRaw = roundDrawn === 0 ? 0 : roundRewardRaw;
    const stopRoundAdj = roundDrawn === 0 ? 0 : roundReward;
    const childAbandon = childAbandonA ?? childAbandonP;

    // ====== EU 调整期望值（决策依据） ======
    const euDouble = childDouble?.eu ?? -Infinity;
    const euStop = childStop ? stopRoundAdj + childStop.eu : -Infinity;
    const euAbandon = childAbandon?.eu ?? -Infinity;

    // ====== 原始奖励期望 ======
    const rewardDouble = childDouble?.rewardExp ?? -Infinity;
    const rewardStop = childStop ? stopRoundRaw + childStop.rewardExp : -Infinity;
    let rewardAbandon: number;
    if (childAbandon) {
      rewardAbandon = childAbandon.rewardExp;
    } else if (roundDrawn > 0 && P > 0) {
      // 禁止放弃时仍计算后续状态（重置牌组）的原始奖励期望用于展示
      const fallbackChild = dpDaily(
        deckInit[0]!,
        deckInit[1]!,
        deckInit[2]!,
        deckInit[3]!,
        deckInit[4]!,
        1,
        P - 1,
        D,
        0,
      );
      rewardAbandon = fallbackChild.rewardExp;
    } else {
      rewardAbandon = 0;
    }

    // 【概率分布传播】按优先级选择最优行动对应的子分布和期望值
    let distribution: number[];
    let abandonProb: number;
    let euRound: number;
    let rewardRound: number;
    let finalEu = -Infinity;
    let finalReward = -Infinity;

    distribution = drawDistribution;
    abandonProb = drawAbandonProb;
    euRound = euRoundDraw;
    rewardRound = rewardRoundDraw;

    // 优先级：draw > double > abandon > stop（数组顺序，越靠前优先级越高）
    // 决策基于 EU 调整值
    const actionCandidates: { action: string; value: number }[] = [];

    if (roundDrawn < MAX_DRAWS && remainingCount > 0) {
      actionCandidates.push({ action: 'draw', value: euDraw });
    }
    if (roundDrawn > 0 && roundDrawn < 3 && M === 1 && D > 0) {
      actionCandidates.push({ action: 'double', value: euDouble });
    }
    if (roundDrawn > 0) {
      actionCandidates.push({ action: 'abandon', value: euAbandon });
    }
    actionCandidates.push({ action: 'stop', value: euStop });

    const bestAction = pickBest(actionCandidates).action;

    // 继续抽牌：按等级比例，加权聚合子战力点分布
    if (bestAction === 'draw') {
      distribution = drawDistribution;
      abandonProb = drawAbandonProb;
      euRound = euRoundDraw;
      rewardRound = rewardRoundDraw;
      finalEu = euDraw;
      finalReward = rewardDraw;
      // 翻倍：直接继承倍率 2 后的子分布，牌组不变，结算时扣除翻倍次数
    } else if (bestAction === 'double') {
      const child = childDouble!;
      distribution = child.distribution;
      abandonProb = child.abandonProb;
      euRound = child.euRound;
      rewardRound = child.rewardRound;
      finalEu = child.eu;
      finalReward = child.rewardExp;
      // 放弃：放弃概率 100%，战力点分布 0
    } else if (bestAction === 'abandon') {
      distribution = Array.from({ length: modValue }, () => 0);
      abandonProb = 1;
      euRound = 0;
      rewardRound = 0;
      finalEu = childAbandon!.eu;
      finalReward = childAbandon!.rewardExp;
      // 结算：立即获得当前奖励（roundDrawn===0 时无战力点），概率分布和回合奖励
    } else if (bestAction === 'stop') {
      distribution = Array.from({ length: modValue }, () => 0);
      abandonProb = 0;
      if (roundDrawn > 0) {
        distribution[slotIndex] = 1;
        euRound = roundReward;
        rewardRound = roundRewardRaw;
      } else {
        euRound = 0;
        rewardRound = 0;
      }
      finalEu = euStop;
      finalReward = rewardStop;
    }

    const result: DpResult = {
      eu: finalEu,
      euDraw,
      euDouble,
      euStop,
      euAbandon,
      euRound,
      rewardExp: finalReward,
      rewardDraw,
      rewardDouble,
      rewardStop,
      rewardAbandon,
      rewardRound,
      distribution,
      abandonProb,
    };
    memo.set(key, result);
    return result;
  }

  const dp = dpDaily(
    remaining[0]!,
    remaining[1]!,
    remaining[2]!,
    remaining[3]!,
    remaining[4]!,
    multiplier,
    P,
    D,
    A,
  );

  const canDrawFurther = drawn < MAX_DRAWS && totalRemaining > 0;
  const canDoubleNow = drawn > 0 && drawn < 3 && !doubled && D > 0;

  // 原始奖励期望（左列）
  const rewardAfterStop = dp.rewardStop - currentReward;
  const rewardRound = dp.rewardRound;
  const rewardToday = dp.rewardExp;
  // EU 调整期望（右列）
  const euAfterStop = dp.euStop - euCurrentReward;
  const euRound = dp.euRound;
  const euToday = dp.eu;

  // 决策规则：期望值相同时按优先级 继续 > 翻倍 > 放弃 > 停止（数组顺序）
  // 决策基于 EU 调整值
  const candidates: { action: AdviceResult['optimalAction']; value: number }[] = [];
  if (canDrawFurther) candidates.push({ action: 'draw', value: dp.euDraw });
  if (canDoubleNow) candidates.push({ action: 'double', value: dp.euDouble });
  if (drawn > 0) candidates.push({ action: 'abandon', value: dp.euAbandon });
  // stop 始终可选（drawn === 0 时奖励为 0）
  candidates.push({ action: 'stop', value: dp.euStop });

  const best = pickBest(candidates);
  let optimalAction = best.action;

  if (optimalAction === 'stop' && !canDrawFurther) {
    optimalAction = 'must_stop';
  }
  // drawn === 0 时强制 must_draw（仅求解器内部允许立即结算）
  if (drawn === 0) {
    optimalAction = 'must_draw';
  }

  return {
    rewardCurrent: currentReward,
    rewardRound,
    rewardToday,
    rewardDraw: canDrawFurther ? dp.rewardDraw : null,
    rewardDouble: canDoubleNow ? dp.rewardDouble : null,
    rewardStop: dp.rewardStop,
    rewardAbandon: drawn > 0 ? dp.rewardAbandon : null,
    rewardAfterStop,
    euCurrentReward,
    euRound,
    euToday,
    euDraw: canDrawFurther ? dp.euDraw : null,
    euDouble: canDoubleNow ? dp.euDouble : null,
    euStop: dp.euStop,
    euAbandon: drawn > 0 ? dp.euAbandon : null,
    euAfterStop,
    optimalAction,
    distribution: [...dp.distribution],
    abandonProb: dp.abandonProb,
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

/** 每局最多抽牌张数 */
export const MAX_DRAWS = 5;

/** 默认奖励表（索引 = 战力点 0~10） */
export const DEFAULT_REWARDS: number[] = [
  0, 1000, 2000, 4000, 7500, 12000, 20000, 36000, 60000, 100000, 160000,
];

/** 默认铭牌库配置（各等级张数） */
export const DEFAULT_DECK_CONFIG: number[] = [4, 5, 4, 8, 7];

/** 默认铭牌库配置的更新日期（含时间） */
export const DEFAULT_DECK_CONFIG_DATE = '2026-06-27 04:00';
