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
                <el-form-item label="白给道具剩余次数" prop="freeTokenClaimCount">
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
                🔥火：首日送1个火，每次强制休息🌙后送1个火（最后一天没有强制休息，不给火），整个活动送13个。
              </p>
              <p>
                白给道具：每日登录活动界面给540道具，每日首次打推荐歌给4000道具，总共4540道具。整个活动送13次。
              </p>
            </el-alert>

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
            <el-alert type="warning" :closable="false" style="margin-bottom: 1em">
              本计算器假设🔥火全部用于攒道具，并且🔥火全部使用完毕。
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
              <template #header>当前pt情况</template>
              <el-table
                :data="ptStatusTableData"
                border
                :row-class-name="highlightRowClassName"
                :cell-class-name="monoCellClassName"
              >
                <el-table-column prop="item" label="项目" header-align="center" align="center" />
                <el-table-column prop="value" label="结果" header-align="center" align="right" />
              </el-table>
            </el-card>
            <el-card class="mltd-anni-result-card">
              <template #header>还需要获得pt情况</template>
              <el-table
                :data="ptNeededTableData"
                border
                :row-class-name="highlightRowClassName"
                :cell-class-name="monoCellClassName"
              >
                <el-table-column prop="item" label="项目" header-align="center" align="center" />
                <el-table-column prop="value" label="结果" header-align="center" align="right" />
                <el-table-column prop="note" label="备注" header-align="center" align="center" />
              </el-table>
            </el-card>
            <el-card class="mltd-anni-result-card">
              <template #header>体力情况</template>
              <el-table :data="staminaTableData" border :cell-class-name="monoCellClassName">
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

const keyInfoTableData = computed(() => [
  {
    item: '需要钻石数量',
    value: result.jewelNeeded?.toLocaleString('en-US') ?? '?',
    time: '/',
    highlight: true,
  },
  {
    item: '火攒道具次数',
    value: result.boostPlays?.toLocaleString('en-US') ?? '?',
    time: `${result.boostTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '普通攒道具次数',
    value: result.tokenAccumulatePlays?.toLocaleString('en-US') ?? '?',
    time: `${result.tokenAccumulateTimeSpent?.toFixed(2) ?? '?'}分钟`,
  },
  {
    item: '清道具次数',
    value: result.tokenConsumePlays?.toLocaleString('en-US') ?? '?',
    time: `${result.tokenConsumeTimeSpent?.toFixed(2) ?? '?'}分钟`,
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

const ptStatusTableData = computed(() => [
  {
    item: '来自于火🔥的pt（攒道具+清道具）',
    value: result.ptFromBoost?.toLocaleString('en-US') ?? '?',
  },
  {
    item: '来自于白给道具的pt',
    value: result.ptFromFreeTokens?.toLocaleString('en-US') ?? '?',
  },
  {
    item: '来自于剩余道具的pt',
    value: result.ptFromRemainingTokens?.toLocaleString('en-US') ?? '?',
  },
  {
    item: '还需要获得pt',
    value: result.ptNeeded?.toLocaleString('en-US') ?? '?',
    highlight: true,
  },
]);

const ptNeededTableData = computed(() => [
  {
    item: '还需要额外pt',
    value: result.ptNeeded?.toLocaleString('en-US') ?? '?',
    note: '',
    highlight: true,
  },
  {
    item: '还需要体力',
    value: result.staminaNeeded?.toLocaleString('en-US') ?? '?',
    note: '不包含火消耗的体力',
  },
  {
    item: '还需要获取道具',
    value: result.tokensNeeded?.toLocaleString('en-US') ?? '?',
    note: '上面体力转化的道具',
  },
]);

const staminaTableData = computed(() => [
  {
    item: '最大体力',
    value: result.currentMaxStamina?.toLocaleString('en-US') ?? '?',
  },
  {
    item: '火攒道具消耗体力',
    value: result.staminaForBoost?.toLocaleString('en-US') ?? '?',
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
  const monoColumnProps = ['value', 'time'];
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
// :deep() {
//   /* Chrome, Safari, Edge, Opera */
//   input::-webkit-outer-spin-button,
//   input::-webkit-inner-spin-button {
//     -webkit-appearance: none;
//     margin: 0;
//   }

//   /* Firefox */
//   input[type='number'] {
//     appearance: textfield;
//   }
// }
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
