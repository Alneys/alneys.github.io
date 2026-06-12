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

      <el-card class="daily-card">
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
            <span class="daily-suffix">/ 3</span>
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
            <span class="daily-suffix">/ 2</span>
          </div>
          <el-button size="small" @click="setSingleSimulation" class="daily-single-btn">
            设为单次模拟
          </el-button>
        </div>
      </el-card>

      <el-card class="advice-card">
        <template #header>
          <span>最优策略建议</span>
        </template>
        <div v-if="currentAdvice" class="advice-content">
          <div class="advice-row">
            <span class="advice-label">本局当前奖励</span>
            <span class="advice-value">{{ currentAdvice.current_reward.toLocaleString() }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label">本局继续期望</span>
            <span class="advice-value">{{
              currentAdvice.expected_continue_reward != null
                ? currentAdvice.expected_continue_reward.toLocaleString()
                : '—'
            }}</span>
          </div>

          <el-divider style="margin: 8px 0" />
          <div class="advice-row">
            <span class="advice-label">各行动今日总期望：</span>
            <span class="advice-value"></span>
          </div>
          <div class="advice-row">
            <span class="advice-label">继续抽牌</span>
            <span class="advice-value">{{
              currentAdvice.draw_total != null ? currentAdvice.draw_total.toLocaleString() : '—'
            }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label">开启翻倍</span>
            <span class="advice-value">{{
              currentAdvice.double_total != null ? currentAdvice.double_total.toLocaleString() : '—'
            }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label">结算本局</span>
            <span class="advice-value">{{
              currentAdvice.stop_total != null ? currentAdvice.stop_total.toLocaleString() : '—'
            }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label" style="margin-left: 0.5em">- 结算本局后的期望</span>
            <span class="advice-value">{{
              currentAdvice.expected_after_stop.toLocaleString()
            }}</span>
          </div>
          <el-divider style="margin: 8px 0" />
          <div class="advice-row">
            <span class="advice-label">今日总期望</span>
            <span class="advice-value advice-today-value">{{
              currentAdvice.expected_today.toLocaleString()
            }}</span>
          </div>

          <el-divider style="margin: 8px 0" />
          <div
            class="advice-decision"
            :class="{
              'advice-continue':
                currentAdvice.optimal_action === 'continue' ||
                currentAdvice.optimal_action === 'must_continue',
              'advice-stop':
                currentAdvice.optimal_action === 'stop' ||
                currentAdvice.optimal_action === 'must_stop',
            }"
          >
            <template v-if="currentAdvice.optimal_action === 'double'">
              建议先开启翻倍再继续
            </template>
            <template v-else-if="currentAdvice.optimal_action === 'continue'">
              建议继续抽牌（期望更高）
            </template>
            <template v-else-if="currentAdvice.optimal_action === 'stop'">
              建议停止（当前奖励更高）
            </template>
            <template v-else-if="currentAdvice.optimal_action === 'must_continue'">
              必须抽第一张牌
            </template>
            <template v-else>已无法继续抽牌</template>
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
            <el-table-column label="组合" width="120">
              <template #default="{ row }">
                <span v-if="row.combination === ''" class="strategy-empty">(初始)</span>
                <span v-else>{{ row.combination }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="drawn" label="已抽" width="80" />
            <el-table-column label="当前奖励">
              <template #default="{ row }">
                <span class="num-cell">{{ row.current_reward.toLocaleString() }}</span>
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
            <el-table-column label="行动" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.optimal_action === 'continue'" type="success" size="small">
                  继续
                </el-tag>
                <el-tag v-else-if="row.optimal_action === 'stop'" type="primary" size="small">
                  停止
                </el-tag>
                <el-tag
                  v-else-if="row.optimal_action === 'must_continue'"
                  type="warning"
                  size="small"
                >
                  必抽
                </el-tag>
                <el-tag v-else type="info" size="small"> 必停 </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最优期望" width="120">
              <template #default="{ row }">
                <span class="num-cell">{{
                  (row.expected_continue_reward != null
                    ? Math.max(row.current_reward, row.expected_continue_reward)
                    : row.current_reward
                  ).toLocaleString()
                }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>

      <div class="actions">
        <el-button
          type="primary"
          @click="drawCard"
          :disabled="!canDraw || remainingGames === 0"
          size="large"
          class="action-btn"
        >
          {{ activeDrawCount === 0 ? '开始抽牌' : '继续抽牌' }}
        </el-button>
        <el-button
          type="warning"
          @click="toggleDouble"
          :disabled="!canDouble"
          size="large"
          class="action-btn"
        >
          {{ doubled ? '已翻倍' : '开启翻倍' }}
        </el-button>
        <el-button
          type="info"
          :disabled="remainingGames === 0 || activeDrawCount === 0"
          @click="activeDrawCount > 0 ? endGame() : resetGame()"
          size="large"
          class="action-btn"
        >
          <template v-if="activeDrawCount > 0">结算本局</template>
          <template v-else>新一局</template>
        </el-button>
        <el-button type="danger" @click="resetToday" size="large" class="action-btn">
          重置今日
        </el-button>
      </div>
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
import type { SolverResultEntry, AdviceResult } from './EndfieldTrialSwordmancySolver';

/** 最多抽取张数 */
const MAX_DRAWS = 5;

/** 默认战力点 → 奖励对照表（索引 = 战力点） */
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
  resetGame();
}

/** 设置为单次模拟（P=1, B=0） */
function setSingleSimulation() {
  remainingGames.value = 1;
  remainingDoubles.value = 0;
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

/** 可翻倍条件：已抽 < 3、本局未翻倍、今日有剩余次数 */
const canDouble = computed(() => {
  return activeDrawCount.value < 3 && !doubled.value && remainingDoubles.value > 0;
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

// ── UI 辅助 ──

/** 格式化奖励数字（显示为简短格式） */
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

/** 当前状态的最优行动建议（含多局/翻倍） */
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

/** 按搜索词过滤策略表结果 */
const filteredResults = computed(() => {
  const query = strategySearch.value.trim();
  if (!query) return solverResults.value;
  return solverResults.value.filter((r) => isSubsequence(query, r.combination));
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
function tableRowClassName({ row }: { row: SolverResultEntry }) {
  if (row.combination === currentCombinationStr.value) {
    return 'table-row-highlight';
  }
  return '';
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
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
  }

  .advice-label {
    color: var(--el-text-color-secondary);
  }

  .advice-value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .advice-today-value {
    color: var(--el-color-warning);
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

  .strategy-empty {
    color: var(--el-text-color-placeholder);
  }

  .strategy-na {
    color: var(--el-text-color-placeholder);
  }

  :deep(.table-row-highlight) {
    background: var(--el-color-primary-light-9);
    font-weight: 600;
  }

  :deep(.el-table__body tr.table-row-highlight:hover td) {
    background: var(--el-color-primary-light-9);
  }

  // ── 操作按钮 ──

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
