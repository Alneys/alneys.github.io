/**
 * 简化策略穷举求解器
 *
 * 对"简化策略"（固定阈值 + 固定翻倍规则）穷举所有参数组合，
 * 与最优 DP 求解结果对比，评估简化策略的效率损失。
 *
 * 简化策略规则：
 * 1. 每局抽第一张后立即翻倍（若还有翻倍次数）
 * 2. 每次抽牌后检查当前战力点索引是否 ≥ 阈值，满足则立即结算
 * 3. 抽满 5 张仍不满足时，有放弃次数则放弃，否则强制结算
 * 4. 阈值随剩余放弃次数变化：a3/a2/a1/a0 对应 3/2/1/0 次剩余放弃
 */

import {
  type ExpectedUtilityParams,
  computeEuReward,
  safeGetReward,
  getCurrentAdvice,
  DEFAULT_REWARDS,
  DEFAULT_DECK_CONFIG,
  MAX_DRAWS,
} from './EndfieldTrialSwordmancySolver';

/** 单个简化策略的评估结果 */
export interface StrategyEvalResult {
  /** 阈值组 [a0, a1, a2, a3] */
  strategy: number[];
  /** 该策略下的总期望效用（EU 调整值） */
  eu: number;
  /** 该策略下的总原始奖励期望 */
  reward: number;
}

/** 简化策略穷举与对比的最终返回结果 */
export interface SimplifiedStrategyResult {
  /** 期望效用最大的阈值组 */
  optimalStrategy: number[];
  /** 最优简化策略的 EU */
  optimalEu: number;
  /** 最优简化策略的原始奖励 */
  optimalReward: number;
  /** DP 最优策略的 EU */
  dpEu: number;
  /** DP 最优策略的原始奖励 */
  dpReward: number;
  /** EU 达成率 (optimalEu / dpEu)，dpEu≤0 时为 0 */
  euEfficiency: number;
  /** 奖励达成率 (optimalReward / dpReward) */
  rewardEfficiency: number;
  /** 所有 70 种组合的完整结果 */
  allStrategies: StrategyEvalResult[];
}

/**
 * 生成所有合法的简化策略阈值组合
 *
 * 约束：6 <= a0 <= a1 <= a2 <= a3 <= 10
 * 根据隔板法，从 5 个数 (6~10) 中可重复选 4 个的非递减排列共 C(5+4-1,4)=70 种
 *
 * @returns 70 个 [a0, a1, a2, a3] 数组
 */
function generateStrategyCombinations(): number[][] {
  const results: number[][] = [];
  for (let a3 = 6; a3 <= 10; a3++) {
    for (let a2 = 6; a2 <= a3; a2++) {
      for (let a1 = 6; a1 <= a2; a1++) {
        for (let a0 = 6; a0 <= a1; a0++) {
          results.push([a0, a1, a2, a3]);
        }
      }
    }
  }
  return results;
}

/**
 * 评估单一简化策略的期望值（带 memo 的 DFS）
 *
 * @param a - 阈值组 [a0, a1, a2, a3]
 * @param deck - 铭牌库各等级初始数量（长度 5）
 * @param rewards - 奖励对照表
 * @param euParams - 期望效用模型参数（可选）
 * @returns 总期望效用和总原始奖励期望
 */
