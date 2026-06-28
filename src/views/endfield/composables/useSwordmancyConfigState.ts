import { useSwordmancySharedState } from './useSwordmancySharedState';
import type { PlaqueConfig } from './useSwordmancySharedState';

export function useSwordmancyConfigState() {
  const shared = useSwordmancySharedState();

  const {
    config,
    configDateExpired,
    aversionFactor,
    fixedPenalty,
    remainingGames,
    remainingDoubles,
    remainingAbandons,
    rewardValues,
    clearSolverCache,
    resetGame,
    DEFAULT_DECK_CONFIG,
    DEFAULT_REWARDS,
  } = shared;

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

  /** OTP 快速输入校验：只允许 0-9 和空 */
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

  /** 设置期望效用模型参数 */
  function setEuParams(af: number, fp: number) {
    aversionFactor.value = af;
    fixedPenalty.value = fp;
  }

  /** 检查当前期望效用参数是否匹配指定预设 */
  function isEuPresetActive(af: number, fp: number): boolean {
    return aversionFactor.value === af && fixedPenalty.value === fp;
  }

  /** 设置为单次模拟（P=1, D=0, A=0） */
  function setSingleSimulation() {
    remainingGames.value = 1;
    remainingDoubles.value = 0;
    remainingAbandons.value = 0;
  }

  /** 重置今日全部状态 */
  function resetToday() {
    remainingGames.value = 3;
    remainingDoubles.value = 2;
    remainingAbandons.value = 3;
    resetGame();
    ElMessage.info('已重置');
  }

  return {
    // 状态
    config,
    configDateExpired,
    aversionFactor,
    fixedPenalty,
    remainingGames,
    remainingDoubles,
    remainingAbandons,
    rewardValues,

    // 方法
    resetPoolConfig,
    handleResetPoolConfig,
    onlyConfigDigit,
    applyRewardTable,
    resetRewardTable,
    setEuParams,
    isEuPresetActive,
    setSingleSimulation,
    resetToday,
  };
}
