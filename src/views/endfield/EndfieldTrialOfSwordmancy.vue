<template>
  <div id="view-endfield-trial-of-swordmancy">
    <h1 class="view-title">Endfield Trial Of Swordmancy</h1>
    <div class="al-divider"></div>

    <el-collapse v-model="activeCollapse" class="config-panel">
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
      <el-col :span="16"
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
              <div v-else class="drawn-slot-empty">
                <span>?</span>
              </div>
            </div>
          </div>
        </el-card></el-col
      >

      <el-col :span="8"
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
      <el-card class="status-card">
        <template #header>
          <span>当前状态</span>
        </template>
        <div class="status-grid">
          <div class="status-row">
            <span class="status-label">战力总和</span>
            <span class="status-value">{{ totalPower }}</span>
          </div>
          <div class="status-row">
            <span class="status-label">翻倍状态</span>
            <span v-if="doubled" class="status-value status-doubled">已开启</span>
            <span v-else class="status-value status-off">未开启</span>
          </div>
          <div class="status-row">
            <span class="status-label">抽牌进度</span>
            <span class="status-value">{{ drawnCards.length }} / {{ MAX_DRAWS }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="reward-card">
        <template #header>
          <span>奖励挡位</span>
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
              <span class="final-reward-final">= {{ finalReward.toLocaleString() }}</span>
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
          {{ drawnCards.length === 0 ? '开始抽牌' : '继续抽牌' }}
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
const drawnCards = ref<Plaque[]>([]);
const doubled = ref(false);

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

function applyConfig() {
  nextId = 0;
  pool.value = buildPool();
  drawnCards.value = [];
  doubled.value = false;
}

function reset() {
  nextId = 0;
  pool.value = buildPool();
  drawnCards.value = [];
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

const totalPower = computed(() => drawnCards.value.reduce((sum, c) => sum + c.power, 0));

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
  return drawnCards.value.length < MAX_DRAWS && pool.value.length > 0;
});

const canDouble = computed(() => {
  return drawnCards.value.length < 3 && !doubled.value;
});

function drawCard() {
  if (!canDraw.value) return;
  const index = Math.floor(Math.random() * pool.value.length);
  const plaque = pool.value.splice(index, 1)[0]!;
  drawnCards.value.push(plaque);
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
  .status-card,
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

  .drawn-slot-empty {
    font-size: 24px;
    color: var(--el-text-color-placeholder);
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

  .status-grid {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .status-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .status-doubled {
    color: var(--el-color-warning);
  }

  .status-off {
    color: var(--el-text-color-placeholder);
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
    margin-bottom: 16px;

    .reward-label {
      margin-bottom: 0;
      width: 64px;
      white-space: nowrap;
    }

    .el-segmented {
      flex-grow: 1;
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
    font-size: 16px;
    font-weight: 600;
  }

  .reward-multiply {
    font-size: 16px;
    color: var(--el-color-warning);
    font-weight: 600;
  }

  .final-reward-final {
    font-size: 16px;
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
