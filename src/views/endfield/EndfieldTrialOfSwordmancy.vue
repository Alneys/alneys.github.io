<template>
  <div id="view-endfield-trial-of-swordmancy">
    <h1 class="view-title">Endfield Trial Of Swordmancy</h1>
    <div class="al-divider"></div>

    <el-collapse
      v-model="activeCollapse"
      class="config-panel"
      style="--el-collapse-header-font-size: 16px"
    >
      <el-collapse-item title="铭牌分布配置" name="config">
        <div class="config-grid">
          <div v-for="level in 5" :key="level" class="config-item">
            <span class="config-label">等级 {{ level }}</span>
            <el-input-number
              v-model="config[`level${level}` as keyof PlaqueConfig]"
              :min="0"
              :max="99"
            />
          </div>
        </div>
        <div class="config-buttons">
          <el-button type="primary" class="config-apply-btn" @click="applyConfig">
            应用配置（重置牌池）
          </el-button>
          <el-button class="config-reset-btn" @click="resetConfig"> 重置铭牌分布 </el-button>
        </div>
      </el-collapse-item>
    </el-collapse>

    <el-row :gutter="16" class="game-top">
      <el-col :span="18"
        ><el-card class="drawn-card">
          <template #header>
            <span>已抽铭牌</span>
          </template>
          <div class="drawn-slots">
            <div
              v-for="slotIndex in MAX_DRAWS"
              :key="slotIndex"
              class="drawn-slot"
              :class="{ filled: drawnCards[slotIndex - 1] != null }"
            >
              <div v-if="drawnCards[slotIndex - 1]" class="drawn-slot-inner">
                <span class="drawn-slot-lv">Lv</span>
                <span class="drawn-slot-num">{{ drawnCards[slotIndex - 1]?.level }}</span>
              </div>
              <div v-else class="drawn-slot-inner">
                <span class="drawn-slot-lv">Lv</span>
                <span class="drawn-slot-q">?</span>
              </div>
            </div>
          </div>
          <el-divider style="margin: 16px 0"></el-divider>
          <div class="drawn-manual-input">
            <div class="manual-input-label">手动设置等级</div>
            <el-input-otp
              :model-value="otpValue"
              :length="5"
              inputmode="numeric"
              :validator="onlyLevel"
              @update:model-value="handleOtpChange"
            />
            <span v-if="hasWarning" class="manual-input-warning">牌池不足</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6"
        ><el-card class="pool-card">
          <template #header>
            <span>牌池 · 剩余 {{ pool.length }} 张</span>
          </template>
          <div class="pool-list">
            <div v-for="level in 5" :key="level" class="pool-level-row">
              <span class="pool-level-label">Lv.{{ level }}</span>
              <span class="pool-level-count">{{ poolByLevel[level]?.length ?? 0 }} 张</span>
            </div>
          </div>
          <el-empty v-if="pool.length === 0" description="牌池已空" :image-size="48" /> </el-card
      ></el-col>
    </el-row>

    <div class="game-bottom">
      <el-card class="reward-card">
        <template #header>
          <span>奖励状态</span>
        </template>
        <div class="power-point-section">
          <span class="reward-label">战力点</span>
          <el-segmented
            :model-value="rewardIndex"
            :options="powerPointOptions"
            block
            :class="{
              'reward-penalty': totalPower > 10,
              'reward-success': rewardIndex === 10,
            }"
          />
        </div>
        <div class="reward-tier-section">
          <span class="reward-label">奖励档位</span>
          <el-segmented
            :model-value="rewardIndex"
            :options="rewardOptions"
            block
            :class="{
              'reward-penalty': totalPower > 10,
              'reward-success': rewardIndex === 10,
            }"
          />
        </div>
        <div class="reward-info">
          <div class="reward-values">
            <span class="base-reward" :class="{ 'reward-success': rewardIndex === 10 }"
              >奖励：{{ baseReward.toLocaleString() }}</span
            >
            <template v-if="doubled">
              <span class="reward-multiply">×2</span>
              <span class="final-reward-final"> = {{ finalReward.toLocaleString() }} </span>
            </template>
          </div>
        </div>
      </el-card>

      <div class="actions">
        <el-button
          type="primary"
          @click="drawCard"
          :disabled="!canDraw"
          size="large"
          class="action-btn"
        >
          {{ activeDrawCount === 0 ? '开始抽牌' : '继续抽牌' }}
        </el-button>
        <el-button
          :type="doubled ? 'warning' : 'default'"
          @click="toggleDouble"
          :disabled="!canDouble"
          size="large"
          class="action-btn"
        >
          {{ doubled ? '已开启翻倍' : '开启翻倍' }}
        </el-button>
        <el-button type="info" @click="reset" size="large" class="action-btn"> 新一局 </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';

