import { reactive, ref, computed, watch } from 'vue';

import { evaluateAllSimplifiedStrategies } from '../EndfieldTrialSwordmancySimplified';
import type {
  SimplifiedStrategyResult,
  StrategyEvalResult,
} from '../EndfieldTrialSwordmancySimplified';
import {
  getCurrentAdvice,
  clearSolverCache,
  DEFAULT_REWARDS,
  DEFAULT_DECK_CONFIG,
  DEFAULT_DECK_CONFIG_DATE,
  MAX_DRAWS,
} from '../EndfieldTrialSwordmancySolver';
import type { AdviceResult, ExpectedUtilityParams } from '../EndfieldTrialSwordmancySolver';

// ── Types ──

export interface PlaqueConfig {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
}

export interface Plaque {
  id: number;
  level: number;
  power: number;
}

// ── Module-level state (singleton ── all consumers share same instance) ──

/** 当前生效的奖励表 */
const rewardValues = ref<number[]>([...DEFAULT_REWARDS]);
/** 各铭牌点数数量配置 */
const config = reactive<PlaqueConfig>({
  level1: DEFAULT_DECK_CONFIG[0]!,
  level2: DEFAULT_DECK_CONFIG[1]!,
  level3: DEFAULT_DECK_CONFIG[2]!,
  level4: DEFAULT_DECK_CONFIG[3]!,
  level5: DEFAULT_DECK_CONFIG[4]!,
});

const debouncedDeckConfig = ref<number[]>([...DEFAULT_DECK_CONFIG]);

let nextId = 0;

/** 铭牌库（剩余未抽的铭牌） */
const pool = ref<Plaque[]>([]);
/** 已抽的 5 个槽位 */
const drawnCards = ref<(Plaque | null)[]>([null, null, null, null, null]);
/** 是否已开启奖励翻倍 */
const doubled = ref(false);
/** 今日剩余结算次数 */
const remainingGames = ref(3);
/** 今日剩余翻倍次数 */
const remainingDoubles = ref(2);
/** 今日剩余放弃次数 */
const remainingAbandons = ref(3);
/** 手动设置时铭牌库不足的警告标记 */
const slotWarnings = reactive<boolean[]>([false, false, false, false, false]);

/** 期望效用模型参数 */
const aversionFactor = ref(1.0);
const fixedPenalty = ref(0);

/** 简化策略穷举对比结果 */
const simplifiedStrategyResult = ref<SimplifiedStrategyResult | null>(null);
const solverLoading = ref(false);

// ── Helper functions (internal) ──

function createPlaque(level: number): Plaque {
  return { id: nextId++, level, power: level };
}

/** 根据当前配置构建初始铭牌库 */
function buildPool(): Plaque[] {
  const result: Plaque[] = [];
  const entries: [number, number][] = [
    [1, config.level1],
    [2, config.level2],
    [3, config.level3],
    [4, config.level4],
    [5, config.level5],
  ];
  for (const [level, count] of entries) {
    for (let i = 0; i < count; i++) {
      result.push(createPlaque(level));
    }
  }
  return result;
}

/** 清空已抽槽位 */
function initDrawnCards() {
  drawnCards.value = [null, null, null, null, null];
  for (let i = 0; i < 5; i++) slotWarnings[i] = false;
}

/** 应用铭牌库配置并重置游戏状态 */
function applyConfig() {
  for (const key of ['level1', 'level2', 'level3', 'level4', 'level5'] as const) {
    if (config[key] > 99) config[key] = 99;
    if (config[key] < 0) config[key] = 0;
  }
  clearSolverCache();
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
  ElMessage.success('已应用铭牌库配置');
}

// ── Computed ──

const drawnCounts = computed(() => {
  const counts = [0, 0, 0, 0, 0];
  for (const card of drawnCards.value) {
    if (card) counts[card.level - 1]!++;
  }
  return counts;
});

const poolByLevel = computed(() => {
  const groups: Record<number, Plaque[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const plaque of pool.value) {
    groups[plaque.level]!.push(plaque);
  }
  return groups;
});