function evaluateSimplifiedStrategy(
  a: number[],
  deck: number[],
  rewards: number[],
  euParams?: ExpectedUtilityParams,
): { eu: number; reward: number } {
  const modValue = rewards.length;
  const deckInit = [...deck];
  const memo = new Map<string, { eu: number; reward: number }>();

  /**
   * DFS 递归评估当前状态
   *
   * @param r1~r5 - 牌组各等级剩余张数
   * @param P - 剩余结算次数
   * @param D - 剩余翻倍次数
   * @param A - 剩余放弃次数
   * @param roundDrawn - 本局已抽张数
   * @param drawnValue - 本局已抽点数之和
   * @param M - 本局倍率 (1 或 2)
   */
  function evaluate(
    r1: number,
    r2: number,
    r3: number,
    r4: number,
    r5: number,
    P: number,
    D: number,
    A: number,
    roundDrawn: number,
    drawnValue: number,
    M: number,
  ): { eu: number; reward: number } {
    // 无剩余次数 → 期望为 0
    if (P === 0) {
      return { eu: 0, reward: 0 };
    }

    const key = `${r1},${r2},${r3},${r4},${r5},${P},${D},${A},${roundDrawn},${drawnValue},${M}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    const remainingCards = [r1, r2, r3, r4, r5];
    const remainingCount = remainingCards.reduce((sum, c) => sum + c, 0);

    let result: { eu: number; reward: number };

    if (roundDrawn === 0) {
      // === 开局：抽第一张牌，能翻倍则自动翻倍 ===
      let expectedEu = 0;
      let expectedReward = 0;
      const newM = D > 0 ? 2 : 1;

      for (let i = 0; i < 5; i++) {
        const cnt = remainingCards[i]!;
        if (cnt > 0) {
          const prob = cnt / remainingCount;
          const child = evaluate(
            i === 0 ? r1 - 1 : r1,
            i === 1 ? r2 - 1 : r2,
            i === 2 ? r3 - 1 : r3,
            i === 3 ? r4 - 1 : r4,
            i === 4 ? r5 - 1 : r5,
            P,
            D,
            A,
            1,
            i + 1,
            newM,
          );
          expectedEu += prob * child.eu;
          expectedReward += prob * child.reward;
        }
      }
      result = { eu: expectedEu, reward: expectedReward };
    } else {
      // === 已抽牌：检查阈值 → 结算/放弃/继续 ===
      const slotIndex = ((drawnValue % modValue) + modValue) % modValue;
      const rawReward = safeGetReward(rewards, slotIndex);
      const adjustedReward = computeEuReward(rawReward, drawnValue, modValue, euParams);
      const threshold = a[A]!;

      const shouldStop = slotIndex >= threshold;
      const isBust = roundDrawn >= MAX_DRAWS || remainingCount === 0;

      if (shouldStop) {
        // 立即结算
        const nextP = P - 1;
        const nextD = M === 2 ? D - 1 : D;
        const nextEval = evaluate(
          deckInit[0]!,
          deckInit[1]!,
          deckInit[2]!,
          deckInit[3]!,
          deckInit[4]!,
          nextP,
          nextD,
          A,
          0,
          0,
          1,
        );
        result = {
          eu: adjustedReward * M + nextEval.eu,
          reward: rawReward * M + nextEval.reward,
        };
      } else if (isBust) {
        if (A > 0) {
          // 放弃（重置牌组，不消耗结算和翻倍次数）
          const nextEval = evaluate(
            deckInit[0]!,
            deckInit[1]!,
            deckInit[2]!,
            deckInit[3]!,
            deckInit[4]!,
            P,
            D,
            A - 1,
            0,
            0,
            1,
          );
          result = nextEval;
        } else {
          // 无放弃次数 → 强制结算
          const nextP = P - 1;
          const nextD = M === 2 ? D - 1 : D;
          const nextEval = evaluate(
            deckInit[0]!,
            deckInit[1]!,
            deckInit[2]!,
            deckInit[3]!,
            deckInit[4]!,
            nextP,
            nextD,
            0,
            0,
            0,
            1,
          );
          result = {
            eu: adjustedReward * M + nextEval.eu,
            reward: rawReward * M + nextEval.reward,
          };
        }
      } else {
        // 继续抽牌（按等级比例加权）
        let expectedEu = 0;
        let expectedReward = 0;
        for (let i = 0; i < 5; i++) {
          const cnt = remainingCards[i]!;
          if (cnt > 0) {
            const prob = cnt / remainingCount;
            const child = evaluate(
              i === 0 ? r1 - 1 : r1,
              i === 1 ? r2 - 1 : r2,
              i === 2 ? r3 - 1 : r3,
              i === 3 ? r4 - 1 : r4,
              i === 4 ? r5 - 1 : r5,
              P,
              D,
              A,
              roundDrawn + 1,
              drawnValue + i + 1,
              M,
            );
            expectedEu += prob * child.eu;
            expectedReward += prob * child.reward;
          }
        }
        result = { eu: expectedEu, reward: expectedReward };
      }
    }

    memo.set(key, result);
    return result;
  }

  return evaluate(deck[0]!, deck[1]!, deck[2]!, deck[3]!, deck[4]!, 3, 2, 3, 0, 0, 1);
}

/**
 * 穷举所有简化策略并与 DP 最优解对比
 *
 * 使用默认初始状态：P=3（结算次数）、D=2（翻倍次数）、A=3（放弃次数）
 *
 * @param deck - 铭牌库各等级数量，默认 DEFAULT_DECK_CONFIG
 * @param rewards - 奖励对照表，默认 DEFAULT_REWARDS
 * @param euParams - 期望效用模型参数（可选）
 * @returns 对比结果，含最优策略、DP 基准值和所有策略列表
 */
export function evaluateAllSimplifiedStrategies(
  deck: number[] = DEFAULT_DECK_CONFIG,
  rewards: number[] = DEFAULT_REWARDS,
  euParams?: ExpectedUtilityParams,
): SimplifiedStrategyResult {
  // 参数校验
  if (deck.length !== 5 || deck.some((c) => c < 0) || rewards.length === 0) {
    return {
      optimalStrategy: [],
      optimalEu: 0,
      optimalReward: 0,
      dpEu: 0,
      dpReward: 0,
      euEfficiency: 0,
      rewardEfficiency: 0,
      allStrategies: [],
    };
  }

  // 获取 DP 基准值（初始状态：未抽牌、未翻倍、P=3、D=2、A=3）
  const dpAdvice = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 3, euParams);
  const dpEu = dpAdvice?.euToday ?? 0;
  const dpReward = dpAdvice?.rewardToday ?? 0;

  // 穷举计算所有策略
  const combinations = generateStrategyCombinations();
  const allResults: StrategyEvalResult[] = combinations.map((strategy) => {
    const evalRes = evaluateSimplifiedStrategy(strategy, deck, rewards, euParams);
    return { strategy, eu: evalRes.eu, reward: evalRes.reward };
  });

  // 按 EU 寻找最优策略
  const optimal = allResults.reduce((best, curr) => (curr.eu > best.eu + 1e-6 ? curr : best));

  return {
    optimalStrategy: optimal.strategy,
    optimalEu: optimal.eu,
    optimalReward: optimal.reward,
    dpEu,
    dpReward,
    euEfficiency: dpEu > 1e-6 ? optimal.eu / dpEu : 0,
    rewardEfficiency: dpReward > 1e-6 ? optimal.reward / dpReward : 0,
    allStrategies: allResults,
  };
}
