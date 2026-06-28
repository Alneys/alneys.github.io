import { useSwordmancySharedState } from './useSwordmancySharedState';
import type { Plaque } from './useSwordmancySharedState';

export function useSwordmancyGameState() {
  const shared = useSwordmancySharedState();

  const {
    MAX_DRAWS,
    pool,
    drawnCards,
    doubled,
    remainingGames,
    remainingDoubles,
    remainingAbandons,
    slotWarnings,
    totalPower,
    rewardIndex,
    finalReward,
    rewardValues,
    showEuColumn,
    aversionFactor,
    fixedPenalty,
    canDraw,
    canDouble,
    canToggleDouble,
    canAbandon,
    hasWarning,
    activeDrawCount,
    poolByLevel,
    overdraftByLevel,
    resetGame,
    resetToday,
    initDrawnCards,
  } = shared;

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

  /** 开启翻倍（消耗翻倍次数） */
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

  /** 获取铭牌库中指定等级的剩余张数（含透支） */
  function getPoolCount(level: number): number {
    return (poolByLevel.value[level]?.length ?? 0) - (overdraftByLevel.value[level - 1] ?? 0);
  }

  /** OTP 输入校验：只允许 1-5 和空 */
  function onlyLevel(value: string): boolean {
    return value === '' || (value >= '1' && value <= '5');
  }

  /** 处理 OTP 输入变化：根据输入字符串更新已抽槽位 */
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

  return {
    // 常量
    MAX_DRAWS,

    // 状态 - 游戏
    pool,
    drawnCards,
    doubled,
    remainingGames,
    remainingDoubles,
    remainingAbandons,
    slotWarnings,

    // 状态 - 期望效用参数（用于奖励选项显示）
    rewardValues,
    showEuColumn,
    aversionFactor,
    fixedPenalty,

    // 计算属性
    totalPower,
    rewardIndex,
    finalReward,
    canDraw,
    canToggleDouble,
    canAbandon,
    hasWarning,
    activeDrawCount,

    // 方法 - 游戏
    drawCard,
    simulateDrawFromPool,
    getPoolCount,
    undoLastDraw,
    toggleDouble,
    abandonGame,
    endGame,
    resetGame,
    resetToday,
    onlyLevel,
    handleOtpChange,
  };
}