/** 默认配置是否已过期超过 72 小时（UTC 比较） */
const configDateExpired = computed(() => {
  const parts = DEFAULT_DECK_CONFIG_DATE.split(' ');
  const dateStr = parts[0] ?? '2000-01-01';
  const timeStr = parts[1] ?? '00:00';
  const dateParts = dateStr.split('-');
  const timeParts = timeStr.split(':');
  const year = Number(dateParts[0]) || 2000;
  const month = Number(dateParts[1]) || 1;
  const day = Number(dateParts[2]) || 1;
  const hour = Number(timeParts[0]) || 0;
  const minute = Number(timeParts[1]) || 0;
  const configDate = Date.UTC(year, month - 1, day, hour, minute);
  const diffHours = (Date.now() - configDate) / (1000 * 60 * 60);
  return diffHours > 72;
});

const euParams = computed<ExpectedUtilityParams | undefined>(() => {
  if (aversionFactor.value === 1.0 && fixedPenalty.value === 0) return undefined;
  return { aversionFactor: aversionFactor.value, fixedPenalty: fixedPenalty.value };
});

const showEuColumn = computed(() => euParams.value !== undefined);

const activeDrawCount = computed(() => drawnCards.value.filter(Boolean).length);

const totalPower = computed(() => drawnCards.value.reduce((sum, c) => sum + (c?.power ?? 0), 0));

/** 实际战力点 → 奖励索引（0-10 直接映射；超过 10 则模 11 循环） */
const rewardIndex = computed(() => {
  if (totalPower.value > 10) {
    return totalPower.value % 11;
  }
  return totalPower.value;
});

/** 翻倍前的基础奖励 */
const baseReward = computed(() => rewardValues.value[rewardIndex.value] ?? 0);

/** 最终奖励（含翻倍） */
const finalReward = computed(() => {
  return doubled.value ? baseReward.value * 2 : baseReward.value;
});

const canDraw = computed(() => {
  return activeDrawCount.value < MAX_DRAWS && pool.value.length > 0;
});

/** 可翻倍条件：本局未翻倍、今日有剩余次数 */
const canDouble = computed(() => {
  return !doubled.value && remainingDoubles.value > 0;
});

/** 开关可用条件：已翻倍 或 今日有剩余次数 */
const canToggleDouble = computed(() => {
  return doubled.value || remainingDoubles.value > 0;
});

/** 可放弃条件：已抽至少一张牌、有剩余结算次数 */
const canAbandon = computed(() => {
  return activeDrawCount.value > 0 && remainingGames.value > 0;
});

const hasWarning = computed(() => slotWarnings.some(Boolean));

/** 各级铭牌的透支数量（手动输入超过铭牌库限制的部分） */
const overdraftByLevel = computed(() => {
  const counts = [0, 0, 0, 0, 0];
  for (const card of drawnCards.value) {
    if (card && card.id < 0) counts[card.level - 1]!++;
  }
  return counts;
});

/** 将配置对象转为数组形式供求解器使用 */
const deckConfigArray = computed(() => debouncedDeckConfig.value);

