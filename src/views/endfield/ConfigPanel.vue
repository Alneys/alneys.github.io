<template>
  <el-collapse
    v-model="activeCollapse"
    class="config-panel"
    style="--el-collapse-header-font-size: 16px"
    data-tour="config"
  >
    <el-collapse-item title="基础参数配置" name="config">
      <div class="config-reward-section">
        <div class="config-reward-header">铭牌库配置</div>
        <div class="config-date-hint">
          <span class="config-hint-hint">默认配置更新于 {{ DEFAULT_DECK_CONFIG_DATE }}</span>
          <el-tag v-if="configDateExpired" type="danger" size="small" style="margin-left: 8px">
            铭牌库数据可能需要手动更新
          </el-tag>
        </div>
        <div v-if="poolQuickConfigMode" class="config-otp-row">
          <span class="config-label">铭牌库分布</span>
          <el-input-otp
            v-model="otpConfigValue"
            :length="5"
            inputmode="numeric"
            :validator="onlyConfigDigit"
          />
        </div>
        <div v-else class="config-grid">
          <div v-for="level in 5" :key="level" class="config-item">
            <span class="config-label">点数 {{ level }}</span>
            <el-input
              v-model.number="config[`level${level}` as keyof PlaqueConfig]"
              :size="compSize"
              type="number"
              :min="0"
              :max="99"
            />
          </div>
        </div>
        <div class="config-buttons">
          <el-button :size="compSize" type="primary" @click="toggleQuickMode">
            {{ '快速输入：' + (poolQuickConfigMode ? '开' : '关') }}
          </el-button>
          <el-button class="config-reset-btn" :size="compSize" @click="resetPoolConfig">
            重置铭牌库
          </el-button>
          <el-button :size="compSize" @click="handleResetPoolConfig"> 重置为初始 </el-button>
        </div>
      </div>

      <el-divider style="margin: 8px 0" />
      <div class="config-reward-section">
        <div class="config-reward-header">奖励对照表</div>
        <div class="config-reward-hint">JSON 数组格式，战力点 0~10 依次对应 11 项奖励值</div>
        <el-input
          v-model="rewardTableText"
          :size="compSize"
          type="textarea"
          :rows="6"
          class="config-reward-textarea"
        />
        <div v-if="rewardTableError" class="config-reward-error">{{ rewardTableError }}</div>
        <div class="config-reward-buttons">
          <el-button :size="compSize" type="primary" @click="applyRewardTable"
            >应用奖励表</el-button
          >
          <el-button :size="compSize" @click="handleResetRewardTable">重置奖励表</el-button>
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>

  <el-row :gutter="16" class="game-section">
    <el-col :span="24">
      <el-card class="expected-utility-card" data-tour="expected-utility">
        <template #header>
          <span>期望效用模型</span>
        </template>
        <div class="expected-utility-body">
          <el-alert type="info" :closable="false" show-icon>
            基于期望效用理论设计，调整公式：奖励 × 溢出接受值<sup>k</sup> − k × 固定心理落差（k =
            总战力 ÷ 11，向下取整），可为负
          </el-alert>
          <div class="expected-utility-grid">
            <div class="expected-utility-item">
              <span class="expected-utility-label">溢出接受值</span>
              <el-slider
                v-model="aversionFactor"
                :size="compSize"
                :min="0"
                :max="1"
                :step="0.05"
                show-input
                class="expected-utility-slider"
              />
            </div>
            <div class="expected-utility-item">
              <span class="expected-utility-label">固定心理落差</span>
              <el-input-number
                v-model="fixedPenalty"
                :size="compSize"
                :min="0"
                :max="1000000"
                :step="5000"
                class="expected-utility-input"
              />
            </div>
          </div>
          <div class="expected-utility-presets">
            <el-button
              :size="compSize"
              :type="isEuPresetActive(1.0, 0) ? 'primary' : ''"
              @click="setEuParams(1.0, 0)"
            >
              最大化收益
            </el-button>
            <el-button
              :size="compSize"
              :type="isEuPresetActive(0.5, 30000) ? 'primary' : ''"
              @click="setEuParams(0.5, 30000)"
            >
              均衡
            </el-button>
            <el-button
              :size="compSize"
              :type="isEuPresetActive(0.01, 0) ? 'primary' : ''"
              @click="setEuParams(0.01, 0)"
            >
              厌恶溢出
            </el-button>
            <el-button
              :size="compSize"
              :type="isEuPresetActive(0.01, 600000) ? 'primary' : ''"
              @click="setEuParams(0.01, 600000)"
            >
              禁止溢出
            </el-button>
          </div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="24">
      <el-card class="daily-card" data-tour="daily">
        <template #header>
          <span>今日状态</span>
        </template>
        <div class="daily-grid">
          <div class="daily-date-hint" style="width: 100%">
            <span class="date-hint-text">默认配置更新于 {{ DEFAULT_DECK_CONFIG_DATE }}</span>
            <el-tag v-if="configDateExpired" type="danger" size="small" style="margin-left: 8px">
              铭牌库数据可能需要手动更新
            </el-tag>
          </div>
          <div v-if="poolQuickConfigMode" class="config-otp-row">
            <span class="daily-label">铭牌库分布</span>
            <el-input-otp
              v-model="otpConfigValue"
              :length="5"
              inputmode="numeric"
              :validator="onlyConfigDigit"
            />
          </div>
          <div v-else class="config-grid">
            <div v-for="level in 5" :key="level" class="config-item">
              <span class="daily-label">点数 {{ level }}</span>
              <el-input
                v-model.number="config[`level${level}` as keyof PlaqueConfig]"
                :size="compSize"
                type="number"
                :min="0"
                :max="99"
              />
            </div>
          </div>
          <div class="config-buttons">
            <el-button :size="compSize" type="primary" @click="toggleQuickMode">
              {{ '快速输入：' + (poolQuickConfigMode ? '开' : '关') }}
            </el-button>
            <el-button :size="compSize" @click="handleResetPoolConfig"> 重置为初始 </el-button>
          </div>
          <el-divider style="margin: 4px 0" />
          <div class="daily-item">
            <span class="daily-label">剩余结算</span>
            <el-input-number
              v-model="remainingGames"
              :size="compSize"
              :min="0"
              :max="3"
              class="daily-input"
              :class="{ 'daily-input-zero': remainingGames === 0 }"
            />
          </div>
          <div class="daily-item">
            <span class="daily-label">剩余翻倍</span>
            <el-input-number
              v-model="remainingDoubles"
              :size="compSize"
              :min="0"
              :max="2"
              class="daily-input"
              :class="{ 'daily-input-zero': remainingDoubles === 0 }"
            />
          </div>
          <div class="daily-item">
            <span class="daily-label">剩余放弃</span>
            <el-input-number
              v-model="remainingAbandons"
              :size="compSize"
              :min="0"
              :max="3"
              class="daily-input"
              :class="{ 'daily-input-zero': remainingAbandons === 0 }"
            />
          </div>
          <el-button class="daily-single-btn" :size="compSize" @click="setSingleSimulation">
            模拟单次
          </el-button>
          <el-button class="daily-reset-btn" :size="compSize" type="danger" @click="resetToday">
            重置
          </el-button>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import { useResponsive } from '@/composables/useResponsive';

