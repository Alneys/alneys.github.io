/** 单个抽取组合的结果（单局 DP，不考虑翻倍与多局） */
export interface SolverResultEntry {
  combination: string;
  current_reward: number;
  expected_continue_reward: number | null;
  optimal_action: 'stop' | 'continue' | 'must_continue' | 'must_stop' | 'double';
  drawn: number;
}

/** 当前状态的实时建议 */
export interface AdviceResult {
  current_reward: number;
  expected_continue_reward: number | null;
  expected_today: number;
  optimal_action: 'stop' | 'continue' | 'must_continue' | 'must_stop' | 'double' | 'abandon';
  /** 各行动的今日总期望（含未来局数），null 表示该行动不可用 */
  draw_total: number | null;
  double_total: number | null;
  stop_total: number | null;
  abandon_total: number | null;
  /** 结算本局后剩余局数的期望 */
  expected_after_stop: number;
}

/**
 * 生成所有可能的抽取组合（可重复组合，字典序非递减）
 * 例如牌池足够时：""、"1"、"11"、"12"、……、"55555"
 */
function generateCombinations(
  deck: number[],
  maxDraws: number,
): { comboStr: string; counts: number[] }[] {
  const combinations: { comboStr: string; counts: number[] }[] = [];
  const levels = [1, 2, 3, 4, 5];
  const totalCards = deck.reduce((a, b) => a + b, 0);

  function generate(k: number, start: number, current: number[]) {
    if (current.length === k) {
      const counts = [0, 0, 0, 0, 0];
      for (const c of current) counts[c - 1]!++;
      if (counts.every((count, i) => count <= deck[i]!)) {
        combinations.push({
          comboStr: current.join(''),
          counts: [...counts],
        });
      }
      return;
    }
    for (let i = start; i < 5; i++) {
      current.push(levels[i]!);
      generate(k, i, current);
      current.pop();
    }
  }

  for (let k = 0; k <= Math.min(maxDraws, totalCards); k++) {
    generate(k, 0, []);
  }
  return combinations;
}

/** 安全获取奖励值（防止越界） */
function safeReward(rewards: number[], s: number): number {
  const idx = Math.min(Math.max(0, s), rewards.length - 1);
  return rewards[idx]!;
}

/**
 * DP 求解最优策略下的完整结果表
 *
 * 状态：(c1,c2,c3,c4,c5) 表示各等级剩余张数
 * 已抽战力 s = (初始总战力 - 剩余总战力) mod 模数
 *
 * 转移方程：
 *   V(c) = max(R(s), E[V(c')])   已抽 1~4 张，可停可抽
 *   V(c) = E[V(c')]               未抽牌，必须抽
 *   V(c) = R(s)                   已抽 5 张，必须停
 */
