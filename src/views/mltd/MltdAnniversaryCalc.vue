<template>
  <div id="view-mltd-anni-calc">
    <div class="view-title">
      <h1>偶像大师百万现场 周年活动计算器</h1>
    </div>
    <div class="al-divider"></div>
    <div id="mltd-anni-calc-form">
      <el-row :gutter="16">
        <el-col :lg="14" :sm="24">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="auto"
            label-position="top"
            style="max-width: 800px"
          >
            <h2>活动目标</h2>
            <el-row :gutter="16">
              <el-col :span="8" :xs="24">
                <el-form-item label="目标pt" prop="targetPt">
                  <el-input
                    v-model.number="form.targetPt"
                    :min="0"
                    :max="MLTD.maxTargetPt"
                    maxlength="8"
                    step="1000"
                    type="number"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>pt</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="16" :xs="24">
                <el-form-item label="活动结束时间" prop="eventEndTime">
                  <el-date-picker
                    v-model="form.eventEndTime"
                    type="datetime"
                    format="YYYY/MM/DD[T]HH:mm:ssZ"
                    date-format="YYYY/MM/DD"
                    time-format="HH:mm:ssZ"
                    :clearable="false"
                    style="width: 100%"
                    @change="resetCurrentRemainingTime"
                  />
                </el-form-item>
                <div style="margin-left: 12px">
                  <span style="display: inline-block; width: 24px">→</span>
                  <span>{{ formattedEventEndTime }}</span>
                </div>
              </el-col>
            </el-row>

            <h2>当前活动状况</h2>
            <el-row :gutter="16">
              <el-col :span="8" :xs="24">
                <el-form-item label="当前等级" prop="plv">
                  <el-input
                    v-model.number="form.plv"
                    :min="1"
                    :max="MLTD.maxLevel"
                    type="number"
                    inputmode="numeric"
                    placeholder="1"
                  >
                    <template #prepend>PLv</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="当前pt" prop="pt">
                  <el-input
                    v-model.number="form.pt"
                    :min="0"
                    :max="MLTD.maxTargetPt"
                    maxlength="8"
                    type="number"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>pt</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="当前道具数" prop="tokens">
                  <el-input
                    v-model.number="form.tokens"
                    :min="0"
                    :max="MLTD.maxTokens"
                    maxlength="7"
                    type="number"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <h2>当前资源状况</h2>
            <el-row :gutter="16">
              <el-col :span="8" :xs="24">
                <el-form-item prop="boostCount">
                  <template #label>🔥火的个数🔥</template>
                  <el-input
                    v-model.number="form.boostCount"
                    :min="0"
                    :max="MLTD.eventTotalBoosts"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 13"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="赠送道具剩余次数" prop="freeTokenClaimCount">
                  <el-input
                    v-model.number="form.freeTokenClaimCount"
                    :min="0"
                    :max="MLTD.eventTotalDays"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 13"
                  >
                    <template #append>次</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="MAX体力瓶数量" prop="staminaMaxBottleCount">
                  <el-input
                    v-model.number="form.staminaMaxBottleCount"
                    :min="0"
                    :max="MLTD.maxStaminaBottles"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="30体力瓶数量" prop="stamina30BottleCount">
                  <el-input
                    v-model.number="form.stamina30BottleCount"
                    :min="0"
                    :max="MLTD.maxStaminaBottles"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="20体力瓶数量" prop="stamina20BottleCount">
                  <el-input
                    v-model.number="form.stamina20BottleCount"
                    :min="0"
                    :max="MLTD.maxStaminaBottles"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="10体力瓶数量" prop="stamina10BottleCount">
                  <el-input
                    v-model.number="form.stamina10BottleCount"
                    :min="0"
                    :max="MLTD.maxStaminaBottles"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-alert type="info" :closable="false">
              <p>
                🔥火：首日赠送1个🔥火，每次强制🌙休息后赠送1个🔥火（最后一天没有强制休息，不赠送火），整个活动送13个。
              </p>
              <p>
                赠送道具：每日登录活动界面给540道具，每日游玩4首推荐歌曲各一次额外给4000道具，总共4540道具。整个活动送13次。
              </p>
            </el-alert>

            <h2>🔥火使用分配</h2>
            <el-card class="boost-allocation-card">
              <el-form-item label="🔥火攒道具次数" style="margin-bottom: 0.5em">
                <el-slider
                  v-model="sliderTotalBoostAccumulatePlays"
                  :min="0"
                  :max="result.totalBoostPlaysAvailable"
                  :step="1"
                  show-input
                  :show-input-controls="false"
                  input-size="small"
                  @change="handleTotalBoostAccumulateChange"
                />
              </el-form-item>
              <el-alert
                v-if="!result.useAutoOptimize"
                type="warning"
                :closable="false"
                style="margin-top: 8px"
              >
                <strong>⚠️ 当前为手动模式</strong
                >，🔥火使用分配可能并非最优解。点击下方"自动优化"按钮可恢复自动计算。
              </el-alert>
              <el-alert
                v-if="result.isBoostConsumeTokensInsufficient"
                type="warning"
                :closable="false"
                style="margin-top: 8px"
              >
                ⚠️ 当前道具不足以支持全部🔥火清道具次数！需要额外道具
                {{
                  formatNumber(
                    result.boostConsumePlays * MLTD.tokensPerConsumePlay -
                      result.tokensFromFixedSources -
                      result.tokensFromBoostAccumulate,
                  )
                }}
                个。
              </el-alert>
              <el-row :gutter="16" style="margin-top: 12px">
                <el-col :span="12">
                  <el-button @click="applyOptimalAllocation" :disabled="result.useAutoOptimize">
                    自动优化
                  </el-button>
                  <span v-if="result.useAutoOptimize" class="auto-mode-hint"
                    >（当前：自动优化模式）</span
                  >
                </el-col>
              </el-row>
              <el-alert type="info" :closable="false" style="margin-top: 12px">
                <template #title>
                  <strong>火分配详情</strong>
                </template>
                <p class="font-mono">
                  🔥火攒道具 {{ result.totalBoostAccumulatePlays }}次 → +{{
                    formatNumber(result.ptFromBoostAccumulate)
                  }}pt, +{{ formatNumber(result.tokensFromBoostAccumulate) }}道具
                </p>
                <p class="font-mono">
                  🔥火清道具 {{ result.boostConsumePlays }}次 → +{{
                    formatNumber(result.ptFromBoostConsume)
                  }}pt, -{{ formatNumber(result.tokensConsumedByBoost) }}道具
                </p>
                <p
                  v-if="result.useAutoOptimize && result.optimalUnusedBoostPlays > 0"
                  class="font-mono"
                >
                  🔥未使用火 {{ result.optimalUnusedBoostPlays }}次（pt需求较少时节省）
                </p>
                <p class="font-mono total">
                  <strong>合计</strong> → +{{
                    formatNumber(
                      (result.ptFromBoostAccumulate ?? 0) + (result.ptFromBoostConsume ?? 0),
                    )
                  }}pt,
                  <template
                    v-if="
                      (result.tokensFromBoostAccumulate ?? 0) -
                        (result.tokensConsumedByBoost ?? 0) >=
                      0
                    "
                    >+</template
                  >{{
                    formatNumber(
                      (result.tokensFromBoostAccumulate ?? 0) - (result.tokensConsumedByBoost ?? 0),
                    )
                  }}道具
                </p>
              </el-alert>
            </el-card>

            <h2>时间设置</h2>
            <el-row :gutter="16">
              <el-col :span="8" :xs="24">
                <el-form-item label="单轮攒道具时间" prop="tokenAccumulateTime">
                  <el-input
                    v-model.number="form.tokenAccumulateTime"
                    :min="0"
                    :max="MLTD.maxTimeMinutes"
                    :step="0.1"
                    type="number"
                    inputmode="decimal"
                    placeholder="可以输入小数"
                  >
                    <template #append>分钟</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="单轮清道具时间" prop="tokenConsumeTime">
                  <el-input
                    v-model.number="form.tokenConsumeTime"
                    :min="0"
                    :max="MLTD.maxTimeMinutes"
                    :step="0.1"
                    type="number"
                    inputmode="decimal"
                    placeholder="可以输入小数"
                  >
                    <template #append>分钟</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="剩余时间" prop="remainingTime">
                  <el-input
                    v-model.number="form.remainingTime"
                    :min="0"
                    :max="MLTD.eventTotalDays"
                    :step="0.1"
                    type="number"
                    inputmode="decimal"
                    placeholder="可以自动获取"
                  >
                    <template #append>天</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label=" ">
              <el-space wrap>
                <!-- <el-button type="primary" @click="handleSubmit">开始计算</el-button> -->
                <el-button @click="handleClear">重置</el-button>
                <el-button @click="resetCurrentRemainingTime">重新获取剩余时间</el-button>
              </el-space>
            </el-form-item>
            <el-form-item label=" ">
              <MltdAnniversaryCalcStateManager
                :save-to-local-storage="saveToLocalStorage"
                :load-from-local-storage="loadFromLocalStorage"
                :clear-local-storage="clearLocalStorage"
              />
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="0.1" class="hidden-sm-and-down">
          <div class="al-divider-vertical" style="margin: 0 0.5%"></div>
        </el-col>
        <el-col :lg="0" :sm="24">
          <div class="al-divider"></div>
        </el-col>
        <el-col :lg="9" :sm="24">
          <div id="mltd-anni-calc-result" style="margin-bottom: 2em">
            <h2>结果</h2>
            <el-alert
              v-if="!result.useAutoOptimize"
              type="warning"
              :closable="false"
              style="margin-bottom: 1em"
            >
              ⚠️ 当前为手动模式，🔥火使用分配可能并非最优解。
            </el-alert>
            <el-alert
              :type="result.ptExceeded > PT_EXCEEDED_WARNING_THRESHOLD ? 'error' : 'warning'"
              :closable="false"
              style="margin-bottom: 1em"
            >
              当前实际获得的pt将超过目标pt
              {{ result.ptExceeded.toLocaleString('en-US') }} pt
            </el-alert>
            <el-card class="mltd-anni-result-card" shadow="never">
              <template #header>关键信息</template>
              <el-table
                :data="keyInfoTableData"
                border
                :span-method="keyInfoSpanMethod"
                :row-class-name="highlightRowClassName"
                :cell-class-name="monoCellClassName"
              >
                <el-table-column prop="item" label="项目" header-align="center" align="center" />
                <el-table-column prop="value" label="结果" header-align="center" align="right">
                  <template #default="{ row }">
                    <span :class="{ 'highlight-value': row.highlight }">{{ row.value }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="time"
                  label="时间（分钟）"
                  header-align="center"
                  align="right"
                />
              </el-table>
            </el-card>

            <el-card class="mltd-anni-result-card" shadow="never">
              <template #header>当前 pt / 道具情况</template>
              <el-table
                :data="ptStatusTableData"
                border
                :row-class-name="highlightRowClassName"
                :cell-class-name="monoCellClassName"
              >
                <el-table-column prop="item" label="项目" header-align="center" align="center" />
                <el-table-column prop="pt" label="pt 变动" header-align="center" align="right" />
                <el-table-column
                  prop="token"
                  label="道具变动"
                  header-align="center"
                  align="right"
                />
              </el-table>
            </el-card>
            <el-card class="mltd-anni-result-card" shadow="never">
              <template #header>体力情况</template>
              <el-table
                :data="staminaTableData"
                border
                :row-class-name="highlightRowClassName"
                :cell-class-name="monoCellClassName"
              >
                <el-table-column prop="item" label="项目" header-align="center" align="center" />
                <el-table-column prop="value" label="结果" header-align="center" align="right" />
              </el-table>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed, useTemplateRef } from 'vue';