import { useSwordmancyGameState } from './composables/useSwordmancyGameState';
import type { PlaqueConfig } from './composables/useSwordmancyGameState';
import { DEFAULT_DECK_CONFIG_DATE, DEFAULT_REWARDS } from './EndfieldTrialSwordmancySolver';

const {
  config,
  configDateExpired,
  aversionFactor,
  fixedPenalty,
  remainingGames,
  remainingDoubles,
  remainingAbandons,
  setEuParams,
  isEuPresetActive,
  resetPoolConfig,
  handleResetPoolConfig,
  setSingleSimulation,
  resetToday,
  onlyConfigDigit,
  clearSolverCache,
  rewardValues,
  resetRewardTable,
} = useSwordmancyGameState();

const { isMobile } = useResponsive();
const compSize = computed(() => (isMobile.value ? 'small' : 'default'));

const activeCollapse = ref<string[]>([]);

/** 快速配置模式（OTP 式单格输入+自动跳转） */
const poolQuickConfigMode = ref(true);

function toggleQuickMode() {
  poolQuickConfigMode.value = !poolQuickConfigMode.value;
  if (poolQuickConfigMode.value) {
    ([1, 2, 3, 4, 5] as const).forEach((level) => {
      const k = `level${level}` as keyof PlaqueConfig;
      if (config[k] > 9) config[k] = 9;
    });
  }
}