const MAX_DRAWS = 5;

const REWARD_TABLE: Record<number, number> = {
  0: 0,
  1: 2000,
  2: 4000,
  3: 8000,
  4: 15000,
  5: 24000,
  6: 40000,
  7: 72000,
  8: 120000,
  9: 200000,
  10: 320000,
};

interface PlaqueConfig {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
}

interface Plaque {
  id: number;
  level: number;
  power: number;
}

const config = reactive<PlaqueConfig>({
  level1: 5,
  level2: 5,
  level3: 5,
  level4: 8,
  level5: 6,
});

const DEFAULT_CONFIG: PlaqueConfig = {
  level1: 5,
  level2: 5,
  level3: 5,
  level4: 8,
  level5: 6,
};

const activeCollapse = ref<string[]>([]);

const pool = ref<Plaque[]>([]);
const drawnCards = ref<(Plaque | null)[]>([null, null, null, null, null]);
const doubled = ref(false);
const slotWarnings = reactive<boolean[]>([false, false, false, false, false]);

let nextId = 0;

function createPlaque(level: number): Plaque {
  return { id: nextId++, level, power: level };
}

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

function initDrawnCards() {
  drawnCards.value = [null, null, null, null, null];
  for (let i = 0; i < 5; i++) slotWarnings[i] = false;
}

function resetDrawn() {
  for (const card of drawnCards.value) {
    if (card) pool.value.push(card);
  }
  initDrawnCards();
}

function applyConfig() {
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
}

function reset() {
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
}

function resetConfig() {
  config.level1 = DEFAULT_CONFIG.level1;
  config.level2 = DEFAULT_CONFIG.level2;
  config.level3 = DEFAULT_CONFIG.level3;
  config.level4 = DEFAULT_CONFIG.level4;
  config.level5 = DEFAULT_CONFIG.level5;
}

pool.value = buildPool();

const poolByLevel = computed(() => {
  const groups: Record<number, Plaque[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const plaque of pool.value) {
    groups[plaque.level]!.push(plaque);
  }
  return groups;
});

const activeDrawCount = computed(() => drawnCards.value.filter(Boolean).length);

const totalPower = computed(() => drawnCards.value.reduce((sum, c) => sum + (c?.power ?? 0), 0));

const rewardIndex = computed(() => {
  if (totalPower.value > 10) {
    return totalPower.value % 11;
  }
  return totalPower.value;
});

const baseReward = computed(() => REWARD_TABLE[rewardIndex.value] ?? 0);

const finalReward = computed(() => {
  return doubled.value ? baseReward.value * 2 : baseReward.value;
});

const canDraw = computed(() => {
  return activeDrawCount.value < MAX_DRAWS && pool.value.length > 0;
});

const canDouble = computed(() => {
  return activeDrawCount.value < 3 && !doubled.value;
});

function drawCard() {
  if (!canDraw.value) return;
  const emptyIndex = drawnCards.value.findIndex((c) => c == null);
  if (emptyIndex === -1) return;
  const index = Math.floor(Math.random() * pool.value.length);
  const plaque = pool.value.splice(index, 1)[0]!;
  drawnCards.value[emptyIndex] = plaque;
}

function takeFromPool(level: number): Plaque | null {
  const idx = pool.value.findIndex((p) => p.level === level);
  if (idx === -1) return null;
  return pool.value.splice(idx, 1)[0]!;
}

