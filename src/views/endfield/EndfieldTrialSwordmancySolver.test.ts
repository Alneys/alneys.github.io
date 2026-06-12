import { describe, it, expect } from 'vitest';
import { getCurrentAdvice } from './EndfieldTrialSwordmancySolver';

const rewards = [0, 2000, 4000, 8000, 15000, 24000, 40000, 72000, 120000, 200000, 320000];
const deck = [5, 5, 5, 8, 6];

/** Python 参考实现给出的基准数据：(P, B, A) → 期望收益 */
const expected: Record<string, number> = {
  '1,0,0': 176363.34,
  '1,0,1': 226322.03,
  '1,0,2': 257917.59,
  '1,0,3': 278856.65,
  '1,1,0': 352726.67,
  '1,1,1': 452644.05,
  '1,1,2': 515835.17,
  '1,1,3': 557713.29,
  '1,2,0': 352726.67,
  '1,2,1': 452644.05,
  '1,2,2': 515835.17,
  '1,2,3': 557713.29,
  '2,0,0': 352726.67,
  '2,0,1': 431945.65,
  '2,0,2': 483080.08,
  '2,0,3': 522129.02,
  '2,1,0': 540413.63,
  '2,1,1': 662989.63,
  '2,1,2': 742225.76,
  '2,1,3': 801799.55,
  '2,2,0': 705453.35,
  '2,2,1': 863891.29,
  '2,2,2': 966160.15,
  '2,2,3': 1044258.03,
  '3,0,0': 529090.01,
  '3,0,1': 627745.32,
  '3,0,2': 695351.04,
  '3,0,3': 746891.29,
  '3,1,0': 723881.61,
  '3,1,1': 861106.26,
  '3,1,2': 951771.29,
  '3,1,3': 1022748.42,
  '3,2,0': 898896.63,
  '3,2,1': 1068338.78,
  '3,2,2': 1182987.2,
  '3,2,3': 1271221.74,
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

  it('默认初始状态 P=3 B=2 A=3 的期望收益为 1,271,221.74', () => {
    const result = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 3);
    expect(result).not.toBeNull();
    expect(result!.expected_today).toBeCloseTo(1271221.74, 0);
  });

  it('放弃次数为 0 时的结果应与原无放弃机制的版本一致', () => {
    // P=3 B=2 A=0 应与用户最初提供的 P=3 B=2 基准一致
    const withAbandon = getCurrentAdvice([0, 0, 0, 0, 0], deck, rewards, false, 3, 2, 0);
    expect(withAbandon).not.toBeNull();
    expect(withAbandon!.expected_today).toBeCloseTo(898896.63, 0);
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
});
