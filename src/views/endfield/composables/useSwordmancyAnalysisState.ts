import { computed, watch } from 'vue';

import { evaluateAllSimplifiedStrategies } from '../utils/SwordmancySimplified';
import type { SimplifiedStrategyResult, StrategyEvalResult } from '../utils/SwordmancySimplified';
import { getCurrentAdvice } from '../utils/SwordmancySolver';
import type { AdviceResult } from '../utils/SwordmancySolver';
import { useSwordmancySharedState } from './useSwordmancySharedState';

export function useSwordmancyAnalysisState() {
  const shared = useSwordmancySharedState();

  const {
    debouncedDeckConfig,
    rewardValues,
    drawnCounts,
    doubled,
    remainingGames,
    remainingDoubles,
    remainingAbandons,
    euParams,
    showEuColumn,
    hasWarning,
    canDraw,
    rewardIndex,
    simplifiedStrategyResult,
    solverLoading,
  } = shared;

  /** 当前状态的最优行动建议（不含期望效用模型） */
  const currentAdvice = computed<AdviceResult | null>(() => {
    const deck = debouncedDeckConfig.value;
    const rewards = rewardValues.value;
    if (deck.some((c) => c < 0)) return null;
    return getCurrentAdvice(
      deck,
      rewards,
      drawnCounts.value,
      doubled.value,
      remainingGames.value,
      remainingDoubles.value,
      remainingAbandons.value,
    );
  });

  /** 调整后的最优行动建议（含期望效用模型） */
  const euAdvice = computed<AdviceResult | null>(() => {
    const deck = debouncedDeckConfig.value;
    const rewards = rewardValues.value;
    if (deck.some((c) => c < 0) || !euParams.value) return currentAdvice.value;
    return getCurrentAdvice(
      deck,
      rewards,
      drawnCounts.value,
      doubled.value,
      remainingGames.value,
      remainingDoubles.value,
      remainingAbandons.value,
      euParams.value,
    );
  });

  /** 下一张抽到各等级后的概率与期望 */
  const perLevelAdvice = computed(() => {
    const deck = debouncedDeckConfig.value;
    const rewards = rewardValues.value;
    const dc = drawnCounts.value;
    if (deck.some((c) => c < 0)) return [];
    if (!canDraw.value) {
      return [1, 2, 3, 4, 5].map((level) => ({
        level,
        prob: 0,
        rewardDiff: null as number | null,
        euDiff: null as number | null,
      }));
    }
    const remaining = deck.map((d, i) => d - dc[i]!);
    const totalRemaining = remaining.reduce((a, b) => a + b, 0);
    const result: {
      level: number;
      prob: number;
      rewardDiff: number | null;
      euDiff: number | null;
    }[] = [];
    const currentRewardExp = euAdvice.value?.rewardToday ?? 0;
    const currentEu = euAdvice.value?.euToday ?? currentRewardExp;
    for (let i = 0; i < 5; i++) {
      if (remaining[i]! > 0) {
        const prob = remaining[i]! / totalRemaining;
        const nextDrawn = [...dc];
        nextDrawn[i]!++;
        const nextResult = getCurrentAdvice(
          deck,
          rewards,
          nextDrawn,
          doubled.value,
          remainingGames.value,
          remainingDoubles.value,
          remainingAbandons.value,
          euParams.value,
        );
        result.push({
          level: i + 1,
          prob: Math.round(prob * 10000) / 10000,
          rewardDiff: nextResult
            ? Math.round((nextResult.rewardToday - currentRewardExp) * 100) / 100
            : null,
          euDiff: nextResult ? Math.round((nextResult.euToday - currentEu) * 100) / 100 : null,
        });
      } else {
        result.push({
          level: i + 1,
          prob: 0,
          rewardDiff: null,
          euDiff: null,
        });
      }
    }
    return result;
  });

  /** 战力点概率分布表数据 */
  const distributionTableData = computed(() => {
    const result = euAdvice.value;
    if (!result) return [];
    const { distribution: dist, abandonProb } = result;
    const currentS = rewardIndex.value;
    const rows = dist.map((p, i) => ({
      value: i,
      prob: p,
      isCurrent: i === currentS,
      isAbandon: false,
    }));
    rows.push({
      value: -1,
      prob: abandonProb,
      isCurrent: false,
      isAbandon: true,
    });
    return rows;
  });

  /** 决策动作优先采用期望效用模型建议，无模型时回退原始 */
  const decisionAction = computed(
    () => euAdvice.value?.optimalAction ?? currentAdvice.value?.optimalAction ?? 'stop',
  );

  /** 仅期望效用模型激活时在决策文字前显示标注 */
  const decisionPrefix = computed(() =>
    showEuColumn.value ? '期望效用模型应用后最优：' : '最优：',
  );

  /** 从 allStrategies 中找出奖励期望最大的策略 */
  const rewardMaximizingStrategy = computed<StrategyEvalResult | null>(() => {
    const result = simplifiedStrategyResult.value;
    if (!result || result.allStrategies.length === 0) return null;
    let best = result.allStrategies[0]!;
    for (const s of result.allStrategies) {
      if (s.reward > best.reward) best = s;
    }
    return best;
  });

  /** 阈值表数据 */
  const thresholdRowData = computed(() => {
    const s = simplifiedStrategyResult.value?.optimalStrategy;
    const r = rewardMaximizingStrategy.value;
    if (!s || s.length < 4) return [];
    const rows: { label: string; a3: number; a2: number; a1: number; a0: number }[] = [
      { label: '期望效用结算阈值', a3: s[3], a2: s[2], a1: s[1], a0: s[0] },
    ];
    if (r && r.strategy.length >= 4) {
      rows.push({
        label: '最大奖励结算阈值',
        a3: r.strategy[3],
        a2: r.strategy[2],
        a1: r.strategy[1],
        a0: r.strategy[0],
      });
    }
    return rows;
  });

  /** 全部组合表格数据 */
  const allStrategiesTableData = computed(() => {
    const result = simplifiedStrategyResult.value;
    if (!result || result.allStrategies.length === 0) return [];
    const { allStrategies, dpReward, dpEu, optimalStrategy } = result;

    return allStrategies
      .map((s) => ({
        a3: s.strategy[3],
        a2: s.strategy[2],
        a1: s.strategy[1],
        a0: s.strategy[0],
        reward: s.reward,
        eu: s.eu,
        rewardRate: dpReward > 0 ? s.reward / dpReward : 0,
        euRate: dpEu > 0 ? s.eu / dpEu : 0,
        rewardRateDisplay: dpReward > 0 ? `${((s.reward / dpReward) * 100).toFixed(2)}%` : '—',
        euRateDisplay: dpEu > 0 ? `${((s.eu / dpEu) * 100).toFixed(2)}%` : '—',
        isOptimal:
          s.strategy[0] === optimalStrategy[0] &&
          s.strategy[1] === optimalStrategy[1] &&
          s.strategy[2] === optimalStrategy[2] &&
          s.strategy[3] === optimalStrategy[3],
      }))
      .sort((a, b) => b.eu - a.eu);
  });

  /** 简化策略计算 */
  function computeSimplifiedStrategy() {
    const deck = debouncedDeckConfig.value;
    const rewards = rewardValues.value;
    if (deck.some((c) => c < 0) || rewards.length === 0) {
      simplifiedStrategyResult.value = null;
      solverLoading.value = false;
      return;
    }
    simplifiedStrategyResult.value = evaluateAllSimplifiedStrategies(deck, rewards, euParams.value);
    solverLoading.value = false;
  }

  watch(
    debouncedDeckConfig,
    () => {
      solverLoading.value = true;
      computeSimplifiedStrategy();
    },
    { immediate: true },
  );

  let simplifiedStrategyTimer: ReturnType<typeof setTimeout> | undefined;
  watch([rewardValues, euParams], () => {
    if (simplifiedStrategyTimer) clearTimeout(simplifiedStrategyTimer);
    solverLoading.value = true;
    simplifiedStrategyTimer = setTimeout(computeSimplifiedStrategy, 300);
  });

  return {
    // 状态（从共享状态中只读引用）
    hasWarning,
    solverLoading,
    simplifiedStrategyResult,

    // 计算属性
    currentAdvice,
    euAdvice,
    perLevelAdvice,
    distributionTableData,
    decisionAction,
    decisionPrefix,
    showEuColumn,
    rewardMaximizingStrategy,
    thresholdRowData,
    allStrategiesTableData,
  };
}
