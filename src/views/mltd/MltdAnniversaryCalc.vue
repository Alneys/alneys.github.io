<template>
  <div id="view-mltd-anni-calc">
    <h1 class="view-title">偶像大师百万现场 周年活动计算器</h1>
    <div class="al-divider"></div>
    <div id="mltd-anni-calc-form">
      <el-row :gutter="16">
        <el-col :lg="14" :sm="24">
          <el-form
            ref="formRef"
            :model="form"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxTargetPt"
                    maxlength="8"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxLevel"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxTargetPt"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxTokens"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.eventTotalBoosts"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.eventTotalDays"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 13"
                  >
                    <template #append>次</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="MAX体力瓶数量" prop="staminaMaxBottleCount">
                  <el-input
                    v-model.number="form.staminaMaxBottleCount"
                    :min="0"
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxStaminaBottles"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="30体力瓶数量" prop="stamina30BottleCount">
                  <el-input
                    v-model.number="form.stamina30BottleCount"
                    :min="0"
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxStaminaBottles"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="20体力瓶数量" prop="stamina20BottleCount">
                  <el-input
                    v-model.number="form.stamina20BottleCount"
                    :min="0"
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxStaminaBottles"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="10体力瓶数量" prop="stamina10BottleCount">
                  <el-input
                    v-model.number="form.stamina10BottleCount"
                    :min="0"
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxStaminaBottles"
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
              <p>
                🔥火使用：🔥火可用于攒道具（获得双倍道具）或清道具（消耗道具获得双倍pt）。火清道具不消耗体力，适合低目标pt时使用。
              </p>
            </el-alert>

            <h2>🔥火使用分配</h2>
            <el-card class="boost-allocation-card">
              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="🔥火攒道具次数">
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
                    <div class="slider-hint">
                      每次直接获得{{
                        MLTD_ANNIVERSARY_CONSTANTS.ptPerBoostAccumulatePlay
                      }}PT，同时获得{{
                        MLTD_ANNIVERSARY_CONSTANTS.tokensPerBoostAccumulatePlay
                      }}道具
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="🔥火清道具次数">
                    <el-slider
                      v-model="sliderBoostConsumePlays"
                      :min="0"
                      :max="maxBoostConsumePlays"
                      :step="1"
                      show-input
                      :show-input-controls="false"
                      input-size="small"
                      @change="handleBoostConsumeChange"
                    />
                    <div class="slider-hint">
                      每次消耗{{ MLTD_ANNIVERSARY_CONSTANTS.tokensPerConsumePlay }}道具，获得{{
                        MLTD_ANNIVERSARY_CONSTANTS.ptPerBoostConsumePlay
                      }}PT，不消耗体力
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="boost-summary">
                    <span>剩余🔥火使用次数：</span>
                    <span class="mono"
                      >{{
                        result.totalBoostPlaysAvailable -
                        result.totalBoostAccumulatePlays -
                        result.boostConsumePlays
                      }}次</span
                    >
                  </div>
                </el-col>
                <el-col :span="12">
                  <el-button
                    size="small"
                    @click="applyOptimalAllocation"
                    :disabled="result.useAutoOptimize"
                  >
                    自动优化
                  </el-button>
                  <span v-if="!result.useAutoOptimize" class="custom-mode-hint"
                    >（当前：自定义模式）</span
                  >
                  <span v-else class="auto-mode-hint">（当前：自动优化模式）</span>
                </el-col>
              </el-row>
              <el-alert
                v-if="
                  result.totalBoostAccumulatePlays + result.boostConsumePlays >
                  result.totalBoostPlaysAvailable
                "
                type="error"
                :closable="false"
                style="margin-top: 8px"
              >
                🔥火使用次数超出限制！
              </el-alert>
              <el-row :gutter="16" style="margin-top: 8px">
                <el-col :span="24">
                  <div class="boost-preview">
                    <strong>预计收益：</strong>
                    <div class="boost-preview-detail">
                      <span class="mono">
                        🔥火攒道具 {{ result.totalBoostAccumulatePlays }}次 →
                        {{ result.ptFromBoostAccumulate?.toLocaleString('en-US') ?? 0 }}pt
                      </span>
                      <span class="mono">
                        🔥火清道具 {{ result.boostConsumePlays }}次 →
                        {{ result.ptFromBoostConsume?.toLocaleString('en-US') ?? 0 }}pt
                      </span>
                      <span class="mono total">
                        合计 →
                        {{
                          (
                            (result.ptFromBoostAccumulate ?? 0) + (result.ptFromBoostConsume ?? 0)
                          ).toLocaleString('en-US')
                        }}pt
                      </span>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </el-card>

            <h2>时间设置</h2>
            <el-row :gutter="16">
              <el-col :span="8" :xs="24">
                <el-form-item label="单轮（攒450票+清票）攒道具时间" prop="tokenAccumulateTime">
                  <el-input
                    v-model.number="form.tokenAccumulateTime"
                    :min="0"
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxTimeMinutes"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.maxTimeMinutes"
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
                    :max="MLTD_ANNIVERSARY_CONSTANTS.eventTotalDays"
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
                <el-button @click="handleClear">清空</el-button>
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
            <el-alert type="info">
              <p>TODO：</p>
              <ol style="line-height: 1.5">
                <li>详细说明</li>
                <li>更加严格地检测输入</li>
              </ol>
            </el-alert>
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
            <el-alert type="info" :closable="false" style="margin-bottom: 1em">
              根据目标pt自动计算最优🔥火分配（火攒道具+火清道具），最小化体力使用。可通过滑块自定义分配。
            </el-alert>
            <el-alert
              v-if="result.ptExceeded > 0"
              type="warning"
              :closable="false"
              style="margin-bottom: 1em"
            >
              使用最优🔥火数量后，实际获得的pt将超过目标pt
              {{ result.ptExceeded.toLocaleString('en-US') }} pt（向上取整导致）
            </el-alert>
            <el-card class="mltd-anni-result-card">
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
            <el-card class="mltd-anni-result-card">
              <template #header>🔥火使用建议</template>
              <el-table :data="boostTableData" border :cell-class-name="monoCellClassName">
                <el-table-column prop="item" label="项目" header-align="center" align="center" />
                <el-table-column prop="value" label="结果" header-align="center" align="right" />
              </el-table>
            </el-card>
            <el-card class="mltd-anni-result-card">
              <template #header>当前 pt / 道具情况</template>
              <el-table
                :data="ptStatusTableData"
                border
                :row-class-name="highlightRowClassName"
                :cell-class-name="monoCellClassName"
              >
                <el-table-column prop="item" label="项目" header-align="center" align="center" />
                <el-table-column prop="pt" label="PT 变动" header-align="center" align="right" />
                <el-table-column
                  prop="token"
                  label="道具变动"
                  header-align="center"
                  align="right"
                />
              </el-table>
            </el-card>
            <el-card class="mltd-anni-result-card">
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
import { ref, nextTick, onMounted, computed } from 'vue';
import type { FormInstance } from 'element-plus';

