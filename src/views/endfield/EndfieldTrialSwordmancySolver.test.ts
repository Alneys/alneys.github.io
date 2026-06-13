import { describe, it, expect } from 'vitest';
import { getCurrentAdvice, getPowerDistribution, solve } from './EndfieldTrialSwordmancySolver';

const rewards = [0, 1000, 2000, 4000, 7500, 12000, 20000, 36000, 60000, 100000, 160000];
const deck = [5, 5, 5, 8, 6];

/** Python 参考实现给出的基准数据：(P, B, A) → 期望收益 */
const expected: Record<string, number> = {
  '1,0,0': 88181.67,
  '1,0,1': 113161.01,
  '1,0,2': 128958.79,
  '1,0,3': 139428.32,
  '1,1,0': 176363.34,
  '1,1,1': 226322.03,
  '1,1,2': 257917.59,
  '1,1,3': 278856.65,
  '1,2,0': 176363.34,
  '1,2,1': 226322.03,
  '1,2,2': 257917.59,
  '1,2,3': 278856.65,
  '2,0,0': 176363.34,
  '2,0,1': 215972.82,
  '2,0,2': 241540.04,
  '2,0,3': 261064.51,
  '2,1,0': 270206.81,
  '2,1,1': 331494.81,
  '2,1,2': 371112.88,
  '2,1,3': 400899.77,
  '2,2,0': 352726.67,
  '2,2,1': 431945.65,
  '2,2,2': 483080.08,
  '2,2,3': 522129.02,
  '3,0,0': 264545.0,
  '3,0,1': 313872.66,
  '3,0,2': 347675.52,
  '3,0,3': 373445.64,
  '3,1,0': 361940.81,
  '3,1,1': 430553.13,
  '3,1,2': 475885.64,
  '3,1,3': 511374.21,
  '3,2,0': 449448.31,
  '3,2,1': 534169.39,
  '3,2,2': 591493.6,
  '3,2,3': 635610.87,
};

/**
 * 通过 getCurrentAdvice(全空牌库状态) 获取初始状态的今日总期望
 * 初始状态：drawnCounts = [0,0,0,0,0]，未翻倍
 * 此值应等于 Python 参考实现的 dp(deck_init, 1, P, B, A)
 */
function getInitialExpected(P: number, B: number, A: number): number {
  const result = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, P, B, A);
  if (!result) throw new Error('getCurrentAdvice returned null');
  return result.expected_today;
}