import MltdAnniversaryCalcStateManager from './components/MltdAnniversaryCalcStateManager.vue';
import { useMltdAnniversaryCalc, createDefaultForm } from './composables/useMltdAnniversaryCalc';
import { MLTD_ANNIVERSARY_CONSTANTS as MLTD } from './data/MltdAnniversaryConstants.ts';
import type { AnniversaryForm } from './utils/MltdTypes.ts';

const PT_EXCEEDED_WARNING_THRESHOLD = 10000;

const form = ref<AnniversaryForm>(createDefaultForm());

const rules = {
  targetPt: [{ type: 'number', min: 0, max: MLTD.maxTargetPt, message: '请输入有效的目标pt' }],
  plv: [{ type: 'number', min: 1, max: MLTD.maxLevel, message: '请输入有效的等级' }],
  pt: [{ type: 'number', min: 0, max: MLTD.maxTargetPt, message: '请输入有效的当前pt' }],
  tokens: [{ type: 'number', min: 0, max: MLTD.maxTokens, message: '请输入有效的道具数' }],
  boostCount: [
    { type: 'number', min: 0, max: MLTD.eventTotalBoosts, message: '请输入有效的火数量' },
  ],
  freeTokenClaimCount: [
    { type: 'number', min: 0, max: MLTD.eventTotalDays, message: '请输入有效的赠送道具次数' },
  ],
  staminaMaxBottleCount: [
    { type: 'number', min: 0, max: MLTD.maxStaminaBottles, message: '请输入有效的体力瓶数量' },
  ],
  stamina30BottleCount: [
    { type: 'number', min: 0, max: MLTD.maxStaminaBottles, message: '请输入有效的体力瓶数量' },
  ],
  stamina20BottleCount: [
    { type: 'number', min: 0, max: MLTD.maxStaminaBottles, message: '请输入有效的体力瓶数量' },
  ],
  stamina10BottleCount: [
    { type: 'number', min: 0, max: MLTD.maxStaminaBottles, message: '请输入有效的体力瓶数量' },
  ],
  tokenAccumulateTime: [
    { type: 'number', min: 0, max: MLTD.maxTimeMinutes, message: '请输入有效的时间' },
  ],
  tokenConsumeTime: [
    { type: 'number', min: 0, max: MLTD.maxTimeMinutes, message: '请输入有效的时间' },
  ],
  remainingTime: [
    { type: 'number', min: 0, max: MLTD.eventTotalDays, message: '请输入有效的剩余天数' },
  ],
};

