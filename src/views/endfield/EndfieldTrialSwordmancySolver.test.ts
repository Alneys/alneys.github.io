import { describe, it, expect } from 'vitest';
import { getCurrentAdvice } from './EndfieldTrialSwordmancySolver';

const rewards = [0, 1000, 2000, 4000, 7500, 12000, 20000, 36000, 60000, 100000, 160000];
const deck = [5, 5, 5, 8, 6];

/** Python 参考实现给出的基准数据：(P, D, A) → 期望收益 */
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
  '2,1,0': 281043.25,
  '2,1,1': 335487.13,
  '2,1,2': 373758.68,
  '2,1,3': 402653.2,
  '2,2,0': 352726.67,
  '2,2,1': 431945.65,
  '2,2,2': 483080.08,
  '2,2,3': 522129.02,
  '3,0,0': 264545.0,
  '3,0,1': 313872.66,
  '3,0,2': 347675.52,
  '3,0,3': 373445.64,
  '3,1,0': 375405.32,
  '3,1,1': 435963.91,
  '3,1,2': 479113.39,
  '3,1,3': 513509.25,
  '3,2,0': 468513.28,
  '3,2,1': 543521.15,
  '3,2,2': 596903.01,
  '3,2,3': 639603.99,
};

/**
 * 通过 getCurrentAdvice(全空铭牌库状态) 获取初始状态的今日总期望
 * 初始状态：drawnCounts = [0,0,0,0,0]，未翻倍
 * 此值应等于 Python 参考实现的 dp(deck_init, 1, P, D, A)
 */
function getInitialExpected(P: number, D: number, A: number): number {
  const result = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, P, D, A);
  if (!result) throw new Error('getCurrentAdvice returned null');
  return result.rewardToday;
}

