<template>
  <div data-tour="game-state">
    <el-row :gutter="16" class="game-section">
      <el-col :span="18" :xs="24">
        <el-card class="drawn-card">
          <template #header>
            <span>已抽铭牌</span>
          </template>
          <div class="drawn-slots hidden-xs-only">
            <div
              v-for="slotIndex in MAX_DRAWS"
              :key="slotIndex"
              class="drawn-slot"
              :class="{
                filled: drawnCards[slotIndex - 1] != null,
                'drawn-slot-warning': hasWarning && drawnCards[slotIndex - 1] != null,
              }"
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
          <el-divider class="hidden-xs-only" style="margin: 16px 0" />
          <div class="drawn-manual-input" data-tour="manual-input">
            <div class="drawn-manual-left">
              <div class="drawn-manual-label hidden-xs-only">手动设置铭牌点数</div>
              <el-input-otp
                v-model="otpValue"
                :size="isMobile ? 'large' : 'default'"
                :length="5"
                inputmode="numeric"
                :validator="onlyLevel"
                @update:model-value="handleOtpChange"
              />
            </div>
            <el-button class="drawn-undo-btn" :size="compSize" @click="undoLastDraw">
              撤销
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6" :xs="24">
        <el-card class="pool-card" data-tour="pool">
          <template #header>
            <span>铭牌库剩余 {{ pool.length }} 张</span>
          </template>
          <div class="pool-list">
            <span v-for="level in 5" :key="level">
              <el-button
                :size="compSize"
                type="info"
                plain
                style="width: 100%"
                class="pool-btn"
                :disabled="getPoolCount(level) === 0"
                @click="simulateDrawFromPool(level)"
              >
                <span class="pool-level-label">Lv.{{ level }}</span>
                <span class="pool-level-count">{{ getPoolCount(level) }} 张</span>
              </el-button>
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="game-section">
      <el-col :span="24">
        <el-card class="reward-card">
          <template #header>
            <span>奖励状态</span>
          </template>
          <div
            class="reward-point-section"
            :class="{
              'reward-penalty': totalPower > 10,
              'reward-success': !(totalPower > 10) && rewardIndex === 10,
            }"
          >
            <span class="reward-label">战力点</span>
            <el-segmented
              v-model="rewardIndex"
              :size="compSize"
              :options="powerPointOptions"
              block
              :class="{
                'reward-penalty': totalPower > 10,
                'reward-success': !(totalPower > 10) && rewardIndex === 10,
              }"
            />
            <span class="reward-xs-value hidden-sm-and-up">{{ rewardIndex }}</span>
          </div>
          <div
            class="reward-tier-section"
            :class="{
              'reward-penalty': totalPower > 10,
              'reward-success': !(totalPower > 10) && rewardIndex === 10,
            }"
          >
            <span class="reward-label">奖励</span>
            <el-segmented
              v-model="rewardIndex"
              :size="compSize"
              :options="rewardOptions"
              block
              :class="{
                'reward-penalty': totalPower > 10,
                'reward-success': !(totalPower > 10) && rewardIndex === 10,
              }"
            />
            <span class="reward-xs-value hidden-sm-and-up">{{
              formatRewardShort(finalReward)
            }}</span>
          </div>
          <div
            class="reward-eu-section"
            :class="{
              'reward-eu-disabled': !showEuColumn,
              'reward-penalty': totalPower > 10,
            }"
          >
            <span class="reward-label">溢出期望</span>
            <el-segmented
              v-model="euSelectedValue"
              :size="compSize"
              :options="euOptions"
              :disabled="!showEuColumn"
              block
              class="reward-eu-segmented"
            />
            <span class="reward-xs-value hidden-sm-and-up">{{ euDisplayValue }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>

  <el-row :gutter="16" class="game-section" data-tour="actions">
    <el-col :span="24">
      <div class="action-row">
        <div class="action-row-left">
          <el-popconfirm
            title="确认重置游戏状态和今日状态？"
            placement="bottom-end"
            width="200px"
            @confirm="resetToday"
          >
            <template #reference>
              <el-button :size="compSize" type="danger" class="action-btn"> 重置所有 </el-button>
            </template>
          </el-popconfirm>
          <el-button v-if="isMobile" class="action-btn" :size="compSize" @click="undoLastDraw">
            撤销
          </el-button>
        </div>
        <div class="action-row-right">
          <el-button v-if="!isMobile" class="action-btn" :size="compSize" @click="undoLastDraw">
            撤销
          </el-button>
          <el-button
            class="action-btn"
            :size="compSize"
            :disabled="!canDraw || remainingGames === 0 || hasWarning"
            type="primary"
            @click="drawCard"
          >
            抽取铭牌
          </el-button>
        </div>
      </div>
    </el-col>

    <el-col :span="24" class="hidden-sm-and-up">
      <div class="action-row-center">
        <div class="action-switch-group">
          <span class="action-switch-label"
            ><span class="action-switch-remaining">（剩余{{ remainingDoubles }}次）</span
            ><span class="action-switch-warning">奖励翻倍</span></span
          >
          <el-switch
            v-model="doubled"
            :size="compSize"
            :disabled="!canToggleDouble || hasWarning"
            inactive-text="开"
            active-text="关"
            :active-value="false"
            :inactive-value="true"
            class="action-switch"
            style="
              --el-switch-on-color: var(--el-color-info);
              --el-switch-off-color: var(--el-color-primary);
            "
          />
        </div>
      </div>
    </el-col>

    <el-col :span="24">
      <div class="action-row">
        <div class="action-row-left">
          <el-button
            class="action-btn"
            :size="compSize"
            :disabled="!canAbandon || hasWarning"
            type="danger"
            @click="abandonGame"
          >
            放弃本局 / 剩余{{ remainingAbandons }}次
          </el-button>
        </div>
        <div class="action-row-right">
          <div class="action-switch-group hidden-xs-only">
            <span class="action-switch-label"
              ><span class="action-switch-remaining">（剩余{{ remainingDoubles }}次）</span
              ><span class="action-switch-warning">奖励翻倍</span></span
            >
            <el-switch
              v-model="doubled"
              :size="compSize"
              :disabled="!canToggleDouble || hasWarning"
              inactive-text="开"
              active-text="关"
              :active-value="false"
              :inactive-value="true"
              class="action-switch"
              style="
                --el-switch-on-color: var(--el-color-info);
                --el-switch-off-color: var(--el-color-primary);
              "
            />
          </div>
          <el-button
            class="action-btn"
            :size="compSize"
            :disabled="remainingGames === 0 || activeDrawCount === 0 || hasWarning"
            type="info"
            @click="activeDrawCount > 0 ? endGame() : resetGame()"
          >
            结算本局 / 剩余{{ remainingGames }}次
          </el-button>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useResponsive } from '@/composables/useResponsive';