/** 当前状态的最优行动建议（不含期望效用模型） */
const currentAdvice = computed<AdviceResult | null>(() => {
  const deck = deckConfigArray.value;
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
  const deck = deckConfigArray.value;
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
  const deck = deckConfigArray.value;
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
const decisionPrefix = computed(() => (showEuColumn.value ? '期望效用模型应用后最优：' : '最优：'));

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

// ── Watches ──

let applyConfigTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  config,
  () => {
    if (applyConfigTimer) clearTimeout(applyConfigTimer);
    applyConfigTimer = setTimeout(() => {
      applyConfig();
      debouncedDeckConfig.value = [
        config.level1,
        config.level2,
        config.level3,
        config.level4,
        config.level5,
      ];
    }, 1000);
  },
  { deep: true },
);

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

/** 剩余翻倍次数手动归零时，自动关闭翻倍开关 */
watch(remainingDoubles, (val) => {
  if (val <= 0 && doubled.value) {
    doubled.value = false;
  }
});

// ── Public methods ──

/** 重置铭牌分布为默认值 */
function resetPoolConfig() {
  clearSolverCache();
  config.level1 = DEFAULT_DECK_CONFIG[0]!;
  config.level2 = DEFAULT_DECK_CONFIG[1]!;
  config.level3 = DEFAULT_DECK_CONFIG[2]!;
  config.level4 = DEFAULT_DECK_CONFIG[3]!;
  config.level5 = DEFAULT_DECK_CONFIG[4]!;
}

/** 重置铭牌库分布为初始默认值并立即应用 */
function handleResetPoolConfig() {
  config.level1 = DEFAULT_DECK_CONFIG[0]! + 1;
  resetPoolConfig();
}

function toggleQuickMode() {
  // handled in ConfigPanel (UI-only)
}

function onlyConfigDigit(value: string): boolean {
  return value === '' || (value >= '0' && value <= '9');
}

/** 解析 textarea 中的 JSON 并应用奖励表 */
function applyRewardTable(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return '必须是一个 JSON 数组';
    }
    if (parsed.length !== 11) {
      return `数组长度必须为 11，当前为 ${parsed.length}`;
    }
    for (let i = 0; i < parsed.length; i++) {
      if (typeof parsed[i] !== 'number' || isNaN(parsed[i])) {
        return `索引 ${i} 的值不是有效数字`;
      }
    }
    rewardValues.value = [...parsed];
    clearSolverCache();
    ElMessage.success('已应用奖励表');
    return null;
  } catch (e) {
    return `JSON 格式错误：${(e as Error).message}`;
  }
}

/** 重置奖励表为默认值并生效 */
function resetRewardTable() {
  rewardValues.value = [...DEFAULT_REWARDS];
  clearSolverCache();
  ElMessage.success('已应用奖励表');
}

function setEuParams(af: number, fp: number) {
  aversionFactor.value = af;
  fixedPenalty.value = fp;
}

function isEuPresetActive(af: number, fp: number): boolean {
  return aversionFactor.value === af && fixedPenalty.value === fp;
}

/** 随机抽取一张铭牌 */
function drawCard() {
  if (!canDraw.value) return;
  const emptyIndex = drawnCards.value.findIndex((c) => c == null);
  if (emptyIndex === -1) return;
  const index = Math.floor(Math.random() * pool.value.length);
  const plaque = pool.value.splice(index, 1)[0]!;
  drawnCards.value[emptyIndex] = plaque;
  ElMessage.info(`抽到点数 ${plaque.level}，当前战力点 ${rewardIndex.value}`);
}

/** 点击铭牌库等级行时模拟抽取对应点数的铭牌 */
function simulateDrawFromPool(level: number) {
  const emptyIndex = drawnCards.value.findIndex((c) => c == null);
  if (emptyIndex === -1) return;
  const plaque = takeFromPool(level);
  if (!plaque) return;
  drawnCards.value[emptyIndex] = plaque;
  ElMessage.info(`抽到点数 ${level}，当前战力点 ${rewardIndex.value}`);
}

/** 从铭牌库中取出一张指定铭牌点数的牌（返回 null 表示铭牌库不足） */
function takeFromPool(level: number): Plaque | null {
  const idx = pool.value.findIndex((p) => p.level === level);
  if (idx === -1) return null;
  return pool.value.splice(idx, 1)[0]!;
}

/** 撤销上一次抽牌 */
function undoLastDraw() {
  let lastIndex = -1;
  for (let i = drawnCards.value.length - 1; i >= 0; i--) {
    if (drawnCards.value[i] != null) {
      lastIndex = i;
      break;
    }
  }
  if (lastIndex === -1) return;
  const card = drawnCards.value[lastIndex];
  drawnCards.value[lastIndex] = null;
  slotWarnings[lastIndex] = false;
  if (card && card.id >= 0) pool.value.push(card);
}

function toggleDouble() {
  if (!canDouble.value) return;
  doubled.value = true;
}