const otpConfigValue = computed({
  get: () =>
    [config.level1, config.level2, config.level3, config.level4, config.level5]
      .map((v) => (v > 9 ? 9 : v))
      .join(''),
  set: (val: string) => {
    const s = val.padEnd(5, '0').slice(0, 5);
    config.level1 = Number(s[0]) || 0;
    config.level2 = Number(s[1]) || 0;
    config.level3 = Number(s[2]) || 0;
    config.level4 = Number(s[3]) || 0;
    config.level5 = Number(s[4]) || 0;
  },
});

/** textarea 中的 JSON 字符串 */
const rewardTableText = ref(JSON.stringify(DEFAULT_REWARDS, null, 2));
/** 解析错误信息 */
const rewardTableError = ref('');

function applyRewardTable() {
  const error = useSwordmancyGameState().applyRewardTable(rewardTableText.value);
  rewardTableError.value = error ?? '';
}

function handleResetRewardTable() {
  rewardTableText.value = JSON.stringify(DEFAULT_REWARDS, null, 2);
  rewardTableError.value = '';
  resetRewardTable();
}
</script>

<style lang="scss" scoped>
@use './styles/EndfieldTrialOfSwordmancyCard' as *;

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
  gap: 8px;
  align-items: center;

  :deep(.el-input) {
    width: 80px;
  }
}

.config-label,
.daily-label,
.expected-utility-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.config-otp-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.config-buttons,
.config-reward-buttons {
  display: flex;
  margin-top: 8px;
}

.config-reward-section {
  margin-top: 4px;
}

.config-reward-header {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: bold;
}

.config-date-hint {
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .config-hint-hint {
    display: flex;
    align-items: center;
    height: 20px;
  }
}

.config-reward-hint {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.config-reward-textarea {
  width: 100%;

  :deep(textarea) {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.5;
  }
}

.config-reward-error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
}

@include card-padding('.expected-utility-card', '.daily-card');

// ── Expected utility ──
.expected-utility-body,
.expected-utility-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.expected-utility-grid {
  margin-bottom: 8px;
}

.expected-utility-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.expected-utility-slider {
  flex: 1;
}

.expected-utility-input {
  width: 140px;
}

.expected-utility-presets {
  display: flex;
  flex-wrap: wrap;
}

@include game-section-base;

// ── Daily state ──
.daily-date-hint {
  display: flex;
  align-items: baseline;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .date-hint-text {
    display: flex;
    align-items: center;
    height: 20px;
  }
}

.daily-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  .config-otp-row {
    margin-bottom: 0;
  }

  .config-grid {
    margin-bottom: 0;
  }

  .config-buttons {
    margin-top: 0;
  }
}

.daily-item {
  display: flex;
  gap: 4px;
  align-items: center;
}

.daily-input {
  width: 108px;
}

.daily-input-zero {
  :deep(.el-input__inner) {
    color: var(--el-color-danger);
  }
}

.daily-single-btn {
  margin-left: auto;
}

.daily-reset-btn {
  margin-left: 0;
}

@include game-section-responsive;

// ── Responsive ──
@media (max-width: 767px) {
  .daily-input {
    width: 80px;
  }
}
</style>