import { useSwordmancyGameState } from './composables/useSwordmancyGameState';

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
  canToggleDouble,
  canAbandon,
  hasWarning,
  activeDrawCount,
  drawCard,
  simulateDrawFromPool,
  getPoolCount,
  undoLastDraw,
  abandonGame,
  endGame,
  resetGame,
  resetToday,
  onlyLevel,
  handleOtpChange,
} = useSwordmancyGameState();

const { isMobile } = useResponsive();
const compSize = computed(() => (isMobile.value ? 'small' : 'default'));

/** OTP 输入框的字符串值 */
const otpValue = computed(() => drawnCards.value.map((c) => c?.level ?? '').join(''));

const powerPointOptions = Array.from({ length: 11 }, (_, i) => ({
  label: String(i),
  value: i,
}));

const rewardOptions = computed(() =>
  Array.from({ length: 11 }, (_, i) => ({
    label: formatRewardShort(doubled.value ? rewardValues.value[i]! * 2 : rewardValues.value[i]!),
    value: i,
  })),
);

const euOptions = computed(() => {
  const params = showEuColumn.value
    ? { aversionFactor: aversionFactor.value, fixedPenalty: fixedPenalty.value }
    : undefined;
  const mul = doubled.value ? 2 : 1;
  return Array.from({ length: 11 }, (_, i) => {
    const power = 11 + i;
    const s = power % 11;
    const raw = rewardValues.value[s] ?? 0;
    let label: string;
    if (params) {
      const euValue = (raw * Math.pow(params.aversionFactor, 1) - 1 * params.fixedPenalty) * mul;
      label = formatRewardShort(euValue);
    } else {
      label = formatRewardShort(raw * mul);
    }
    return { label, value: power };
  });
});

const euSelectedValue = computed(() => {
  if (totalPower.value >= 11 && totalPower.value <= 21) return totalPower.value;
  return undefined;
});

const euDisplayValue = computed(() => {
  if (totalPower.value >= 11 && totalPower.value <= 21) {
    const s = totalPower.value % 11;
    const raw = rewardValues.value[s] ?? 0;
    const mul = doubled.value ? 2 : 1;
    let euValue: number;
    if (showEuColumn.value) {
      euValue = (raw * Math.pow(aversionFactor.value, 1) - 1 * fixedPenalty.value) * mul;
    } else {
      euValue = raw * mul;
    }
    return formatRewardShort(euValue);
  }
  return '—';
});

