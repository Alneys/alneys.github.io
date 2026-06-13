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

    <el-card class="daily-card" style="margin-bottom: 16px">
      <template #header>
        <span>今日状态</span>
      </template>
      <div class="daily-grid">
        <div class="daily-item">
          <span class="daily-label">剩余游玩</span>
          <el-input-number
            v-model="remainingGames"
            :min="0"
            :max="3"
            size="small"
            class="daily-input"
          />
        </div>
        <div class="daily-item">
          <span class="daily-label">剩余翻倍</span>
          <el-input-number
            v-model="remainingDoubles"
            :min="0"
            :max="2"
            size="small"
            class="daily-input"
          />
        </div>
        <div class="daily-item">
          <span class="daily-label">剩余放弃</span>
          <el-input-number
            v-model="remainingAbandons"
            :min="0"
            :max="3"
            size="small"
            class="daily-input"
          />
        </div>
        <el-button size="small" @click="setSingleSimulation" class="daily-single-btn">
          设为单次模拟
        </el-button>
        <el-button size="small" type="danger" @click="resetToday" class="daily-reset-btn">
          重置今日
        </el-button>
      </div>
    </el-card>

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
        <div class="overflow-psych-section" v-if="showAdjustedCol">
          <span class="reward-label">溢出心理</span>
          <el-segmented
            :model-value="overflowPsychValue"
            :options="overflowPsychOptions"
            block
            class="overflow-psych-segmented"
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

      <el-row :gutter="16" class="actions-row">
        <el-col :span="12">
          <div class="actions-row-left">
            <el-popconfirm title="确认重置今日所有状态？" @confirm="resetToday">
              <template #reference>
                <el-button type="danger" size="large" class="action-btn"> 重置今日 </el-button>
              </template>
            </el-popconfirm>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="actions-row-right">
            <el-button
              type="primary"
              @click="drawCard"
              :disabled="!canDraw || remainingGames === 0"
              size="large"
              class="action-btn"
            >
              {{ activeDrawCount === 0 ? '开始抽牌' : '继续抽牌' }}
            </el-button>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16" class="actions-row">
        <el-col :span="12">
          <div class="actions-row-left">
            <el-button
              type="danger"
              @click="abandonGame"
              :disabled="!canAbandon"
              size="large"
              class="action-btn"
            >
              放弃本局<br />（剩余{{ remainingAbandons }}次）
            </el-button>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="actions-row-right">
            <span class="action-switch-label"
              ><span class="action-switch-remaining">（剩余{{ remainingDoubles }}次）</span
              ><span class="action-switch-warning">奖励翻倍</span></span
            >
            <el-switch
              :model-value="doubled"
              :disabled="!canToggleDouble"
              inactive-text="关"
              active-text="开"
              size="large"
              class="action-switch"
              @change="handleDoubleSwitch"
            />
            <el-button
              type="info"
              :disabled="remainingGames === 0 || activeDrawCount === 0"
              @click="activeDrawCount > 0 ? endGame() : resetGame()"
              size="large"
              class="action-btn"
            >
              <template v-if="activeDrawCount > 0"
                >结算本局<br />（剩余{{ remainingGames }}次）</template
              >
              <template v-else>新一局<br />（剩余{{ remainingGames }}次）</template>
            </el-button>
          </div>
        </el-col>
      </el-row>

      <el-card class="psycho-card">
        <template #header>
          <span>心理模型参数（溢出厌恶）</span>
        </template>
        <div class="psycho-body">
          <el-alert type="info" :closable="false" show-icon>
            调整公式：奖励 × 溢出接受值<sup>k</sup> − k × 固定心理落差（k = 总战力 ÷
            11，向下取整），可为负
          </el-alert>
          <div class="psycho-grid">
            <div class="psycho-item">
              <span class="psycho-label">溢出接受值</span>
              <el-slider
                v-model="aversionFactor"
                :min="0"
                :max="1"
                :step="0.05"
                show-input
                input-size="small"
                class="psycho-slider"
              />
            </div>
            <div class="psycho-item">
              <span class="psycho-label">固定心理落差</span>
              <el-input-number
                v-model="fixedPenalty"
                :min="0"
                :max="1000000"
                :step="5000"
                size="small"
                class="psycho-input"
              />
            </div>
          </div>
          <div class="psycho-presets">
            <el-button
              size="small"
              @click="setPsychoParams(1.0, 0)"
              :type="isPresetActive(1.0, 0) ? 'primary' : ''"
            >
              收益最大
            </el-button>
            <el-button
              size="small"
              @click="setPsychoParams(0.6, 60000)"
              :type="isPresetActive(0.6, 60000) ? 'primary' : ''"
            >
              预设
            </el-button>
            <el-button
              size="small"
              @click="setPsychoParams(0.01, 640000)"
              :type="isPresetActive(0.01, 640000) ? 'primary' : ''"
            >
              绝对厌恶惩罚
            </el-button>
          </div>
        </div>
      </el-card>

      <el-card class="advice-card">
        <template #header>
          <span>最优策略建议</span>
        </template>
        <div v-if="currentAdvice" class="advice-content">
          <div v-if="showAdjustedCol" class="advice-row advice-header">
            <span class="advice-label" />
            <span class="advice-value">原始期望</span>
            <span class="advice-sep">|</span>
            <span class="advice-value advice-adjusted">调整后期望</span>
          </div>
          <div class="advice-row">
            <span class="advice-label">本局当前奖励</span>
            <span class="advice-value">{{ formatDecimal(currentAdvice.current_reward) }}</span>
            <span v-if="showAdjustedCol" class="advice-sep">|</span>
            <span v-if="showAdjustedCol" class="advice-value advice-adjusted">{{
              adjustedAdvice ? formatDecimal(adjustedAdvice.current_reward) : '—'
            }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label">本局继续期望</span>
            <span class="advice-value">{{
              currentAdvice.expected_continue_reward != null
                ? formatDecimal(currentAdvice.expected_continue_reward)
                : '—'
            }}</span>
            <span v-if="showAdjustedCol" class="advice-sep">|</span>
            <span v-if="showAdjustedCol" class="advice-value advice-adjusted">{{
              adjustedAdvice && adjustedAdvice.expected_continue_reward != null
                ? formatDecimal(adjustedAdvice.expected_continue_reward)
                : '—'
            }}</span>
          </div>

          <el-divider style="margin: 8px 0" />
          <div class="advice-row">
            <span class="advice-label">各行动今日总期望：</span>
            <span class="advice-value" />
          </div>
          <div
            class="advice-row"
            :class="{
              'advice-row-optimal': isRawOptOnly('continue', 'must_continue'),
              'advice-row-optimal-adjusted': isAdjOpt('continue') || isAdjOpt('must_continue'),
            }"
          >
            <span class="advice-label">继续抽牌</span>
            <span class="advice-value">{{
              currentAdvice.draw_total != null ? formatDecimal(currentAdvice.draw_total) : '—'
            }}</span>
            <span v-if="showAdjustedCol" class="advice-sep">|</span>
            <span v-if="showAdjustedCol" class="advice-value advice-adjusted">{{
              adjustedAdvice && adjustedAdvice.draw_total != null
                ? formatDecimal(adjustedAdvice.draw_total)
                : '—'
            }}</span>
          </div>
          <div
            class="advice-row"
            :class="{
              'advice-row-optimal': isRawOptOnly('double'),
              'advice-row-optimal-adjusted': isAdjOpt('double'),
            }"
          >
            <span class="advice-label">开启翻倍</span>
            <span class="advice-value">{{
              currentAdvice.double_total != null ? formatDecimal(currentAdvice.double_total) : '—'
            }}</span>
            <span v-if="showAdjustedCol" class="advice-sep">|</span>
            <span v-if="showAdjustedCol" class="advice-value advice-adjusted">{{
              adjustedAdvice && adjustedAdvice.double_total != null
                ? formatDecimal(adjustedAdvice.double_total)
                : '—'
            }}</span>
          </div>
          <div
            class="advice-row"
            :class="{
              'advice-row-optimal': isRawOptOnly('abandon'),
              'advice-row-optimal-adjusted': isAdjOpt('abandon'),
            }"
          >
            <span class="advice-label">放弃本局</span>
            <span class="advice-value">{{
              currentAdvice.abandon_total != null ? formatDecimal(currentAdvice.abandon_total) : '—'
            }}</span>
            <span v-if="showAdjustedCol" class="advice-sep">|</span>
            <span v-if="showAdjustedCol" class="advice-value advice-adjusted">{{
              adjustedAdvice && adjustedAdvice.abandon_total != null
                ? formatDecimal(adjustedAdvice.abandon_total)
                : '—'
            }}</span>
          </div>
          <div
            class="advice-row"
            :class="{
              'advice-row-optimal': isRawOptOnly('stop', 'must_stop'),
              'advice-row-optimal-adjusted': isAdjOpt('stop') || isAdjOpt('must_stop'),
            }"
          >
            <span class="advice-label">结算本局</span>
            <span class="advice-value">{{
              currentAdvice.stop_total != null ? formatDecimal(currentAdvice.stop_total) : '—'
            }}</span>
            <span v-if="showAdjustedCol" class="advice-sep">|</span>
            <span v-if="showAdjustedCol" class="advice-value advice-adjusted">{{
              adjustedAdvice && adjustedAdvice.stop_total != null
                ? formatDecimal(adjustedAdvice.stop_total)
                : '—'
            }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label" style="text-indent: 0.5em">- 结算本局后的期望</span>
            <span class="advice-value">{{ formatDecimal(currentAdvice.expected_after_stop) }}</span>
          </div>
          <el-divider style="margin: 8px 0" />
          <div class="advice-row">
            <span class="advice-label">今日总期望</span>
            <span class="advice-value advice-today-value">{{
              formatDecimal(currentAdvice.expected_today)
            }}</span>
            <span v-if="showAdjustedCol" class="advice-sep">|</span>
            <span v-if="showAdjustedCol" class="advice-value advice-today-adjusted">{{
              adjustedAdvice ? formatDecimal(adjustedAdvice.expected_today) : '—'
            }}</span>
          </div>

          <el-divider style="margin: 8px 0" />
          <div
            class="advice-decision"
            :class="{
              'advice-continue':
                decisionAction === 'continue' || decisionAction === 'must_continue',
              'advice-stop': decisionAction === 'stop' || decisionAction === 'must_stop',
              'advice-abandon': decisionAction === 'abandon',
            }"
          >
            <template v-if="decisionAction === 'double'">
              {{ decisionPrefix }}建议先开启翻倍再继续
            </template>
            <template v-else-if="decisionAction === 'abandon'">
              {{ decisionPrefix }}建议放弃本局（重开期望更高）
            </template>
            <template v-else-if="decisionAction === 'continue'">
              {{ decisionPrefix }}建议继续抽牌（期望更高）
            </template>
            <template v-else-if="decisionAction === 'stop'">
              {{ decisionPrefix }}建议停止（当前奖励更高）
            </template>
            <template v-else-if="decisionAction === 'must_continue'">
              {{ decisionPrefix }}必须抽第一张牌
            </template>
            <template v-else>{{ decisionPrefix }}建议结算</template>
          </div>
        </div>
        <div v-else class="advice-content">
          <div class="advice-empty">正在计算策略数据…</div>
        </div>
      </el-card>

      <el-collapse v-model="strategyCollapse" class="strategy-panel">
        <el-collapse-item title="完整策略表" name="strategy">
          <div class="strategy-note">
            注：以下为单局最优策略（未考虑翻倍和每日多局统筹），建议面板已考虑完整全局最优
          </div>
          <el-input
            v-model="strategySearch"
            placeholder="搜索组合（如 123、55）"
            clearable
            class="strategy-search"
          />
          <el-table
            :data="filteredResults"
            size="small"
            max-height="400"
            :row-class-name="tableRowClassName"
            style="width: 100%"
          >
            <el-table-column label="组合" width="100">
              <template #default="{ row }">
                <span v-if="row.combination === ''" class="strategy-empty">(初始)</span>
                <span v-else>{{ row.combination }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="drawn" label="已抽" width="60" />
            <el-table-column label="当前奖励">
              <template #default="{ row }">
                <span class="num-cell">{{ row.current_reward.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="showAdjustedCol" label="调整后奖励" width="110">
              <template #default="{ row }">
                <span class="num-cell num-adjusted">{{
                  rowAdjusted(row).adjusted_reward.toLocaleString()
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="继续期望">
              <template #default="{ row }">
                <span v-if="row.expected_continue_reward != null" class="num-cell">{{
                  row.expected_continue_reward.toLocaleString()
                }}</span>
                <span v-else class="strategy-na">—</span>
              </template>
            </el-table-column>
            <el-table-column v-if="showAdjustedCol" label="调整后继望" width="110">
              <template #default="{ row }">
                <span
                  v-if="rowAdjusted(row).adjusted_expected_continue != null"
                  class="num-cell num-adjusted"
                  >{{ rowAdjusted(row).adjusted_expected_continue!.toLocaleString() }}</span
                >
                <span v-else class="strategy-na">—</span>
              </template>
            </el-table-column>
            <el-table-column label="行动" width="70">
              <template #default="{ row }">
                <span :class="actionTagClass(row.optimal_action)">{{
                  actionTagLabel(row.optimal_action)
                }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="showAdjustedCol" label="调整后行动" width="80">
              <template #default="{ row }">
                <span :class="actionTagClass(rowAdjusted(row).optimal_action)">{{
                  actionTagLabel(rowAdjusted(row).optimal_action)
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最优期望" width="100">
              <template #default="{ row }">
                <span class="num-cell">{{
                  (row.expected_continue_reward != null
                    ? Math.max(row.current_reward, row.expected_continue_reward)
                    : row.current_reward
                  ).toLocaleString()
                }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="showAdjustedCol" label="调整后最优" width="100">
              <template #default="{ row }">
                <span class="num-cell num-adjusted">{{
                  rowAdjusted(row).optimal_expected.toLocaleString()
                }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
// 逻辑三部分：
//   1. 铭牌配置 & 游戏操作（抽牌/翻倍/结算）
//   2. 奖励计算（战力点 → 档位）
//   3. DP 求解器集成（单局策略表 + 多局翻倍建议）
import { reactive, ref, computed, watch } from 'vue';
import { solve, getCurrentAdvice } from './EndfieldTrialSwordmancySolver';
import type {
  SolverResultEntry,
  AdviceResult,
  OverflowParams,
} from './EndfieldTrialSwordmancySolver';

/** 最多抽取张数 */
const MAX_DRAWS = 5;

/** 默认战力点 → 奖励对照表（索引 = 战力点） */
const REWARD_TABLE: Record<number, number> = {
  0: 0,
  1: 1000,
  2: 2000,
  3: 4000,
  4: 7500,
  5: 12000,
  6: 20000,
  7: 36000,
  8: 60000,
  9: 100000,
  10: 160000,
};

/** 各等级牌数量配置 */
interface PlaqueConfig {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
}

/** 单张铭牌 */
interface Plaque {
  id: number;
  level: number;
  power: number;
}

// ── 牌库配置 ──

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

// ── 心理模型参数（溢出厌恶） ──

const aversionFactor = ref(1.0);
const fixedPenalty = ref(0);

const overflowParams = computed<OverflowParams | undefined>(() => {
  // 默认参数等同于不启用心理模型
  if (aversionFactor.value === 1.0 && fixedPenalty.value === 0) return undefined;
  return { aversionFactor: aversionFactor.value, fixedPenalty: fixedPenalty.value };
});

const showAdjustedCol = computed(() => overflowParams.value !== undefined);

function setPsychoParams(af: number, fp: number) {
  aversionFactor.value = af;
  fixedPenalty.value = fp;
}

function isPresetActive(af: number, fp: number): boolean {
  return aversionFactor.value === af && fixedPenalty.value === fp;
}

// ── DP 策略表面板状态 ──

const strategyCollapse = ref<string[]>([]);
const strategySearch = ref('');

// ── 游戏核心状态 ──

/** 牌池（剩余未抽的铭牌） */
const pool = ref<Plaque[]>([]);
/** 已抽的 5 个槽位 */
const drawnCards = ref<(Plaque | null)[]>([null, null, null, null, null]);
/** 是否已开启奖励翻倍 */
const doubled = ref(false);
/** 今日剩余游玩次数 */
const remainingGames = ref(3);
/** 今日剩余翻倍次数 */
const remainingDoubles = ref(2);
/** 今日剩余放弃次数 */
const remainingAbandons = ref(3);
/** 手动设置时牌池不足的警告标记 */
const slotWarnings = reactive<boolean[]>([false, false, false, false, false]);

/** 各等级已抽数量（索引 0-4 对应等级 1-5） */
const drawnCounts = computed(() => {
  const counts = [0, 0, 0, 0, 0];
  for (const card of drawnCards.value) {
    if (card) counts[card.level - 1]!++;
  }
  return counts;
});

let nextId = 0;

function createPlaque(level: number): Plaque {
  return { id: nextId++, level, power: level };
}

/** 根据当前配置构建初始牌池 */
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

/** 将已抽牌放回牌池 */
function resetDrawn() {
  for (const card of drawnCards.value) {
    if (card) pool.value.push(card);
  }
  initDrawnCards();
}

/** 应用配置新配置并重置牌池 */
function applyConfig() {
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
}

/** 重置本局牌库/已抽/翻倍 */
function resetGame() {
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
}

/** 结算本局，进入下一局（消耗一次游玩次数） */
function endGame() {
  if (remainingGames.value <= 0) return;
  remainingGames.value--;
  resetGame();
}

/** 重置今日全部状态 */
function resetToday() {
  remainingGames.value = 3;
  remainingDoubles.value = 2;
  remainingAbandons.value = 3;
  resetGame();
}

/** 设置为单次模拟（P=1, B=0, A=0） */
function setSingleSimulation() {
  remainingGames.value = 1;
  remainingDoubles.value = 0;
  remainingAbandons.value = 0;
  resetGame();
}

/** 重置铭牌分布为默认值 */
function resetConfig() {
  config.level1 = DEFAULT_CONFIG.level1;
  config.level2 = DEFAULT_CONFIG.level2;
  config.level3 = DEFAULT_CONFIG.level3;
  config.level4 = DEFAULT_CONFIG.level4;
  config.level5 = DEFAULT_CONFIG.level5;
}

pool.value = buildPool();

// ── 牌池展示 ──

const poolByLevel = computed(() => {
  const groups: Record<number, Plaque[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const plaque of pool.value) {
    groups[plaque.level]!.push(plaque);
  }
  return groups;
});

// ── 奖励计算 ──

const activeDrawCount = computed(() => drawnCards.value.filter(Boolean).length);

const totalPower = computed(() => drawnCards.value.reduce((sum, c) => sum + (c?.power ?? 0), 0));

/** 战力点 → 奖励档位索引
 *  0-10 直接映射；超过 10 则模 11 循环 */
const rewardIndex = computed(() => {
  if (totalPower.value > 10) {
    return totalPower.value % 11;
  }
  return totalPower.value;
});

/** 翻倍前的基础奖励 */
const baseReward = computed(() => REWARD_TABLE[rewardIndex.value] ?? 0);

/** 最终奖励（含翻倍） */
const finalReward = computed(() => {
  return doubled.value ? baseReward.value * 2 : baseReward.value;
});

// ── 按钮可用状态 ──

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

/** 可放弃条件：有放弃次数、已抽至少一张牌、有剩余游玩次数 */
const canAbandon = computed(() => {
  return remainingAbandons.value > 0 && activeDrawCount.value > 0 && remainingGames.value > 0;
});

// ── 游戏操作 ──

/** 随机抽取一张牌 */
function drawCard() {
  if (!canDraw.value) return;
  const emptyIndex = drawnCards.value.findIndex((c) => c == null);
  if (emptyIndex === -1) return;
  const index = Math.floor(Math.random() * pool.value.length);
  const plaque = pool.value.splice(index, 1)[0]!;
  drawnCards.value[emptyIndex] = plaque;
}

/** 从牌池中取出一张指定等级的牌（返回 null 表示牌池不足） */
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

/** OTP 输入校验：只允许 1-5 和空 */
function onlyLevel(value: string): boolean {
  return value === '' || (value >= '1' && value <= '5');
}

function toggleDouble() {
  if (!canDouble.value) return;
  doubled.value = true;
  remainingDoubles.value--;
}

function handleDoubleSwitch(val: string | number | boolean) {
  if (val) {
    if (!doubled.value) toggleDouble();
  } else {
    if (doubled.value) {
      doubled.value = false;
      remainingDoubles.value++;
    }
  }
}

/** 放弃本局：不消耗游玩次数，退还翻倍，重置牌局 */
function abandonGame() {
  if (!canAbandon.value) return;
  if (doubled.value) remainingDoubles.value++;
  remainingAbandons.value--;
  resetGame();
}

// ── UI 辅助 ──

/** 格式化数值为固定两位小数 */
function formatDecimal(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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

const rewardOptions = computed(() =>
  Array.from({ length: 11 }, (_, i) => ({
    label: formatRewardShort(doubled.value ? REWARD_TABLE[i]! * 2 : REWARD_TABLE[i]!),
    value: i,
  })),
);

const powerPointOptions = Array.from({ length: 11 }, (_, i) => ({
  label: String(i),
  value: i,
}));

/** 溢出心理挡位：战力点 11~21 经心理模型调整后的奖励，供玩家对比参考 */
const overflowPsychOptions = computed(() => {
  const params = overflowParams.value;
  return Array.from({ length: 11 }, (_, i) => {
    const power = 11 + i;
    const s = power % 11; // 有效战力
    const raw = REWARD_TABLE[s] ?? 0;
    let label: string;
    if (params) {
      const adjusted = raw * Math.pow(params.aversionFactor, 1) - 1 * params.fixedPenalty;
      label = formatRewardShort(adjusted);
    } else {
      label = formatRewardShort(raw);
    }
    return { label, value: power };
  });
});

/** 当前总战力对应的溢出点（11~21），未溢出时不选中任何挡位 */
const overflowPsychValue = computed(() => {
  if (totalPower.value >= 11 && totalPower.value <= 21) return totalPower.value;
  return undefined;
});

/** OTP 输入框的字符串值（按抽牌顺序排列，空位为 ''） */
const otpValue = computed(() => drawnCards.value.map((c) => c?.level ?? '').join(''));

const hasWarning = computed(() => slotWarnings.some(Boolean));

// ── DP 求解器集成 ──

/** 将配置对象转为数组形式供求解器使用 */
const deckConfigArray = computed(() => [
  config.level1,
  config.level2,
  config.level3,
  config.level4,
  config.level5,
]);
const rewardArray = computed(() => Object.values(REWARD_TABLE).slice(0, 11));

/** 完整策略表结果（配置变化时自动重新计算） */
const solverResults = computed<SolverResultEntry[]>(() => {
  const deck = deckConfigArray.value;
  const rewards = rewardArray.value;
  if (deck.some((c) => c < 0)) return [];
  return solve(deck, rewards);
});

/** 调整后策略表结果（传入心理模型参数，与原始结果并行展示） */
const adjustedSolverResults = computed<SolverResultEntry[]>(() => {
  const deck = deckConfigArray.value;
  const rewards = rewardArray.value;
  if (deck.some((c) => c < 0) || !overflowParams.value) return solverResults.value;
  return solve(deck, rewards, overflowParams.value);
});

/** 当前状态的最优行动建议（含多局/翻倍，原始） */
const currentAdvice = computed<AdviceResult | null>(() => {
  const deck = deckConfigArray.value;
  const rewards = rewardArray.value;
  if (deck.some((c) => c < 0)) return null;
  return getCurrentAdvice(
    drawnCounts.value,
    deck,
    rewards,
    doubled.value,
    remainingGames.value,
    remainingDoubles.value,
    remainingAbandons.value,
  );
});

/** 调整后的最优行动建议（含溢出厌恶模型） */
const adjustedAdvice = computed<AdviceResult | null>(() => {
  const deck = deckConfigArray.value;
  const rewards = rewardArray.value;
  if (deck.some((c) => c < 0) || !overflowParams.value) return currentAdvice.value;
  return getCurrentAdvice(
    drawnCounts.value,
    deck,
    rewards,
    doubled.value,
    remainingGames.value,
    remainingDoubles.value,
    remainingAbandons.value,
    overflowParams.value,
  );
});

// ── 策略表面板搜索与筛选 ──

/** 子序列匹配（输入顺序无关，内部自动排序后比较） */
function isSubsequence(raw: string, target: string): boolean {
  const query = raw.split('').sort().join('');
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

/** 按搜索词过滤策略表结果（原始） */
const filteredResults = computed(() => {
  const query = strategySearch.value.trim();
  if (!query) return solverResults.value;
  return solverResults.value.filter((r) => isSubsequence(query, r.combination));
});

/** 按相同搜索词过滤调整后结果 */
const filteredAdjustedResults = computed(() => {
  const query = strategySearch.value.trim();
  if (!query) return adjustedSolverResults.value;
  return adjustedSolverResults.value.filter((r) => isSubsequence(query, r.combination));
});

/** 当前已抽组合（排序后，用于表格行高亮匹配） */
const currentCombinationStr = computed(() =>
  drawnCounts.value.map((c, i) => String(i + 1).repeat(c)).join(''),
);

/** 抽牌或手动输入后，自动将搜索框同步为当前组合 */
watch(otpValue, (val) => {
  strategySearch.value = val;
});

/** el-table 行高亮回调 */
function tableRowClassName({ row }: { row: any }) {
  if (row.combination === currentCombinationStr.value) {
    return 'table-row-highlight';
  }
  return '';
}

/** 原始最优且调整后非最优时才高亮原始色，避免与调整后高亮冲突 */
function isRawOptOnly(...actions: string[]): boolean {
  if (!currentAdvice.value) return false;
  const rawIs = actions.includes(currentAdvice.value.optimal_action);
  if (!rawIs) return false;
  if (!adjustedAdvice.value) return true;
  return !actions.includes(adjustedAdvice.value.optimal_action);
}

/** 调整后最优则优先使用调整后高亮色 */
function isAdjOpt(...actions: string[]): boolean {
  if (!adjustedAdvice.value) return false;
  return actions.includes(adjustedAdvice.value.optimal_action);
}

/** 决策动作优先采用心理模型建议，无模型时回退原始 */
const decisionAction = computed(
  () => adjustedAdvice.value?.optimal_action ?? currentAdvice.value?.optimal_action ?? 'stop',
);

/** 仅心理模型激活时在决策文字前显示标注 */
const decisionPrefix = computed(() => (showAdjustedCol.value ? '心理模型应用后：' : ''));

/** 在调整后结果中查找对应的行 */
function rowAdjusted(row: any): {
  adjusted_reward: number;
  adjusted_expected_continue: number | null;
  optimal_action: string;
  optimal_expected: number;
} {
  const combo = row.combination;
  const adjusted = filteredAdjustedResults.value.find((a) => a.combination === combo);
  if (!adjusted) {
    return {
      adjusted_reward: row.current_reward,
      adjusted_expected_continue: row.expected_continue_reward ?? null,
      optimal_action: row.optimal_action ?? 'must_stop',
      optimal_expected:
        row.expected_continue_reward != null
          ? Math.max(row.current_reward, row.expected_continue_reward)
          : row.current_reward,
    };
  }
  return {
    adjusted_reward: adjusted.current_reward,
    adjusted_expected_continue: adjusted.expected_continue_reward,
    optimal_action: adjusted.optimal_action,
    optimal_expected:
      adjusted.expected_continue_reward != null
        ? Math.max(adjusted.current_reward, adjusted.expected_continue_reward)
        : adjusted.current_reward,
  };
}

function actionTagClass(action: string): string {
  const map: Record<string, string> = {
    continue: 'tag tag-success',
    stop: 'tag tag-primary',
    must_continue: 'tag tag-warning',
    must_stop: 'tag tag-info',
    double: 'tag tag-warning',
    abandon: 'tag tag-danger',
  };
  return map[action] ?? 'tag tag-info';
}

function actionTagLabel(action: string): string {
  const map: Record<string, string> = {
    continue: '继续',
    stop: '停止',
    must_continue: '必抽',
    must_stop: '必停',
    double: '翻倍',
    abandon: '放弃',
  };
  return map[action] ?? '必停';
}

// ── OTP 手动输入处理 ──
// 先将所有已抽牌归还牌池，再按 OTP 顺序依次取出指定等级

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
// ── 布局与通用 ──
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

  // ── 心理模型参数 ──

  .psycho-card {
    :deep(.el-card__header) {
      font-weight: 600;
      padding: 10px 16px;
    }
    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .psycho-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .psycho-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 8px;
  }

  .psycho-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .psycho-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    min-width: 120px;
  }

  .psycho-slider {
    flex: 1;
  }

  .psycho-input {
    width: 140px;
  }

  .psycho-presets {
    display: flex;
    flex-wrap: wrap;
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

  // ── 已抽铭牌区域 ──

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
    font-weight: bold;
    line-height: 1;
    color: var(--el-color-primary);
  }

  .drawn-slot-q {
    font-size: 32px;
    font-weight: bold;
    line-height: 1;
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

  // ── 牌池展示 ──

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

    // ── 奖励状态 ──

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

  .overflow-psych-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .reward-label {
      width: 64px;
      white-space: nowrap;
    }

    .overflow-psych-segmented {
      flex-grow: 1;
      --el-border-radius-base: 0px;
      --el-segmented-item-selected-bg-color: var(--el-color-danger);
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

  // ── 今日状态 ──

  .daily-card {
    :deep(.el-card__header) {
      font-weight: 600;
      padding: 10px 16px;
    }
    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .daily-grid {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .daily-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .daily-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  .daily-input {
    width: 72px;
  }

  .daily-suffix {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .daily-single-btn {
    margin-left: auto;
  }

  .daily-reset-btn {
    margin-left: 0;
  }

  // ── 策略表标注 ──

  .strategy-note {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
    line-height: 1.4;
  }

  // ── 最优策略建议 ──

  .advice-card {
    :deep(.el-card__header) {
      font-weight: 600;
      padding: 10px 16px;
    }
    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .advice-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .advice-row {
    display: flex;
    align-items: center;
    font-size: 14px;
    gap: 6px;
  }

  .advice-label {
    color: var(--el-text-color-secondary);
    min-width: 160px;
  }

  .advice-row-optimal {
    background: var(--el-fill-color);
    font-weight: 600;
    border-radius: 4px;
  }

  .advice-row-optimal-adjusted {
    background: var(--el-color-primary-light-8);
    font-weight: 600;
    border-radius: 4px;
  }

  .advice-value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    min-width: 80px;
  }

  .advice-sep {
    color: var(--el-border-color);
    font-weight: 200;
  }

  .advice-adjusted {
    color: var(--el-color-danger);
  }

  .advice-header {
    font-size: 12px;

    .advice-value {
      font-weight: 600;
    }
  }

  .advice-today-adjusted {
    color: var(--el-color-danger);
    font-weight: 700;
  }

  .advice-decision {
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    padding: 6px 0;
    border-radius: 6px;

    &.advice-continue {
      color: var(--el-color-success);
    }

    &.advice-stop {
      color: var(--el-color-primary);
    }

    &.advice-abandon {
      color: var(--el-color-danger);
    }
  }

  // ── 策略表 ──

  .strategy-panel {
    margin-bottom: 0;

    :deep(.el-collapse-item__header) {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .strategy-search {
    margin-bottom: 8px;
  }

  .num-cell {
    font-variant-numeric: tabular-nums;
  }

  .num-adjusted {
    color: var(--el-color-danger);
  }

  .strategy-empty {
    color: var(--el-text-color-placeholder);
  }

  .strategy-na {
    color: var(--el-text-color-placeholder);
  }

  .tag {
    display: inline-block;
    padding: 0 6px;
    font-size: 12px;
    line-height: 22px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .tag-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .tag-primary {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .tag-warning {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .tag-info {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
  }

  .tag-danger {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  :deep(.table-row-highlight) {
    background: var(--el-color-primary-light-9);
    font-weight: 600;
  }

  :deep(.el-table__body tr.table-row-highlight:hover td) {
    background: var(--el-color-primary-light-9);
  }

  // ── 操作按钮 ──

  .actions-row-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .actions-row-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  }

  .action-btn {
    min-width: 144px;
    line-height: 1.2;
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
    min-width: 100px;
    justify-content: center;
  }
}
</style>