const {
  result,
  resetCurrentRemainingTime,
  setBoostFromRemainingTime,
  applyOptimalAllocation,
  setUserTotalBoostAccumulatePlays,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} = useMltdAnniversaryCalc(form);

const formRef = useTemplateRef('formRef');

function formatNumber(n?: number | string): string {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString('en-US') : '0';
}

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
  timeZone: 'Japan',
});

const formattedEventEndTime = computed(() => dateTimeFormatter.format(form.value.eventEndTime));

const sliderTotalBoostAccumulatePlays = computed({
  get: () => result.totalBoostAccumulatePlays,
  set: (val) => setUserTotalBoostAccumulatePlays(val),
});

function handleTotalBoostAccumulateChange(val: number | number[]) {
  if (typeof val === 'number') {
    setUserTotalBoostAccumulatePlays(val);
  }
}

const keyInfoTableData = computed(() => [
  {
    item: '需要钻石数量',
    value: formatNumber(result.jewelNeeded),
    time: '/',
    highlight: true,
  },
  {
    item: '🔥火攒道具次数',
    value: formatNumber(result.totalBoostAccumulatePlays),
    time: `${result.boostTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '🔥火清道具次数',
    value: formatNumber(result.boostConsumePlays),
    time: `${result.boostConsumeTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '普通攒道具次数',
    value: formatNumber(result.normalAccumulatePlays),
    time: `${result.normalAccumulateTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '普通清道具次数',
    value: formatNumber(result.normalConsumePlays),
    time: `${result.normalConsumeTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '总攒道具次数',
    value: formatNumber(result.totalTokenAccumulatePlays),
    time: `${result.totalTokenAccumulateTimeSpent?.toFixed(2) ?? '?'}分钟`,
    highlight: true,
  },
  {
    item: '总清道具次数',
    value: formatNumber(result.totalTokenConsumePlays),
    time: `${result.totalConsumeTimeSpent?.toFixed(2) ?? '?'}分钟`,
    highlight: true,
  },
  {
    item: '总次数',
    value: formatNumber(result.totalPlays),
    time: `${result.totalTimeSpent.toFixed(2)}分钟 / ${(result.totalTimeSpent / 60).toFixed(2)}小时`,
    highlight: true,
  },
  {
    item: '平均每日所需时间',
    value:
      (form.value.remainingTime || 0) >= 1
        ? `${(result.totalTimeSpent / (form.value.remainingTime || 1)).toFixed(2)}分钟 / ${(result.totalTimeSpent / (form.value.remainingTime || 1) / 60).toFixed(2)}小时`
        : '-',
    time: '',
    colSpan: true,
    highlight: true,
  },
]);

const ptStatusTableData = computed(() => {
  const tokensConsumedByNormalConsume = result.normalConsumePlays * MLTD.tokensPerConsumePlay;
  return [
    {
      item: '最终结果',
      pt: `${formatNumber((form.value.pt || 0) + (result.ptTotalFromOperations || 0))} pt`,
      token: `${formatNumber(result.finalTokensRemaining)} 个`,
      highlight: true,
    },
    {
      item: '当前状态',
      pt: `${formatNumber(form.value.pt || 0)} pt`,
      token: `${formatNumber(form.value.tokens || 0)} 个`,
    },
    {
      item: '来自登录赠送',
      pt: '-',
      token: `+${formatNumber(result.tokensFromLogin)} 个`,
    },
    {
      item: '来自推荐歌曲赠送',
      pt: '-',
      token: `+${formatNumber(result.tokensFromRecommendedBonus)} 个`,
    },
    {
      item: '🔥火攒道具',
      pt: `+${formatNumber(result.ptFromBoostAccumulate)} pt`,
      token: `+${formatNumber(result.tokensFromBoostAccumulate)} 个`,
    },
    {
      item: '🔥火清道具',
      pt: `+${formatNumber(result.ptFromBoostConsume)} pt`,
      token: `-${formatNumber(result.tokensConsumedByBoost)} 个`,
    },
    {
      item: '普通攒道具',
      pt: `+${formatNumber(result.ptFromNormalAccumulate)} pt`,
      token: `+${formatNumber(result.tokensFromNormalAccumulate)} 个`,
    },
    {
      item: '普通清道具',
      pt: `+${formatNumber(result.ptFromNormalConsume)} pt`,
      token: `-${formatNumber(tokensConsumedByNormalConsume)} 个`,
    },
  ];
});

const staminaTableData = computed(() => [
  {
    item: '最大体力',
    value: formatNumber(result.currentMaxStamina),
  },
  {
    item: '🔥火攒道具消耗体力',
    value: formatNumber(result.staminaForBoostAccumulate),
  },
  {
    item: '普通攒道具消耗体力',
    value: formatNumber(result.staminaForNormalAccumulate),
  },
  {
    item: '总消耗体力',
    value: formatNumber(result.totalStaminaNeeded),
    highlight: true,
  },
  {
    item: '自然回复体力',
    value: formatNumber(result.staminaRecovered),
  },
  {
    item: '每日任务回复体力',
    value: formatNumber(result.staminaFromDaily),
  },
  {
    item: '体力瓶回复体力',
    value: formatNumber(result.staminaFromBottles),
  },
  {
    item: '需要额外体力',
    value: result.extraStaminaNeeded > 0 ? formatNumber(result.extraStaminaNeeded) : '0',
    highlight: true,
  },
  {
    item: '需要回满次数',
    value: formatNumber(result.fullStaminaRecoveriesNeeded),
  },
]);

function keyInfoSpanMethod({ row, columnIndex }: { row: any; columnIndex: number }) {
  if (row.colSpan && columnIndex === 1) {
    return [1, 2];
  }
  if (row.colSpan && columnIndex === 2) {
    return [0, 0];
  }
}

function highlightRowClassName({ row }: { row: any }) {
  if (row.highlight) return 'highlight-row';
  return '';
}

function monoCellClassName({ column }: { column: any }) {
  const monoColumnProps = ['value', 'time', 'pt', 'token'];
  if (monoColumnProps.includes(column.property)) return 'font-mono';
  return '';
}

onMounted(() => {
  resetCurrentRemainingTime();
  setBoostFromRemainingTime();
});

function handleClear() {
  formRef.value?.resetFields();
  resetCurrentRemainingTime();
  applyOptimalAllocation();

  nextTick(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}
</script>

<style lang="scss" scoped>
.boost-allocation-card {
  --el-card-padding: 16px;

  margin-bottom: 1em;

  :deep(.el-slider) {
    .el-slider__runway {
      height: 8px;
    }

    .el-slider__bar {
      height: 8px;
    }

    .el-slider__button {
      width: 16px;
      height: 16px;
    }

    .el-input-number {
      width: 80px;
    }
  }

  .slider-hint {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .auto-mode-hint {
    margin-left: 8px;
    font-size: 14px;
    color: var(--el-color-success);
  }

  .total {
    margin-bottom: 0.5em;
    padding-top: 8px;
    border-top: 1px dashed var(--el-border-color-darker);
  }
}

.mltd-anni-result-card {
  --border-color: var(--el-border-color);

  margin-bottom: 1em;

  :deep(.el-card__header) {
    padding: 8px;
    border-top: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    border-bottom: none;
    border-left: 1px solid var(--border-color);
    font-weight: bold;
    line-height: 23px;
    color: var(--el-text-color-primary);
    text-align: center;
    background-color: var(--el-color-primary-light-3);
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    --el-table-border-color: var(--border-color);
    --el-table-text-color: var(--el-text-color-primary);
    --el-table-header-text-color: var(--el-text-color-primary);

    .el-table__header th {
      background-color: var(--el-color-primary-light-3);
    }

    .el-table__row--striped .el-table__cell {
      background-color: var(--el-fill-color-light);
    }

    .el-table__cell {
      min-width: 80px;
      padding: 8px 10px;
    }

    .font-mono {
      font-family: var(--al-font-family-mono);
    }
  }

  :deep(.highlight-row) {
    color: var(--el-color-danger);

    .el-table__cell {
      font-weight: bold;
    }
  }

  :deep(.highlight-value) {
    font-weight: bold;
  }
}
</style>