/** 格式化奖励数字（显示为简短格式） */
function formatRewardShort(value: number): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1000000) {
    formatted = `${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (abs >= 100000) {
    formatted = `${Math.round(abs / 1000)}K`;
  } else if (abs >= 10000 && value < 0) {
    formatted = `${Math.round(abs / 1000)}K`;
  } else if (abs >= 1000) {
    formatted = `${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  } else {
    formatted = String(abs);
  }
  return value < 0 ? `-${formatted}` : formatted;
}
</script>

<style lang="scss" scoped>
@use './styles/EndfieldTrialOfSwordmancyCard' as *;

@include card-padding('.drawn-card', '.pool-card', '.reward-card');
@include game-section-base;

// ── Drawn cards ──
.drawn-card {
  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

.drawn-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.drawn-slot {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 100px;
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  transition: all 0.3s;

  &.filled {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.drawn-slot-warning {
  border-color: var(--el-color-danger) !important;
  background: var(--el-color-danger-light-9) !important;

  .drawn-slot-num {
    color: var(--el-color-danger) !important;
  }
}

.drawn-slot-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.drawn-slot-lv {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.drawn-slot-num,
.drawn-slot-q {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
}

.drawn-slot-num {
  color: var(--el-color-primary);
}

.drawn-slot-q {
  color: var(--el-text-color-placeholder);
}

.drawn-manual-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawn-manual-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.drawn-manual-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.drawn-undo-btn {
  flex-shrink: 0;
}

// ── Pool ──
.pool-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-btn :deep(> span) {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: center;
}

.pool-level-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pool-level-count {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

// ── Reward ──
.reward-label {
  font-size: 14px;
  font-weight: bold;
}

.reward-point-section,
.reward-tier-section,
.reward-eu-section {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;

  .reward-label {
    width: 64px;
    white-space: nowrap;
  }

  .el-segmented {
    --el-border-radius-base: 0px;

    flex-grow: 1;
  }
}

.reward-eu-section {
  margin-bottom: 0;

  .reward-eu-segmented {
    --el-segmented-item-selected-bg-color: var(--el-color-danger);
    --el-segmented-item-selected-disabled-bg-color: var(--el-color-danger);
  }

  &.reward-penalty {
    .reward-eu-segmented {
      --el-segmented-bg-color: var(--el-color-danger-light-7);
    }
  }

  &.reward-eu-disabled {
    opacity: 0.4;

    .reward-label {
      color: var(--el-text-color-placeholder);
    }
  }
}

.reward-penalty {
  &.el-segmented {
    --el-segmented-item-selected-bg-color: var(--el-color-danger);
    --el-segmented-bg-color: var(--el-color-danger-light-7);
  }
}

.reward-success {
  &.el-segmented {
    --el-segmented-item-selected-bg-color: var(--el-color-success);
    --el-segmented-bg-color: var(--el-color-success-light-7);

    color: var(--el-text-color-primary);
  }
}

// ── Actions ──
.action-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.action-row-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.action-row-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.action-btn {
  min-width: 168px;
}

.action-switch-label {
  font-size: 14px;
  white-space: nowrap;
}

.action-switch-remaining {
  color: var(--el-text-color-secondary);
}

.action-switch-warning {
  color: var(--el-color-warning);
}

.action-switch {
  justify-content: center;
  min-width: 100px;
  margin-right: 8px;
}

.action-switch-group {
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.action-row-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@include game-section-responsive;

// ── Responsive ──
@media (max-width: 767px) {
  .action-row {
    .action-row-left,
    .action-row-right {
      flex: 1;
    }
  }

  .action-switch-label {
    white-space: nowrap;
  }

  .action-row-left {
    justify-content: stretch;
  }

  .action-btn {
    width: 100%;
    min-width: unset;
  }

  .pool-list {
    flex-direction: row;
  }

  .pool-list > span {
    flex: 1;
  }

  .pool-btn {
    height: 48px;
  }

  .pool-btn :deep(> span) {
    flex-direction: column;
    gap: 4px;
    justify-content: center;
  }

  .pool-level-count {
    font-size: 14px;
  }

  .reward-point-section,
  .reward-tier-section,
  .reward-eu-section {
    flex: 1;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    margin-bottom: 0;
    padding: 8px 4px;
    border-radius: 4px;
    background: var(--el-fill-color);

    &.reward-penalty {
      background: var(--el-color-danger-light-7);
    }

    &.reward-success {
      background: var(--el-color-success-light-7);
    }

    .el-segmented {
      display: none;
    }

    .reward-label {
      width: auto;
      margin-bottom: 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .reward-xs-value {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .reward-eu-section.reward-eu-disabled {
    opacity: 0.5;
  }

  .reward-card :deep(.el-card__body) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
