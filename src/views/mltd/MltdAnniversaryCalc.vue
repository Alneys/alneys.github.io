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
                    :max="ANNIVERSARY_CONSTANTS.MAX_TARGET_PT"
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
                    :max="ANNIVERSARY_CONSTANTS.MAX_LEVEL"
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
                    :max="ANNIVERSARY_CONSTANTS.MAX_TARGET_PT"
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
                <el-form-item label="当前道具数" prop="token">
                  <el-input
                    v-model.number="form.token"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.MAX_TOKENS"
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
                    :max="ANNIVERSARY_CONSTANTS.EVENT_TOTAL_BOOSTS"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 13"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="白给道具剩余次数" prop="freeTokenCount">
                  <el-input
                    v-model.number="form.freeTokenCount"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 13"
                  >
                    <template #append>次</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="MAX体力瓶数量" prop="staminaMaxCount">
                  <el-input
                    v-model.number="form.staminaMaxCount"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.MAX_STAMINA_BOTTLES"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="30体力瓶数量" prop="stamina30Count">
                  <el-input
                    v-model.number="form.stamina30Count"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.MAX_STAMINA_BOTTLES"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="20体力瓶数量" prop="stamina20Count">
                  <el-input
                    v-model.number="form.stamina20Count"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.MAX_STAMINA_BOTTLES"
                    type="number"
                    inputmode="numeric"
                    placeholder="0 - 9999"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="0">
                <el-form-item label="10体力瓶数量" prop="stamina10Count">
                  <el-input
                    v-model.number="form.stamina10Count"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.MAX_STAMINA_BOTTLES"
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
                <el-form-item label="单轮（攒450票+清票）攒道具时间" prop="tokenGainTime">
                  <el-input
                    v-model.number="form.gainTokenTime"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.MAX_TIME_MINUTES"
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
                <el-form-item label="单轮清道具时间" prop="tokenBurnTime">
                  <el-input
                    v-model.number="form.burnTokenTime"
                    :min="0"
                    :max="ANNIVERSARY_CONSTANTS.MAX_TIME_MINUTES"
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
                    :max="ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS"
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
            <table class="mltd-anni-result-table">
              <caption>
                关键信息
              </caption>
              <thead>
                <tr>
                  <th scope="col">项目</th>
                  <th scope="col">结果</th>
                  <th scope="col">时间（分钟）</th>
                </tr>
              </thead>
              <tbody>
                <tr style="color: red; font-size: var(--el-font-size-large)">
                  <td>需要钻石数量</td>
                  <td style="font-weight: 700">
                    {{ result.jewelNeeded.toLocaleString('en-US') ?? '?' }}
                  </td>
                  <td style="color: black; text-align: center">/</td>
                </tr>
                <tr>
                  <td>火攒道具次数</td>
                  <td>{{ result.boostPlays.toLocaleString('en-US') ?? '?' }}</td>
                  <td style="text-align: right" class="font-mono">
                    {{ result.boostTimeSpend.toFixed(2) ?? '?' }}分钟
                  </td>
                </tr>
                <tr>
                  <td>普通攒道具次数</td>
                  <td>{{ result.gainTokenPlays.toLocaleString('en-US') ?? '?' }}</td>
                  <td style="text-align: right" class="font-mono">
                    {{ result.gainTokenTimeSpend.toFixed(2) ?? '?' }}分钟
                  </td>
                </tr>
                <tr>
                  <td>清道具次数</td>
                  <td>{{ result.burnTokenPlays.toLocaleString('en-US') ?? '?' }}</td>
                  <td style="text-align: right" class="font-mono">
                    {{ result.burnTokenTimeSpend.toFixed(2) ?? '?' }}分钟
                  </td>
                </tr>
                <tr>
                  <td>所有项目总时间</td>
                  <td colspan="2" style="text-align: center">
                    {{ result.totalTimeSpend.toFixed(2) }}分钟 /
                    {{ (result.totalTimeSpend / 60).toFixed(2) }}小时
                  </td>
                </tr>
                <tr>
                  <td>平均每日所需时间</td>
                  <td colspan="2" style="text-align: center">
                    <template v-if="form.remainingTime >= 1">
                      {{ (result.totalTimeSpend / form.remainingTime).toFixed(2) }}分钟 /
                      {{ (result.totalTimeSpend / form.remainingTime / 60).toFixed(2) }}小时
                    </template>
                    <template v-else>-</template>
                  </td>
                </tr>
              </tbody>
            </table>
            <table class="mltd-anni-result-table">
              <caption>
                当前pt情况
              </caption>
              <thead>
                <tr>
                  <th scope="col">项目</th>
                  <th scope="col">结果</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>来自于火🔥的pt<br />（攒道具+清道具）</td>
                  <td>{{ result.ptFromBoost.toLocaleString('en-US') }}</td>
                </tr>
                <tr>
                  <td>来自于白给道具的pt</td>
                  <td>{{ result.ptFromFreeToken.toLocaleString('en-US') }}</td>
                </tr>
                <tr>
                  <td>来自于剩余道具的pt</td>
                  <td>{{ result.ptFromRemainingToken.toLocaleString('en-US') }}</td>
                </tr>
                <tr style="color: red">
                  <td>还需要获得pt</td>
                  <td>{{ result.ptNeeded.toLocaleString('en-US') }}</td>
                </tr>
              </tbody>
            </table>
            <table class="mltd-anni-result-table">
              <caption>
                还需要获得pt情况
              </caption>
              <thead>
                <tr>
                  <th scope="col">项目</th>
                  <th scope="col">结果</th>
                  <th scope="col">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr style="color: red">
                  <td>还需要额外pt</td>
                  <td>{{ result.ptNeeded.toLocaleString('en-US') }}</td>
                </tr>
                <tr>
                  <td>还需要体力</td>
                  <td>{{ result.staminaNeeded.toLocaleString('en-US') }}</td>
                  <td>不包含火消耗的体力</td>
                </tr>
                <tr>
                  <td>还需要获取道具</td>
                  <td>{{ result.tokenNeeded.toLocaleString('en-US') }}</td>
                  <td>上面体力转化的道具</td>
                </tr>
              </tbody>
            </table>
            <table class="mltd-anni-result-table">
              <caption>
                体力情况
              </caption>
              <thead>
                <tr>
                  <th scope="col">项目</th>
                  <th scope="col">结果</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>最大体力</td>
                  <td>{{ result.currentMaxStamina.toLocaleString('en-US') ?? '?' }}</td>
                </tr>
                <tr>
                  <td>火攒道具消耗体力</td>
                  <td>{{ result.staminaForBoost.toLocaleString('en-US') ?? '?' }}</td>
                </tr>
                <tr>
                  <td>自然回复体力</td>
                  <td>{{ result.staminaRecover.toLocaleString('en-US') ?? '?' }}</td>
                </tr>
                <tr>
                  <td>每日任务回复体力</td>
                  <td>{{ result.staminaFromDaily.toLocaleString('en-US') ?? '?' }}</td>
                </tr>
                <tr>
                  <td>体力瓶回复体力</td>
                  <td>{{ result.staminaFromBottles.toLocaleString('en-US') ?? '?' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue';
import type { FormInstance } from 'element-plus';

import { ANNIVERSARY_CONSTANTS } from './MltdConstant';
import {
  useAnniversaryCalc,
  createDefaultForm,
  type AnniversaryForm,
} from './composables/useAnniversaryCalc';
import MltdAnniversaryCalcStateManager from './components/MltdAnniversaryCalcStateManager.vue';

const form = ref<AnniversaryForm>(createDefaultForm());

const {
  result,
  resetCurrentRemainingTime,
  setBoostFromRemainingTime,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} = useAnniversaryCalc(form);

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
.mltd-anni-result-table {
  & {
    border: 2px solid rgb(128 128 128);
    border-collapse: collapse;
  }

  caption {
    padding: 8px;
    font-weight: bold;
  }

  thead,
  tfoot {
    background-color: rgba(map.get(im.$colors, 'miya'), 0.5);
  }

  th,
  td {
    border: 1px solid rgb(128 128 128);
    padding: 8px 10px;
    min-width: 80px;
  }

  td:first-of-type {
    text-align: center;
  }

  td:nth-of-type(2) {
    font-family: var(--al-font-family-mono) !important;
    text-align: right;
  }

  tbody > tr:nth-of-type(even) {
    background-color: rgb(237 238 242);
  }

  tfoot th {
    text-align: right;
  }

  tfoot td {
    font-weight: bold;
  }
}
</style>