export function solve(deck: number[], rewards: number[]): SolverResultEntry[] {
  const modValue = rewards.length;
  const maxDraws = 5;
  const totalCards = deck.reduce((a, b) => a + b, 0);
  const initialTotal = deck.reduce((sum, count, i) => sum + count * (i + 1), 0);

  const allCombos = generateCombinations(deck, maxDraws);
  allCombos.sort((a, b) => {
    if (a.comboStr.length !== b.comboStr.length) return a.comboStr.length - b.comboStr.length;
    if (a.comboStr < b.comboStr) return -1;
    if (a.comboStr > b.comboStr) return 1;
    return 0;
  });

  const memo = new Map<string, number>();

  /** 记忆化搜索，逆向归纳计算最优期望奖励 */
  function dp(r1: number, r2: number, r3: number, r4: number, r5: number): number {
    const key = `${r1},${r2},${r3},${r4},${r5}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    const remaining = r1 + r2 + r3 + r4 + r5;
    const drawn = totalCards - remaining;
    const drawnValue = initialTotal - (r1 * 1 + r2 * 2 + r3 * 3 + r4 * 4 + r5 * 5);
    const s = ((drawnValue % modValue) + modValue) % modValue;

    // 已抽 5 张，必须停止，直接返回当前奖励
    if (drawn === maxDraws) {
      const r = safeReward(rewards, s);
      memo.set(key, r);
      return r;
    }

    // 计算继续抽牌的期望值：各等级的加权平均
    const rs = [r1, r2, r3, r4, r5];
    let evContinue = 0;
    for (let i = 0; i < 5; i++) {
      if (rs[i]! > 0) {
        const nextState = [...rs];
        nextState[i]!--;
        evContinue +=
          (rs[i]! / remaining) *
          dp(nextState[0]!, nextState[1]!, nextState[2]!, nextState[3]!, nextState[4]!);
      }
    }

    // 未抽牌必须继续；否则可选择停止（取 max）
    let result: number;
    if (drawn === 0) {
      result = evContinue;
    } else {
      result = Math.max(safeReward(rewards, s), evContinue);
    }

    memo.set(key, result);
    return result;
  }

  // 遍历所有组合，对比当前奖励与继续期望，得出最优行动
  const results: SolverResultEntry[] = [];
  for (const { comboStr, counts } of allCombos) {
    const drawn = counts.reduce((a, b) => a + b, 0);
    const drawnValue = counts.reduce((sum, count, i) => sum + count * (i + 1), 0);
    const s = ((drawnValue % modValue) + modValue) % modValue;
    const currentReward = safeReward(rewards, s);

    const remaining = deck.map((d, i) => d - counts[i]!);
    const totalRemaining = remaining.reduce((a, b) => a + b, 0);

    let evContinue: number | null = null;
    let optimalAction: SolverResultEntry['optimal_action'];

    if (drawn === 0) {
      // 初始状态：必须抽第一张
      evContinue = 0;
      for (let i = 0; i < 5; i++) {
        if (remaining[i]! > 0) {
          const nextRemaining = [...remaining];
          nextRemaining[i]!--;
          evContinue +=
            (remaining[i]! / totalRemaining) *
            dp(
              nextRemaining[0]!,
              nextRemaining[1]!,
              nextRemaining[2]!,
              nextRemaining[3]!,
              nextRemaining[4]!,
            );
        }
      }
      evContinue = Math.round(evContinue * 100) / 100;
      optimalAction = 'must_continue';
    } else if (drawn >= maxDraws) {
      // 已抽满 5 张，必须停止
      optimalAction = 'must_stop';
    } else if (totalRemaining === 0) {
      // 牌池已空，无法继续
      optimalAction = 'must_stop';
    } else {
      // 可停可抽：比较当前奖励和继续期望，选较大者
      evContinue = 0;
      for (let i = 0; i < 5; i++) {
        if (remaining[i]! > 0) {
          const nextRemaining = [...remaining];
          nextRemaining[i]!--;
          evContinue +=
            (remaining[i]! / totalRemaining) *
            dp(
              nextRemaining[0]!,
              nextRemaining[1]!,
              nextRemaining[2]!,
              nextRemaining[3]!,
              nextRemaining[4]!,
            );
        }
      }
      evContinue = Math.round(evContinue * 100) / 100;
      optimalAction = evContinue > currentReward ? 'continue' : 'stop';
    }

    results.push({
      combination: comboStr,
      current_reward: currentReward,
      expected_continue_reward: evContinue,
      optimal_action: optimalAction,
      drawn,
    });
  }

  return results;
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
 *   - 继续抽牌：抽一张，状态转移到 (r_tuple - 1_i, M, P, B)
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
): AdviceResult | null {
  const modValue = rewards.length;
  const maxDraws = 5;
  const totalCards = deck.reduce((a, b) => a + b, 0);
  const initialTotal = deck.reduce((sum, count, i) => sum + count * (i + 1), 0);
  const deckInit = [...deck];

  const drawn = drawnCounts.reduce((a, b) => a + b, 0);
  const drawnValue = drawnCounts.reduce((sum, count, i) => sum + count * (i + 1), 0);
  const s = ((drawnValue % modValue) + modValue) % modValue;
  const M = doubled ? 2 : 1;
  const currentReward = safeReward(rewards, s) * M;

  const remaining = deck.map((d, i) => d - drawnCounts[i]!);
  const totalRemaining = remaining.reduce((a, b) => a + b, 0);
  const P = remainingGames;
  const B = remainingDoubles;
  const A = remainingAbandons;

  const memo = new Map<string, number>();

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
  ): number {
    const key = `${r1},${r2},${r3},${r4},${r5},${Mv},${P},${B},${A}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    if (P === 0) {
      memo.set(key, 0);
      return 0;
    }

    const rem = r1 + r2 + r3 + r4 + r5;
    const drn = totalCards - rem;
    const dv = initialTotal - (r1 * 1 + r2 * 2 + r3 * 3 + r4 * 4 + r5 * 5);
    const sp = ((dv % modValue) + modValue) % modValue;
    const cr = safeReward(rewards, sp) * Mv;

    const cannotStop = drn === 0;
    const rs = [r1, r2, r3, r4, r5];

    let vDraw = -Infinity;
    if (drn < maxDraws && rem > 0) {
      vDraw = 0;
      for (let i = 0; i < 5; i++) {
        if (rs[i]! > 0) {
          const prob = rs[i]! / rem;
          const next = [...rs];
          next[i]!--;
          vDraw += prob * dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, Mv, P, B, A);
        }
      }
    }

    let vDouble = -Infinity;
    if (drn < 3 && Mv === 1 && B > 0) {
      vDouble = dpDaily(r1, r2, r3, r4, r5, 2, P, B - 1, A);
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
        );
    }

    let vAbandon = -Infinity;
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
      );
    }

    const result = Math.max(vDraw, vDouble, vStop, vAbandon);

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
        )
      : 0;

  if (drawn >= maxDraws || totalRemaining === 0) {
    let vAbandon = -Infinity;
    if (A > 0 && drawn > 0) {
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
      );
    }

    const vStop = currentReward + futureValue;
    const best = Math.max(vStop, vAbandon);
    const expectedToday = Math.round(best * 100) / 100;

    let optimalAction: AdviceResult['optimal_action'];
    if (A > 0 && drawn > 0 && vAbandon >= vStop) {
      optimalAction = 'abandon';
    } else {
      optimalAction = 'must_stop';
    }

    return {
      current_reward: currentReward,
      expected_continue_reward: null,
      expected_today: expectedToday,
      optimal_action: optimalAction,
      draw_total: null,
      double_total: null,
      stop_total: Math.round(vStop * 100) / 100,
      abandon_total: A > 0 && drawn > 0 ? Math.round(vAbandon * 100) / 100 : null,
      expected_after_stop: Math.round(futureValue * 100) / 100,
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
      vDraw += prob * dpDaily(next[0]!, next[1]!, next[2]!, next[3]!, next[4]!, M, P, B, A);
    }
  }

  let vDouble = -Infinity;
  if (drawn < 3 && !doubled && B > 0) {
    vDouble = dpDaily(rState[0]!, rState[1]!, rState[2]!, rState[3]!, rState[4]!, 2, P, B - 1, A);
  }

  let vStop = -Infinity;
  if (drawn > 0) {
    vStop = currentReward + futureValue;
  }

  let vAbandon = -Infinity;
  if (A > 0 && drawn > 0) {
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
    );
  }

  const evContinue = Math.max(vDraw, vDouble);
  const expectedContinueReward = Math.round((evContinue - futureValue) * 100) / 100;
  const expectedToday = Math.round(Math.max(vStop, evContinue, vAbandon) * 100) / 100;

  const isDoubleOptimal =
    drawn < 3 && M === 1 && B > 0 && vDouble >= vDraw && vDouble >= vStop && vDouble >= vAbandon;
  const isAbandonOptimal =
    A > 0 && drawn > 0 && vAbandon >= vStop && vAbandon >= evContinue && !isDoubleOptimal;

  let optimalAction: AdviceResult['optimal_action'];
  if (drawn === 0 && !isDoubleOptimal && !isAbandonOptimal) {
    optimalAction = 'must_continue';
  } else if (isDoubleOptimal) {
    optimalAction = 'double';
  } else if (isAbandonOptimal) {
    optimalAction = 'abandon';
  } else if (evContinue > vStop) {
    optimalAction = 'continue';
  } else {
    optimalAction = 'stop';
  }

  return {
    current_reward: currentReward,
    expected_continue_reward: expectedContinueReward,
    expected_today: expectedToday,
    optimal_action: optimalAction,
    draw_total: Math.round(vDraw * 100) / 100,
    double_total: drawn < 3 && !doubled && B > 0 ? Math.round(vDouble * 100) / 100 : null,
    stop_total: drawn > 0 ? Math.round(vStop * 100) / 100 : null,
    abandon_total: A > 0 && drawn > 0 ? Math.round(vAbandon * 100) / 100 : null,
    expected_after_stop: Math.round(futureValue * 100) / 100,
  };
}