describe('EndfieldTrialSwordmancySolver', () => {
  it.each(Object.entries(expected))(
    'P=%s D=%s A=%s 的初始期望收益应匹配 Python 基准',
    (key, exp) => {
      const [P, D, A] = key.split(',').map(Number);
      const actual = getInitialExpected(P!, D!, A!);
      expect(actual).toBeCloseTo(exp!, 0);
    },
    30000,
  );

  it('默认初始状态 P=3 D=2 A=3 的期望收益为 639,603.99', () => {
    const result = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 3);
    expect(result).not.toBeNull();
    expect(result!.rewardToday).toBeCloseTo(639603.99, 0);
  });

  it('放弃次数为 0 时的结果高于原无放弃机制的版本（因为 A=0 时也可放弃作为新选项）', () => {
    const withAbandon = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 0);
    expect(withAbandon).not.toBeNull();
    expect(withAbandon!.rewardToday).toBeCloseTo(468513.28, 0);
  });

  it('已抽满 5 张时仍可放弃', () => {
    // 已抽 5 张等级 1（最差情况），A=1，P=1，D=0
    // 此时放弃的期望应高于结算
    const result = getCurrentAdvice(deck, rewards, [5, 0, 0, 0, 0], false, 1, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.rewardAbandon).not.toBeNull();
    expect(result!.rewardStop).not.toBeNull();
    expect(result!.optimalAction).toBe('abandon');
  });

  it('放弃次数为 0 时 optimalAction 不应为 abandon', () => {
    const result = getCurrentAdvice(deck, rewards, [1, 0, 0, 0, 0], false, 3, 2, 0);
    expect(result).not.toBeNull();
    expect(result!.optimalAction).not.toBe('abandon');
  });

  it('未抽取铭牌时可以结算（奖励为 0），但不能放弃', () => {
    const result = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 0, 3);
    expect(result).not.toBeNull();
    // 无翻倍次数时继续优于结算（因为停牌奖励为 0），沿用 must_continue 兼容 UI
    expect(result!.optimalAction).toBe('must_continue');
    // rewardStop 应显示结算期望（0 + 下一局期望），不再为 null
    expect(result!.rewardStop).not.toBeNull();
    // 放弃仍不允许
    expect(result!.rewardAbandon).toBeNull();
    expect(result!.euAbandon).toBeNull();
  });

  it('P=0 无剩余游玩次数时初始状态期望为 0', () => {
    const result = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 0, 0, 0);
    expect(result).not.toBeNull();
    expect(result!.rewardToday).toBe(0);
    expect(result!.rewardAfterStop).toBe(0);
  });

  it('有翻倍次数时 D=0 可能建议先翻倍', () => {
    const result = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 3);
    expect(result).not.toBeNull();
    expect(['must_continue', 'double']).toContain(result!.optimalAction);
  });

  describe('期望效用模型 (ExpectedUtilityParams)', () => {
    it('默认参数应与原始结果一致', () => {
      const raw = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 3);
      const withDefault = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 3, {
        aversionFactor: 1.0,
        fixedPenalty: 0,
      });
      expect(withDefault!.rewardToday).toBeCloseTo(raw!.rewardToday, 0);
    });

    it('带溢出参数时的期望应低于原始期望', () => {
      const raw = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 3);
      const withOverflow = getCurrentAdvice(deck, rewards, [0, 0, 0, 0, 0], false, 3, 2, 3, {
        aversionFactor: 0.9,
        fixedPenalty: 20000,
      });
      expect(withOverflow).not.toBeNull();
      expect(withOverflow!.rewardToday).toBeLessThan(raw!.rewardToday);
    });
  });

  describe('战力点概率分布（合并到 getCurrentAdvice）', () => {
    it('已翻倍且已抽 531 时分布不应锁定在当前战力点', () => {
      // 已抽 531 → drawnCounts=[1,0,1,0,1], 总战力=9, 战力点=9%11=9
      // 已翻倍 (M=2), 原本剩余翻倍次数=2（已用掉一次, solver 内部扣减）, P=3, A=3
      const advice = getCurrentAdvice(
        deck,
        rewards,
        [1, 0, 1, 0, 1],
        true, // doubled
        3,
        2,
        3,
      );
      expect(advice).not.toBeNull();
      // 不应锁定在 9=100%（未传 doubled 时的 bug）
      expect(advice!.distribution[9]).toBeLessThan(1);
      // 继续抽取铭牌后存在放弃的可能性
      expect(advice!.abandonProb).toBeGreaterThan(0);
    });

    it('已翻倍且已抽 531 时 getCurrentAdvice 建议继续', () => {
      const advice = getCurrentAdvice(
        deck,
        rewards,
        [1, 0, 1, 0, 1],
        true, // doubled
        3,
        2,
        3,
      );
      expect(advice).not.toBeNull();
      expect(advice!.optimalAction).toBe('continue');
      expect(advice!.rewardDraw).toBeCloseTo(616249.19, 0);
      expect(advice!.rewardStop).toBeCloseTo(602653.2, 0);
      expect(advice!.rewardAbandon).toBeCloseTo(596903.01, 0);
    });

    it('已抽 11451 应显示放弃 100%', () => {
      // 总战力 = 3*1 + 4 + 5 = 12，战力点 = 12 % 11 = 1
      // 放弃期望 = dp(铭牌库, 1, 3, 2, 2) = 596903.01 (A=0 放弃选项提升了下游 DP 值)
      // 停止期望 = 1000 + dp(铭牌库, 1, 2, 2, 3) = 1000 + 522129.02 = 523129.02
      // 放弃 > 停止 → 最优策略为放弃
      const advice = getCurrentAdvice(
        deck,
        rewards,
        [3, 0, 0, 1, 1], // 11451
        false,
        3,
        2,
        3,
      );
      expect(advice).not.toBeNull();
      expect(advice!.optimalAction).toBe('abandon');
      expect(advice!.abandonProb).toBeCloseTo(1, 2);
      for (let i = 0; i < 11; i++) {
        expect(advice!.distribution[i]).toBeCloseTo(0, 2);
      }
      expect(advice!.rewardAbandon).toBeCloseTo(596903.01, 0);
      expect(advice!.rewardStop).toBeCloseTo(523129.02, 0);
    });

    it('已抽满 5 张时放弃概率应与 optimalAction 一致', () => {
      // 5 张 1 级，最差情况，A=1 P=1 D=0，应放弃
      const advice = getCurrentAdvice(deck, rewards, [5, 0, 0, 0, 0], false, 1, 0, 1);
      expect(advice).not.toBeNull();
      expect(advice!.abandonProb).toBeCloseTo(1, 2);
      expect(advice!.optimalAction).toBe('abandon');
    });

    it('无放弃次数时 abandonProb 应为 0', () => {
      const advice = getCurrentAdvice(
        deck,
        rewards,
        [3, 0, 0, 1, 1], // 11451
        false,
        3,
        2,
        0, // A=0
      );
      expect(advice).not.toBeNull();
      expect(advice!.abandonProb).toBe(0);
    });
  });
});