import { MLTD_ANNIVERSARY_CONSTANTS } from './MltdConstant';
import { useMltdAnniversaryCalc, createDefaultForm } from './composables/useMltdAnniversaryCalc';
import type { AnniversaryForm } from './MltdTypes';
import MltdAnniversaryCalcStateManager from './components/MltdAnniversaryCalcStateManager.vue';

const form = ref<AnniversaryForm>(createDefaultForm());

const {
  result,
  resetCurrentRemainingTime,
  setBoostFromRemainingTime,
  applyOptimalAllocation,
  setUserTotalBoostAccumulatePlays,
  setUserBoostConsumePlays,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} = useMltdAnniversaryCalc(form);

const formRef = ref<FormInstance | null>();

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

const sliderBoostConsumePlays = computed({
  get: () => result.boostConsumePlays,
  set: (val) => setUserBoostConsumePlays(val),
});

const maxBoostConsumePlays = computed(
  () => result.totalBoostPlaysAvailable - result.totalBoostAccumulatePlays,
);

function handleTotalBoostAccumulateChange(val: number | number[]) {
  if (typeof val === 'number') {
    setUserTotalBoostAccumulatePlays(val);
  }
}

function handleBoostConsumeChange(val: number | number[]) {
  if (typeof val === 'number') {
    setUserBoostConsumePlays(val);
  }
}