function updateSlotLevel(slotIndex: number, level: number) {
  if (slotIndex < 0 || slotIndex >= MAX_DRAWS) return;

  const old = drawnCards.value[slotIndex];
  if (old) pool.value.push(old);
  drawnCards.value[slotIndex] = null;
  slotWarnings[slotIndex] = false;

  const plaque = takeFromPool(level);
  if (plaque) {
    drawnCards.value[slotIndex] = plaque;
  } else {
    drawnCards.value[slotIndex] = createPlaque(level);
    slotWarnings[slotIndex] = true;
  }
}

function clearSlot(slotIndex: number) {
  if (slotIndex < 0 || slotIndex >= MAX_DRAWS) return;
  const old = drawnCards.value[slotIndex];
  if (old) pool.value.push(old);
  drawnCards.value[slotIndex] = null;
  slotWarnings[slotIndex] = false;
}

function onlyLevel(value: string): boolean {
  return value === '' || (value >= '1' && value <= '5');
}

function toggleDouble() {
  if (!canDouble.value) return;
  doubled.value = true;
}

function formatRewardShort(value: number): string {
  if (value === 0) return '0';
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

const rewardOptions = computed(() =>
  Array.from({ length: 11 }, (_, i) => ({
    label: formatRewardShort(REWARD_TABLE[i]!),
    value: i,
  })),
);

const powerPointOptions = Array.from({ length: 11 }, (_, i) => ({
  label: String(i),
  value: i,
}));

const otpValue = computed(() => drawnCards.value.map((c) => c?.level ?? '').join(''));

const hasWarning = computed(() => slotWarnings.some(Boolean));

function handleOtpChange(val: string | number) {
  const s = String(val);
  for (const card of drawnCards.value) {
    if (card) pool.value.push(card);
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
        drawnCards.value[i] = createPlaque(level);
        slotWarnings[i] = true;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
#view-endfield-trial-of-swordmancy {
  .config-panel {
    margin-bottom: 16px;
  }

  .config-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 4px;
  }

  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .config-label {
    font-size: 14px;
    white-space: nowrap;
  }

  .config-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .game-top {
    margin-bottom: 16px;

    :deep(.el-col) {
      display: flex;
    }

    .drawn-card,
    .pool-card {
      flex: 1;
      width: 100%;
    }
  }

  .game-bottom {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .drawn-card,
  .pool-card,
  .reward-card {
    :deep(.el-card__header) {
      font-weight: 600;
      padding: 10px 16px;
    }
    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .drawn-card {
    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
    }
  }

  .drawn-slots {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .drawn-slot {
    width: 72px;
    height: 100px;
    border-radius: 10px;
    border: 2px solid var(--el-border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color-light);
    transition: all 0.3s;
    user-select: none;

    &.filled {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  .drawn-slot-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .drawn-slot-lv {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .drawn-slot-num {
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    color: var(--el-color-primary);
  }

  .drawn-slot-q {
    font-size: 24px;
    color: var(--el-text-color-placeholder);
  }

  .drawn-manual-input {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .manual-input-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-right: 8px;
  }

  .manual-input-warning {
    color: var(--el-color-danger);
  }

  .pool-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pool-level-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    background: var(--el-fill-color);
  }

  .pool-level-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    min-width: 32px;
  }

  .pool-level-count {
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .reward-label {
    font-size: 14px;
    font-weight: 600;
  }

  .power-point-section,
  .reward-tier-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .reward-label {
      margin-bottom: 0;
      width: 64px;
      white-space: nowrap;
    }

    .el-segmented {
      flex-grow: 1;
      --el-border-radius-base: 0px;
    }
  }

  .reward-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .reward-penalty {
    &.el-segmented {
      --el-segmented-item-selected-bg-color: var(--el-color-danger);
    }
  }

  .reward-success {
    &.el-segmented {
      --el-segmented-item-selected-bg-color: var(--el-color-success);
      color: var(--el-text-color-primary);
    }
    color: var(--el-color-success);
  }

  .reward-values {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .base-reward {
    font-size: 14px;
    font-weight: 600;
  }

  .reward-multiply {
    font-size: 14px;
    color: var(--el-color-warning);
    font-weight: 600;
  }

  .final-reward-final {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-color-warning);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .action-btn {
    flex: 1;
    min-width: 120px;
  }
}
</style>
