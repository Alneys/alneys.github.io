/** 单个抽取组合的结果 */
export interface SolverResultEntry {
  combination: string;
  current_reward: number;
  expected_continue_reward: number | null;
  optimal_action: 'stop' | 'continue' | 'must_continue' | 'must_stop';
  drawn: number;
}

/** 当前状态的实时建议 */
export interface AdviceResult {
  current_reward: number;
  expected_continue_reward: number | null;
  optimal_action: 'stop' | 'continue' | 'must_continue' | 'must_stop';
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

/** 获取当前已抽牌状态下的最优行动建议 */
export function getCurrentAdvice(
  drawnCounts: number[],
  deck: number[],
  rewards: number[],
): AdviceResult | null {
  const drawn = drawnCounts.reduce((a, b) => a + b, 0);

  const modValue = rewards.length;
  const drawnValue = drawnCounts.reduce((sum, count, i) => sum + count * (i + 1), 0);
  const s = ((drawnValue % modValue) + modValue) % modValue;
  const currentReward = safeReward(rewards, s);

  const remaining = deck.map((d, i) => d - drawnCounts[i]!);
  const totalRemaining = remaining.reduce((a, b) => a + b, 0);

  // 无法继续抽牌的情况
  if (drawn >= 5 || totalRemaining === 0) {
    return {
      current_reward: currentReward,
      expected_continue_reward: null,
      optimal_action: 'must_stop',
    };
  }

  // 从求解结果中查找当前组合，返回建议
  const results = solve(deck, rewards);
  const entry = results.find(
    (r) => r.combination === drawnCounts.map((c, i) => String(i + 1).repeat(c)).join(''),
  );
  if (!entry) return null;

  return {
    current_reward: entry.current_reward,
    expected_continue_reward: entry.expected_continue_reward,
    optimal_action: entry.optimal_action,
  };
}