/** 放弃本局 */
function abandonGame() {
  if (!canAbandon.value) return;
  if (remainingAbandons.value > 0) {
    remainingAbandons.value--;
  } else {
    remainingGames.value--;
  }
  resetGame();
  ElMessage.info(
    `已放弃本局，剩余结算次数 ${remainingGames.value}，剩余放弃次数 ${remainingAbandons.value}`,
  );
}

/** 重置本局铭牌库/已抽/翻倍 */
function resetGame() {
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
}

/** 结算本局 */
function endGame() {
  if (remainingGames.value <= 0) return;
  if (doubled.value) remainingDoubles.value--;
  remainingGames.value--;
  resetGame();
  ElMessage.info(
    `已结算本局，剩余结算次数 ${remainingGames.value}，剩余翻倍次数 ${remainingDoubles.value}`,
  );
}

/** 重置今日全部状态 */
function resetToday() {
  remainingGames.value = 3;
  remainingDoubles.value = 2;
  remainingAbandons.value = 3;
  resetGame();
  ElMessage.info('已重置');
}

/** 设置为单次模拟（P=1, D=0, A=0） */
function setSingleSimulation() {
  remainingGames.value = 1;
  remainingDoubles.value = 0;
  remainingAbandons.value = 0;
}

/** 获取铭牌库中指定等级的剩余张数（含透支） */
function getPoolCount(level: number): number {
  return (poolByLevel.value[level]?.length ?? 0) - (overdraftByLevel.value[level - 1] ?? 0);
}

/** OTP 输入校验：只允许 1-5 和空 */
function onlyLevel(value: string): boolean {
  return value === '' || (value >= '1' && value <= '5');
}

function handleOtpChange(val: string | number) {
  const s = String(val);
  for (const card of drawnCards.value) {
    if (card && card.id >= 0) pool.value.push(card);
  }
  initDrawnCards();
  for (let i = 0; i < MAX_DRAWS; i++) {
    const ch = s[i];
    if (ch && ch >= '1' && ch <= '5') {
      const level = Number(ch);
      const plaque = takeFromPool(level);
      if (plaque) {
        drawnCards.value[i] = plaque;
      } else {
        drawnCards.value[i] = { id: -1, level, power: level };
        slotWarnings[i] = true;
      }
    }
  }
}

// ── Initialization ──

pool.value = buildPool();

// ── Public API ──

export function useSwordmancyGameState() {
  return {
    // Constants
    DEFAULT_REWARDS,
    DEFAULT_DECK_CONFIG,
    DEFAULT_DECK_CONFIG_DATE,
    MAX_DRAWS,

    // State – config
    config,
    debouncedDeckConfig,
    rewardValues,

    // State – EU params
    aversionFactor,
    fixedPenalty,

    // State – daily
    remainingGames,
    remainingDoubles,
    remainingAbandons,

    // State – game
    pool,
    drawnCards,
    doubled,
    slotWarnings,

    // State – solver
    simplifiedStrategyResult,
    solverLoading,

    // Computed
    drawnCounts,
    poolByLevel,
    configDateExpired,
    euParams,
    showEuColumn,
    activeDrawCount,
    totalPower,
    rewardIndex,
    baseReward,
    finalReward,
    canDraw,
    canDouble,
    canToggleDouble,
    canAbandon,
    hasWarning,
    overdraftByLevel,
    deckConfigArray,
    currentAdvice,
    euAdvice,
    perLevelAdvice,
    distributionTableData,
    decisionAction,
    decisionPrefix,
    rewardMaximizingStrategy,
    thresholdRowData,
    allStrategiesTableData,

    // Methods – config
    applyConfig,
    resetPoolConfig,
    handleResetPoolConfig,
    toggleQuickMode,
    onlyConfigDigit,
    applyRewardTable,
    resetRewardTable,

    // Methods – EU params
    setEuParams,
    isEuPresetActive,

    // Methods – game
    drawCard,
    simulateDrawFromPool,
    takeFromPool,
    undoLastDraw,
    toggleDouble,
    abandonGame,
    resetGame,
    endGame,
    resetToday,
    setSingleSimulation,
    getPoolCount,
    onlyLevel,
    handleOtpChange,

    // Methods – solver
    computeSimplifiedStrategy,
    clearSolverCache,
  };
}