describe('EndfieldTrialSwordmancySolver', () => {
  it.each(Object.entries(expected))(
    'P=%s B=%s A=%s 的初始期望收益应匹配 Python 基准',
    (key, exp) => {
      const [P, B, A] = key.split(',').map(Number);
      const actual = getInitialExpected(P!, B!, A!);
      expect(actual).toBeCloseTo(exp!, 0);
    },
    30000,
  );

  it('默认初始状态 P=3 B=2 A=3 的期望收益为 635,610.87', () => {
    const result = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 3);
    expect(result).not.toBeNull();
    expect(result!.expected_today).toBeCloseTo(635610.87, 0);
  });

  it('放弃次数为 0 时的结果应与原无放弃机制的版本一致', () => {
    // P=3 B=2 A=0 应与用户最初提供的 P=3 B=2 基准一致
    const withAbandon = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 0);
    expect(withAbandon).not.toBeNull();
    expect(withAbandon!.expected_today).toBeCloseTo(449448.31, 0);
  });

  it('已抽满 5 张时仍可放弃', () => {
    // 已抽 5 张等级 1（最差情况），A=1，P=1，B=0
    // 此时放弃的期望应高于结算
    const result = getCurrentAdvice([5, 0, 0, 0, 0], deck, rewards, false, 1, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.abandon_total).not.toBeNull();
    expect(result!.stop_total).not.toBeNull();
    expect(result!.optimal_action).toBe('abandon');
  });

  it('放弃次数为 0 时 optimal_action 不应为 abandon', () => {
    const result = getCurrentAdvice([1, 0, 0, 0, 0], deck, rewards, false, 3, 2, 0);
    expect(result).not.toBeNull();
    expect(result!.optimal_action).not.toBe('abandon');
  });

  it('未抽牌时不能结算也不能放弃（无剩余翻倍次数）', () => {
    const result = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 0, 3);
    expect(result).not.toBeNull();
    expect(result!.optimal_action).toBe('must_continue');
    expect(result!.stop_total).toBeNull();
    expect(result!.abandon_total).toBeNull();
  });

  it('有翻倍次数时 D=0 可能建议先翻倍', () => {
    const result = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 3);
    expect(result).not.toBeNull();
    expect(['must_continue', 'double']).toContain(result!.optimal_action);
  });

  describe('溢出厌恶模型 (OverflowParams)', () => {
    it('默认参数应与原始结果一致', () => {
      const raw = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 3);
      const withDefault = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 3, {
        aversionFactor: 1.0,
        fixedPenalty: 0,
      });
      expect(withDefault!.expected_today).toBeCloseTo(raw!.expected_today, 0);
    });

    it('带溢出参数时的期望应低于原始期望', () => {
      const raw = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 3);
      const withOverflow = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 3, {
        aversionFactor: 0.9,
        fixedPenalty: 20000,
      });
      expect(withOverflow).not.toBeNull();
      expect(withOverflow!.expected_today).toBeLessThan(raw!.expected_today);
    });

    it('solve() 默认参数应与原始一致', () => {
      const raw = solve(deck, rewards);
      const withDefault = solve(deck, rewards, { aversionFactor: 1.0, fixedPenalty: 0 });
      expect(withDefault.length).toBe(raw.length);
      for (let i = 0; i < raw.length; i++) {
        expect(withDefault[i]!.current_reward).toBe(raw[i]!.current_reward);
        expect(withDefault[i]!.optimal_action).toBe(raw[i]!.optimal_action);
      }
    });

    it('solve() 带溢出参数时的奖励应降低或不变', () => {
      const withOverflow = solve(deck, rewards, { aversionFactor: 0.9, fixedPenalty: 20000 });
      // 组合 "55555" 总战力 = 25, k = 2, S = 3
      // adjusted = 4000 * 0.9^2 - 2*20000 = 3240 - 40000 = -36760
      const combo55555 = withOverflow.find((r) => r.combination === '55555');
      expect(combo55555).toBeDefined();
      expect(combo55555!.current_reward).toBe(-36760);

      // 组合 "555" 总战力 = 15, k = 1, S = 4
      // adjusted = 7500 * 0.9^1 - 1*20000 = 6750 - 20000 = -13250
      const combo555 = withOverflow.find((r) => r.combination === '555');
      expect(combo555).toBeDefined();
      expect(combo555!.current_reward).toBe(-13250);

      // 组合 "55" 总战力 = 10, k = 0, S = 10
      // adjusted = 160000 - 0 = 160000 (k=0，不受影响)
      const combo55 = withOverflow.find((r) => r.combination === '55');
      expect(combo55).toBeDefined();
      expect(combo55!.current_reward).toBe(160000);

      // 组合 "5" (1张5) 总战力 = 5, k = 0, S = 5
      // adjusted = 12000 - 0 = 12000 (k=0，不受影响)
      const combo5 = withOverflow.find((r) => r.combination === '5');
      expect(combo5).toBeDefined();
      expect(combo5!.current_reward).toBe(12000);
    });
  });

  describe('getPowerDistribution 翻倍状态', () => {
    it('已翻倍且已抽 531 时分布不应锁定在当前战力点', () => {
      // 已抽 531 → drawnCounts=[1,0,1,0,1], 总战力=9, 有效战力=9%11=9
      // 已翻倍 (M=2), remainingDoubles=1 (已用掉一次), P=3, A=3
      // getCurrentAdvice 建议继续, vDraw=611402.24 > vStop=600899.77
      const dist = getPowerDistribution(
        [1, 0, 1, 0, 1],
        deck,
        rewards,
        undefined,
        3,
        1,
        3,
        true, // doubled
      );
      expect(dist).not.toBeNull();
      // 不应锁定在 9=100%（未传 doubled 时的 bug）
      expect(dist!.distribution[9]).toBeLessThan(1);
      // 继续抽牌后存在放弃的可能性
      expect(dist!.abandonProb).toBeGreaterThan(0);
    });

    it('已翻倍且已抽 531 时 getCurrentAdvice 建议继续', () => {
      const advice = getCurrentAdvice(
        [1, 0, 1, 0, 1],
        deck,
        rewards,
        true, // doubled
        3,
        1,
        3,
      );
      expect(advice).not.toBeNull();
      expect(advice!.optimal_action).toBe('continue');
      expect(advice!.draw_total).toBeCloseTo(611402.24, 0);
      expect(advice!.stop_total).toBeCloseTo(600899.77, 0);
      expect(advice!.abandon_total).toBeCloseTo(591493.6, 0);
    });

    it('未翻倍时传 doubled=false 应与不传一致', () => {
      const without = getPowerDistribution([0, 0, 0, 0, 0], deck, rewards, undefined, 3, 2, 3);
      const withFalse = getPowerDistribution(
        [0, 0, 0, 0, 0],
        deck,
        rewards,
        undefined,
        3,
        2,
        3,
        false,
      );
      expect(withFalse!.distribution).toEqual(without!.distribution);
      expect(withFalse!.abandonProb).toEqual(without!.abandonProb);
    });
  });

  describe('getPowerDistribution 放弃概率', () => {
    it('已抽 11451（3张1,1张4,1张5），P=3 B=2 A=3 应显示放弃 100%', () => {
      // 总战力 = 3*1 + 4 + 5 = 12，有效战力 = 12 % 11 = 1
      // 放弃期望 = dp(全牌池, 1, 3, 2, 2) = 591493.60
      // 停止期望 = 1000 + dp(全牌池, 1, 2, 2, 3) = 1000 + 522129.02 = 523129.02
      // 放弃 > 停止 → 最优策略为放弃
      const result = getPowerDistribution(
        [3, 0, 0, 1, 1], // 11451
        deck,
        rewards,
        undefined,
        3,
        2,
        3,
      );
      expect(result).not.toBeNull();
      expect(result!.abandonProb).toBeCloseTo(1, 2);
      for (let i = 0; i < 11; i++) {
        expect(result!.distribution[i]).toBeCloseTo(0, 2);
      }
    });

    it('已抽满 5 张且放弃更优时 getCurrentAdvice 建议放弃', () => {
      // 与上一条相同的条件
      const advice = getCurrentAdvice(
        [3, 0, 0, 1, 1], // 11451
        deck,
        rewards,
        false,
        3,
        2,
        3,
      );
      expect(advice).not.toBeNull();
      expect(advice!.optimal_action).toBe('abandon');
      expect(advice!.abandon_total).toBeCloseTo(591493.6, 0);
      expect(advice!.stop_total).toBeCloseTo(523129.02, 0);
    });

    it('已抽满 5 张时 getPowerDistribution 的放弃概率应与 getCurrentAdvice 决策一致', () => {
      // 5 张 1 级，最差情况，A=1 P=1 B=0，应放弃
      const dist = getPowerDistribution([5, 0, 0, 0, 0], deck, rewards, undefined, 1, 0, 1);
      expect(dist).not.toBeNull();
      expect(dist!.abandonProb).toBeCloseTo(1, 2);

      const advice = getCurrentAdvice([5, 0, 0, 0, 0], deck, rewards, false, 1, 0, 1);
      expect(advice).not.toBeNull();
      expect(advice!.optimal_action).toBe('abandon');
    });

    it('无放弃次数时 getPowerDistribution 不会显示放弃', () => {
      const result = getPowerDistribution(
        [3, 0, 0, 1, 1], // 11451
        deck,
        rewards,
        undefined,
        3,
        2,
        0, // A=0
      );
      expect(result).not.toBeNull();
      expect(result!.abandonProb).toBe(0);
    });
  });
});
