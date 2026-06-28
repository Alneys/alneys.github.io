import { reactive, ref, computed, watch } from 'vue';

import {
  clearSolverCache,
  DEFAULT_REWARDS,
  DEFAULT_DECK_CONFIG,
  DEFAULT_DECK_CONFIG_DATE,
  MAX_DRAWS,
} from '../utils/SwordmancySolver';
import type { ExpectedUtilityParams } from '../utils/SwordmancySolver';

// ── 类型定义 ──

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

// ── 模块级状态（单例 ── 所有调用者共享同一实例） ──

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

/** 防抖后的铭牌库配置数组，供求解器使用 */
const debouncedDeckConfig = ref<number[]>([...DEFAULT_DECK_CONFIG]);

/** 自增 ID 计数器，用于为每张铭牌分配唯一标识 */
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

/** 溢出接受值（期望效用模型参数） */
const aversionFactor = ref(1.0);
/** 固定心理落差（期望效用模型参数） */
const fixedPenalty = ref(0);

/** 简化策略穷举对比结果 */
const simplifiedStrategyResult = ref<
  import('../utils/SwordmancySimplified').SimplifiedStrategyResult | null
>(null);
/** 简化策略求解器加载状态 */
const solverLoading = ref(false);

// ── 辅助函数 ──

/** 创建一张铭牌 */
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

// ── 计算属性 ──

/** 已抽铭牌中各点数的张数统计 */
const drawnCounts = computed(() => {
  const counts = [0, 0, 0, 0, 0];
  for (const card of drawnCards.value) {
    if (card) counts[card.level - 1]!++;
  }
  return counts;
});

/** 铭牌库中按点数分组 */
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

/** 期望效用模型参数（均为默认值时返回 undefined，表示不启用） */
const euParams = computed<ExpectedUtilityParams | undefined>(() => {
  if (aversionFactor.value === 1.0 && fixedPenalty.value === 0) return undefined;
  return { aversionFactor: aversionFactor.value, fixedPenalty: fixedPenalty.value };
});

/** 是否显示期望效用列 */
const showEuColumn = computed(() => euParams.value !== undefined);

/** 已抽铭牌的数量 */
const activeDrawCount = computed(() => drawnCards.value.filter(Boolean).length);

/** 当前总战力点 */
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

/** 是否可抽取铭牌（槽位未满且铭牌库非空） */
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

/** 是否存在透支警告（手动输入时铭牌库不足） */
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

// ── 侦听器 ──

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

/** 剩余翻倍次数手动归零时，自动关闭翻倍开关 */
watch(remainingDoubles, (val) => {
  if (val <= 0 && doubled.value) {
    doubled.value = false;
  }
});

// ── 初始化 ──

pool.value = buildPool();

/** 重置本局铭牌库/已抽/翻倍 */
function resetGame() {
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
}

/** 重置今日全部状态 */
function resetToday() {
  remainingGames.value = 3;
  remainingDoubles.value = 2;
  remainingAbandons.value = 3;
  resetGame();
  ElMessage.info('已重置');
}

// ── 公开 API ──

export function useSwordmancySharedState() {
  return {
    // 常量
    DEFAULT_REWARDS,
    DEFAULT_DECK_CONFIG,
    DEFAULT_DECK_CONFIG_DATE,
    MAX_DRAWS,

    // 状态 - 配置
    config,
    debouncedDeckConfig,
    rewardValues,

    // 状态 - 期望效用参数
    aversionFactor,
    fixedPenalty,

    // 状态 - 今日
    remainingGames,
    remainingDoubles,
    remainingAbandons,

    // 状态 - 游戏
    pool,
    drawnCards,
    doubled,
    slotWarnings,

    // 状态 - 求解器
    simplifiedStrategyResult,
    solverLoading,

    // 计算属性
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

    // 方法 - 共享
    applyConfig,
    clearSolverCache,
    buildPool,
    initDrawnCards,
    resetGame,
    resetToday,
  };
}
