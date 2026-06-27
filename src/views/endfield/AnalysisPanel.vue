<template>
  <el-row :gutter="16" class="game-section" data-tour="result">
    <el-col :span="15" :xs="24" :lg="24">
      <el-card class="advice-card">
        <template #header>
          <span>策略分析</span>
        </template>
        <div v-if="hasWarning" class="advice-content">
          <div class="advice-decision advice-abandon">错误：铭牌库不足</div>
        </div>
        <div v-else-if="currentAdvice && euAdvice" class="advice-content">
          <div
            class="advice-decision"
            :class="{
              'advice-draw': decisionAction === 'draw' || decisionAction === 'must_draw',
              'advice-stop': decisionAction === 'stop' || decisionAction === 'must_stop',
              'advice-double': decisionAction === 'double',
              'advice-abandon': decisionAction === 'abandon',
            }"
          >
            <template v-if="decisionAction === 'double'"> {{ decisionPrefix }}开启翻倍 </template>
            <template v-else-if="decisionAction === 'abandon'">
              {{ decisionPrefix }}放弃本局
            </template>
            <template v-else-if="decisionAction === 'stop'">
              {{ decisionPrefix }}结算本局
            </template>
            <template v-else-if="decisionAction === 'draw'">
              {{ decisionPrefix }}抽取铭牌
            </template>
            <template v-else-if="decisionAction === 'must_draw'">
              {{ decisionPrefix }}必须抽取铭牌
            </template>
            <template v-else>{{ decisionPrefix }}结算本局</template>
          </div>
          <el-divider style="margin: 4px 0" />
          <div class="advice-row advice-header">
            <span class="advice-label" />
            <span class="advice-value">奖励期望</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">期望效用</span>
          </div>
          <div class="advice-row">
            <span class="advice-label">本局当前奖励</span>
            <span class="advice-value">{{ formatDecimal(euAdvice.rewardCurrent) }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">{{
              formatDecimal(euAdvice.euCurrentReward)
            }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label">本局最优期望</span>
            <span class="advice-value">{{ formatDecimal(euAdvice.rewardRound) }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">{{
              euAdvice ? formatDecimal(euAdvice.euRound) : '—'
            }}</span>
          </div>

          <el-divider style="margin: 4px 0" />
          <div class="advice-row">
            <span class="advice-label">各行动今日总期望：</span>
            <span class="advice-value" />
          </div>
          <div
            class="advice-row"
            :class="{
              'advice-row-optimal': isEuOpt('draw') || isEuOpt('must_draw'),
            }"
          >
            <span class="advice-label">抽取铭牌</span>
            <span class="advice-value">{{
              euAdvice.rewardDraw != null ? formatDecimal(euAdvice.rewardDraw) : '—'
            }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">{{
              euAdvice.euDraw != null ? formatDecimal(euAdvice.euDraw) : '—'
            }}</span>
          </div>
          <div v-for="item in perLevelAdvice" :key="item.level" class="advice-row">
            <span class="advice-label" style="text-indent: 1.5em">铭牌点数 {{ item.level }}</span>
            <span class="advice-value" :class="diffClass(item.rewardDiff)">{{
              item.rewardDiff != null ? formatDiff(item.rewardDiff) : '—'
            }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span
              v-if="showEuColumn"
              class="advice-value advice-eu"
              :class="diffClass(item.euDiff)"
              >{{ item.euDiff != null ? formatDiff(item.euDiff) : '—' }}</span
            >
            <span class="advice-sep">|</span>
            <span class="advice-value advice-prob">{{ (item.prob * 100).toFixed(1) }}%</span>
          </div>
          <div class="advice-row" :class="{ 'advice-row-optimal': isEuOpt('double') }">
            <span class="advice-label">开启翻倍</span>
            <span class="advice-value">{{
              euAdvice.rewardDouble != null ? formatDecimal(euAdvice.rewardDouble) : '—'
            }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">{{
              euAdvice.euDouble != null ? formatDecimal(euAdvice.euDouble) : '—'
            }}</span>
          </div>
          <div class="advice-row" :class="{ 'advice-row-optimal': isEuOpt('abandon') }">
            <span class="advice-label">放弃本局</span>
            <span class="advice-value">{{
              euAdvice.rewardAbandon != null ? formatDecimal(euAdvice.rewardAbandon) : '—'
            }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">{{
              euAdvice.euAbandon != null ? formatDecimal(euAdvice.euAbandon) : '—'
            }}</span>
          </div>
          <div
            class="advice-row"
            :class="{ 'advice-row-optimal': isEuOpt('stop') || isEuOpt('must_stop') }"
          >
            <span class="advice-label">结算本局</span>
            <span class="advice-value">{{
              euAdvice.rewardStop != null ? formatDecimal(euAdvice.rewardStop) : '—'
            }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">{{
              euAdvice.euStop != null ? formatDecimal(euAdvice.euStop) : '—'
            }}</span>
          </div>
          <div class="advice-row">
            <span class="advice-label" style="text-indent: 1em">结算本局后的期望</span>
            <span class="advice-value">{{ formatDecimal(euAdvice.rewardAfterStop) }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-eu">{{
              formatDecimal(euAdvice.euAfterStop)
            }}</span>
          </div>
          <el-divider style="margin: 4px 0" />
          <div class="advice-row">
            <span class="advice-label">今日总期望</span>
            <span class="advice-value advice-today-value">{{
              formatDecimal(euAdvice.rewardToday)
            }}</span>
            <span v-if="showEuColumn" class="advice-sep">|</span>
            <span v-if="showEuColumn" class="advice-value advice-today-eu">{{
              formatDecimal(euAdvice.euToday)
            }}</span>
          </div>
        </div>
        <div v-else class="advice-content" />
      </el-card>
    </el-col>

    <el-col :span="9" :xs="24" :lg="24">
      <el-card class="distribution-card">
        <template #header>
          <span>战力点概率分布</span>
        </template>
        <template v-if="!hasWarning">
          <el-table
            v-if="distributionTableData.length > 0"
            size="small"
            :data="distributionTableData"
            height="auto"
            :row-class-name="distributionRowClassName"
            style="width: 100%; font-size: 14px"
          >
            <el-table-column label="" width="56">
              <template #default="{ row }">
                <span v-if="row.isAbandon" class="distribution-abandon-label">放弃</span>
                <span
                  v-else
                  class="distribution-value"
                  :class="{ 'distribution-current-value': row.isCurrent }"
                >
                  {{ row.value }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="概率" width="96">
              <template #default="{ row }">
                <span
                  class="distribution-prob"
                  :class="{ 'distribution-prob-abandon': row.isAbandon }"
                >
                  {{ (row.prob * 100).toFixed(2) + '%' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="分布条">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.max(Math.round(row.prob * 100), 0)"
                  :stroke-width="20"
                  :show-text="false"
                  :color="
                    row.isAbandon
                      ? 'var(--el-color-danger)'
                      : row.isCurrent
                        ? 'var(--el-color-primary)'
                        : 'var(--el-color-primary-light-5)'
                  "
                />
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="distribution-empty" />
        </template>
      </el-card>
    </el-col>
    <el-col :span="24" :xs="24">
      <el-card class="simplified-strategy-card">
        <template #header>
          <span>简化策略</span>
        </template>
        <div v-loading="solverLoading" class="simplified-body simplified-body-loading">
          <template
            v-if="simplifiedStrategyResult && simplifiedStrategyResult.optimalStrategy.length > 0"
          >
            <el-alert type="info" closable show-icon>
              1. 能翻倍就翻倍<br />
              2. 参考下表，根据当前剩余的放弃次数，找到结算阈值<br />
              3.1. 持续抽牌，每次抽牌后点数达到或超过阈值时立即结算<br />
              3.2. 已经抽满仍不满足条件，则放弃（没有放弃机会时结算）
            </el-alert>
            <el-table :data="thresholdRowData" size="small" style="width: 100%; font-size: 14px">
              <el-table-column label="剩余放弃次数" width="160">
                <template #default="{ row }">
                  <el-tooltip :content="labelTipMap[row.label]" placement="right" trigger="hover">
                    <div class="threshold-label-wrap">
                      <span class="simplified-comp-label" style="min-width: unset">
                        {{ row.label }}
                      </span>
                      <el-icon class="threshold-info-icon"><InfoFilled /></el-icon>
                    </div>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="3 次" prop="a3" align="center" min-width="16">
                <template #default="{ row }">
                  {{ row.a3 }}
                </template>
              </el-table-column>
              <el-table-column label="2 次" prop="a2" align="center" min-width="16">
                <template #default="{ row }">
                  {{ row.a2 }}
                </template>
              </el-table-column>
              <el-table-column label="1 次" prop="a1" align="center" min-width="16">
                <template #default="{ row }">
                  {{ row.a1 }}
                </template>
              </el-table-column>
              <el-table-column label="0 次" prop="a0" align="center" min-width="16">
                <template #default="{ row }">
                  {{ row.a0 }}
                </template>
              </el-table-column>
            </el-table>

            <div class="simplified-comparison">
              <div class="simplified-comp-row simplified-comp-header">
                <span class="simplified-comp-label" />
                <span class="simplified-comp-value">奖励期望</span>
                <span v-if="showEuColumn" class="advice-sep">|</span>
                <span v-if="showEuColumn" class="simplified-comp-value">期望效用</span>
              </div>
              <div class="simplified-comp-row simplified-efficiency-row">
                <span class="simplified-comp-label">简化策略比例</span>
                <span class="simplified-comp-value"
                  >{{ (simplifiedStrategyResult.rewardEfficiency * 100).toFixed(2) }}%</span
                >
                <span v-if="showEuColumn" class="advice-sep">|</span>
                <span v-if="showEuColumn" class="simplified-comp-value"
                  >{{ (simplifiedStrategyResult.euEfficiency * 100).toFixed(2) }}%</span
                >
              </div>
              <div class="simplified-comp-row">
                <span class="simplified-comp-label">简化策略</span>
                <span class="simplified-comp-value">{{
                  formatDecimal(simplifiedStrategyResult.optimalReward)
                }}</span>
                <span v-if="showEuColumn" class="advice-sep">|</span>
                <span v-if="showEuColumn" class="simplified-comp-value">{{
                  formatDecimal(simplifiedStrategyResult.optimalEu)
                }}</span>
              </div>
              <div class="simplified-comp-row">
                <span class="simplified-comp-label">最优策略</span>
                <span class="simplified-comp-value">{{
                  formatDecimal(simplifiedStrategyResult.dpReward)
                }}</span>
                <span v-if="showEuColumn" class="advice-sep">|</span>
                <span v-if="showEuColumn" class="simplified-comp-value">{{
                  formatDecimal(simplifiedStrategyResult.dpEu)
                }}</span>
              </div>
              <div v-if="rewardMaximizingStrategy" class="simplified-comp-row">
                <span class="simplified-comp-label">简化策略最大奖励</span>
                <span class="simplified-comp-value">{{
                  formatDecimal(rewardMaximizingStrategy.reward)
                }}</span>
                <span v-if="showEuColumn" class="advice-sep">|</span>
                <span v-if="showEuColumn" class="simplified-comp-value"> - </span>
              </div>
            </div>

            <el-collapse style="margin-top: 8px">
              <el-collapse-item title="查看全部组合">
                <el-table
                  :data="allStrategiesTableData"
                  size="small"
                  style="width: 100%; font-size: 12px"
                  :row-class-name="allStrategiesRowClassName"
                  :default-sort="{ prop: 'eu', order: 'descending' }"
                  height="400"
                >
                  <el-table-column label="a3" prop="a3" width="60" sortable align="center" />
                  <el-table-column label="a2" prop="a2" width="60" sortable align="center" />
                  <el-table-column label="a1" prop="a1" width="60" sortable align="center" />
                  <el-table-column label="a0" prop="a0" width="60" sortable align="center" />
                  <el-table-column label="奖励期望" prop="reward" sortable align="right">
                    <template #default="{ row }">
                      <span :class="{ 'simplified-all-optimal': row.isOptimal }">{{
                        formatDecimal(row.reward)
                      }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    v-if="showEuColumn"
                    label="期望效用"
                    prop="eu"
                    sortable
                    align="right"
                  >
                    <template #default="{ row }">
                      <span :class="{ 'simplified-all-optimal': row.isOptimal }">{{
                        formatDecimal(row.eu)
                      }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="奖励比例"
                    prop="rewardRateDisplay"
                    sortable
                    align="right"
                    width="130"
                  />
                  <el-table-column
                    v-if="showEuColumn"
                    label="效用比例"
                    prop="euRateDisplay"
                    sortable
                    align="right"
                    width="130"
                  />
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </template>
          <el-empty
            v-else-if="!solverLoading"
            description="请先配置铭牌库和奖励表"
            :image-size="60"
          />
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue';

import { useSwordmancyGameState } from './composables/useSwordmancyGameState';

const {
  hasWarning,
  currentAdvice,
  euAdvice,
  decisionAction,
  decisionPrefix,
  showEuColumn,
  perLevelAdvice,
  rewardMaximizingStrategy,
  distributionTableData,
  solverLoading,
  simplifiedStrategyResult,
  thresholdRowData,
  allStrategiesTableData,
} = useSwordmancyGameState();

/** 阈值标签提示文本映射 */
const labelTipMap: Record<string, string> = {
  期望效用结算阈值: '简化策略中期望效用最优的策略',
  最大奖励结算阈值:
    '简化策略中奖励期望最大的策略，不随期望效用模型改变，不能体现期望效用模型的效果',
};

/** 格式化数值为固定两位小数 */
function formatDecimal(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDiff(value: number): string {
  if (Math.round(Math.abs(value) * 100) / 100 === 0) return '0.00';
  const prefix = value > 0 ? '+' : '';
  return prefix + formatDecimal(value);
}

function diffClass(value: number | null): string {
  if (value == null) return '';
  if (value > 0) return 'advice-diff-positive';
  if (value < 0) return 'advice-diff-negative';
  return '';
}

/** 调整后最优则高亮显示 */
function isEuOpt(...actions: string[]): boolean {
  if (!euAdvice.value) return false;
  return actions.includes(euAdvice.value.optimalAction);
}

/** 分布表行高亮回调 */
function distributionRowClassName({ row }: { row: any }) {
  if (row.isCurrent) return 'distribution-row-highlight';
  return '';
}

/** 全部组合表格行高亮 */
function allStrategiesRowClassName({ row }: { row: any }): string {
  if (row.isOptimal) return 'simplified-all-optimal-row';
  return '';
}
</script>

<style lang="scss" scoped>
@use './styles/EndfieldTrialOfSwordmancyCard' as *;

@include card-padding('.advice-card', '.distribution-card', '.simplified-strategy-card');
@include game-section-base;

// ── Advice ──
.advice-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advice-row {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 14px;
}

.advice-label {
  min-width: 144px;
  color: var(--el-text-color-secondary);
}

.advice-row-optimal {
  border-radius: 4px;
  font-weight: bold;
  background: var(--el-color-primary-light-8);
}

.advice-value {
  min-width: 88px;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
  text-align: right;

  &.advice-diff-positive {
    color: var(--el-color-success);
  }

  &.advice-diff-negative {
    color: var(--el-color-danger);
  }
}

.advice-sep {
  font-weight: normal;
  color: var(--el-border-color);
}

.advice-eu {
  color: var(--el-text-color-primary);
}

.advice-prob {
  min-width: 48px;
}

.advice-header {
  font-size: 14px;

  .advice-value {
    font-weight: bold;
  }
}

.advice-today-eu {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.advice-decision {
  padding: 8px 0;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;

  &.advice-draw {
    color: var(--el-color-success);
  }

  &.advice-double {
    color: var(--el-color-primary);
  }

  &.advice-stop {
    color: var(--el-text-color-primary);
  }

  &.advice-abandon {
    color: var(--el-color-danger);
  }
}

// ── Distribution ──
.distribution-empty {
  padding: 12px 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.distribution-value {
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}

.distribution-current-value {
  font-weight: bold;
  color: var(--el-color-primary);
}

.distribution-prob {
  font-variant-numeric: tabular-nums;
}

.distribution-prob-abandon {
  color: var(--el-color-danger);
}

.distribution-abandon-label {
  color: var(--el-color-danger);
}

:deep(.distribution-card .el-progress) {
  width: 100%;
}

:deep(.distribution-row-highlight) {
  font-weight: bold;
  background: var(--el-color-primary-light-8);
}

:deep(.el-table__body .distribution-row-highlight:hover .el-table__cell) {
  background: var(--el-color-primary-light-8);
}

// ── Simplified strategy ──
.simplified-strategy-card {
  margin-top: 16px;

  .simplified-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .simplified-body-loading {
    position: relative;
    min-height: 100px;
  }
}

.simplified-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.simplified-comp-row {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 14px;
}

.simplified-comp-label {
  min-width: 144px;
  color: var(--el-text-color-secondary);
}

.threshold-label-wrap {
  cursor: pointer;
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.threshold-info-icon {
  font-size: 14px;
  color: var(--el-color-info);
}

.simplified-comp-value {
  min-width: 88px;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.simplified-efficiency-row {
  border-radius: 4px;
  font-weight: bold;
  background: var(--el-color-primary-light-8);
}

.simplified-all-optimal {
  font-weight: bold;
  color: var(--el-color-primary);
}

:deep(.simplified-all-optimal-row) {
  font-weight: bold;
  background-color: var(--el-color-primary-light-8) !important;
}

@include game-section-responsive;
</style>