const boostTableData = computed(() => [
  {
    item: '拥有🔥火数量',
    value: `${form.value.boostCount ?? 0}个（共${result.totalBoostPlaysAvailable}次）`,
  },
  {
    item: '🔥火攒道具次数',
    value: `${result.totalBoostAccumulatePlays}次`,
    highlight: true,
  },
  {
    item: '🔥火清道具次数',
    value: `${result.boostConsumePlays}次`,
    highlight: true,
  },
  {
    item: '🔥火使用总次数',
    value: `${result.boostPlays}次`,
  },
]);

const keyInfoTableData = computed(() => [
  {
    item: '需要钻石数量',
    value: result.jewelNeeded?.toLocaleString('en-US') ?? '?',
    time: '/',
    highlight: true,
  },
  {
    item: '🔥火攒道具次数',
    value: result.totalBoostAccumulatePlays?.toLocaleString('en-US') ?? '?',
    time: `${result.boostTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '🔥火清道具次数',
    value: result.boostConsumePlays?.toLocaleString('en-US') ?? '?',
    time: `${result.boostConsumeTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '普通攒道具次数',
    value: result.normalAccumulatePlays?.toLocaleString('en-US') ?? '?',
    time: `${result.normalAccumulateTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '总攒道具次数',
    value: result.totalTokenAccumulatePlays?.toLocaleString('en-US') ?? '?',
    time: `${((result.totalTokenAccumulatePlays ?? 0) * (form.value.tokenAccumulateTime ?? 0)).toFixed(2)}分钟`,
  },
  {
    item: '普通清道具次数',
    value: result.normalConsumePlays?.toLocaleString('en-US') ?? '?',
    time: `${result.normalConsumeTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '所有项目总时间',
    value: `${result.totalTimeSpent.toFixed(2)}分钟 / ${(result.totalTimeSpent / 60).toFixed(2)}小时`,
    time: '',
    colSpan: true,
  },
  {
    item: '平均每日所需时间',
    value:
      (form.value.remainingTime ?? 0) >= 1
        ? `${(result.totalTimeSpent / (form.value.remainingTime ?? 1)).toFixed(2)}分钟 / ${(result.totalTimeSpent / (form.value.remainingTime ?? 1) / 60).toFixed(2)}小时`
        : '-',
    time: '',
    colSpan: true,
  },
]);

const ptStatusTableData = computed(() => {
  const tokensConsumedByNormalConsume =
    result.normalConsumePlays * MLTD_ANNIVERSARY_CONSTANTS.tokensPerConsumePlay;
  return [
    {
      item: '当前状态',
      pt: `${form.value.pt?.toLocaleString('en-US') ?? 0} pt`,
      token: `${form.value.tokens?.toLocaleString('en-US') ?? 0} 个`,
    },
    {
      item: '来自登录赠送',
      pt: '-',
      token: `+${result.tokensFromLogin?.toLocaleString('en-US') ?? 0} 个`,
    },
    {
      item: '来自推荐歌曲赠送',
      pt: '-',
      token: `+${result.tokensFromRecommendedBonus?.toLocaleString('en-US') ?? 0} 个`,
    },
    {
      item: '🔥火攒道具',
      pt: `+${result.ptFromBoostAccumulate?.toLocaleString('en-US') ?? 0} pt`,
      token: `+${result.tokensFromBoostAccumulate?.toLocaleString('en-US') ?? 0} 个`,
    },
    {
      item: '🔥火清道具',
      pt: `+${result.ptFromBoostConsume?.toLocaleString('en-US') ?? 0} pt`,
      token: `-${result.tokensConsumedByBoost?.toLocaleString('en-US') ?? 0} 个`,
    },
    {
      item: '普通攒道具',
      pt: `+${result.ptFromNormalAccumulate?.toLocaleString('en-US') ?? 0} pt`,
      token: `+${result.tokensFromNormalAccumulate?.toLocaleString('en-US') ?? 0} 个`,
    },
    {
      item: '普通清道具',
      pt: `+${result.ptFromNormalConsume?.toLocaleString('en-US') ?? 0} pt`,
      token: `-${tokensConsumedByNormalConsume?.toLocaleString('en-US') ?? 0} 个`,
    },
    {
      item: '汇总',
      pt: `${((form.value.pt ?? 0) + (result.ptTotalFromOperations ?? 0)).toLocaleString('en-US')} pt`,
      token: `${result.finalTokensRemaining?.toLocaleString('en-US') ?? 0} 个`,
      highlight: true,
    },
  ];
});

const staminaTableData = computed(() => {
  const extraStaminaNeeded =
    result.totalStaminaNeeded -
    result.staminaRecovered -
    result.staminaFromDaily -
    result.staminaFromBottles;
  return [
    {
      item: '最大体力',
      value: result.currentMaxStamina?.toLocaleString('en-US') ?? '?',
    },
    {
      item: '🔥火攒道具消耗体力',
      value: result.staminaForBoostAccumulate?.toLocaleString('en-US') ?? '?',
    },
    {
      item: '普通攒道具消耗体力',
      value: result.staminaForNormalAccumulate?.toLocaleString('en-US') ?? '?',
    },
    {
      item: '总消耗体力',
      value: result.totalStaminaNeeded?.toLocaleString('en-US') ?? '?',
      highlight: true,
    },
    {
      item: '自然回复体力',
      value: result.staminaRecovered?.toLocaleString('en-US') ?? '?',
    },
    {
      item: '每日任务回复体力',
      value: result.staminaFromDaily?.toLocaleString('en-US') ?? '?',
    },
    {
      item: '体力瓶回复体力',
      value: result.staminaFromBottles?.toLocaleString('en-US') ?? '?',
    },
    {
      item: '需要额外体力',
      value: extraStaminaNeeded > 0 ? extraStaminaNeeded.toLocaleString('en-US') : '0',
      highlight: true,
    },
  ];
});

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

  nextTick(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/im/im-colors.scss' as im;

.boost-allocation-card {
  margin-bottom: 1em;
  --el-card-padding: 16px;

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
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }

  .boost-summary {
    font-size: 14px;
    .mono {
      font-family: var(--al-font-family-mono);
      font-weight: bold;
    }
  }

  .custom-mode-hint {
    color: #e6a23c;
    font-size: 12px;
    margin-left: 8px;
  }

  .auto-mode-hint {
    color: #67c23a;
    font-size: 12px;
    margin-left: 8px;
  }

  .boost-preview {
    font-size: 14px;
    padding: 8px;
    background-color: rgba(map.get(im.$colors, 'miya'), 0.1);
    border-radius: 4px;

    .boost-preview-detail {
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mono {
      font-family: var(--al-font-family-mono);
    }

    .total {
      font-weight: bold;
      border-top: 1px dashed #999;
      padding-top: 4px;
      margin-top: 4px;
    }
  }
}

.mltd-anni-result-card {
  margin-bottom: 1em;
  --border-color: rgb(128 128 128);

  :deep(.el-card__header) {
    padding: 8px;
    line-height: 23px;
    font-weight: bold;
    color: black;
    text-align: center;
    background-color: rgba(map.get(im.$colors, 'miya'), 0.5);
    border-top: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    border-left: 1px solid var(--border-color);
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    --el-table-border-color: var(--border-color);
    --el-table-text-color: black;
    --el-table-header-text-color: black;

    .el-table__header th {
      background-color: rgba(map.get(im.$colors, 'miya'), 0.5);
    }

    .el-table__row--striped .el-table__cell {
      background-color: rgb(237 238 242);
    }

    .el-table__cell {
      padding: 8px 10px;
      min-width: 80px;
    }

    .font-mono {
      font-family: var(--al-font-family-mono);
    }
  }

  :deep(.highlight-row) {
    color: red;

    .el-table__cell {
      font-weight: bold;
    }
  }

  :deep(.highlight-value) {
    font-weight: bold;
  }
}
</style>
