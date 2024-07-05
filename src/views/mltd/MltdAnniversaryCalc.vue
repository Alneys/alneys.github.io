<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, computed } from 'vue';
import type { FormInstance } from 'element-plus';

import * as mltd from './mltd-utils';

const formRef = ref<FormInstance | null>();

const form = reactive({
  targetPt: undefined as number | undefined,

  plv: undefined as number | undefined,
  maxStamina: undefined as number | undefined,
  pt: undefined as number | undefined,
  token: undefined as number | undefined,

  boostCount: 0 as number | undefined,
  freeTokenCount: 0 as number | undefined,

  staminaMaxCount: undefined as number | undefined,
  stamina30Count: undefined as number | undefined,
  stamina20Count: undefined as number | undefined,
  stamina10Count: undefined as number | undefined,

  tokenGainTime: 7,
  tokenBurnTime: 3,
  remainingTime: 0,
});

const result = reactive({
  ptFromBoost: computed(
    () => Math.round(form.boostCount! * (2142 + (2142 * 2148) / 720) * 10) || 0,
  ),
  ptFromFreeToken: computed(() => Math.round(form.freeTokenCount! * ((4540 * 2148) / 720)) || 0),
  ptFromRemainingToken: computed(() => Math.floor(form.token! * (2148 / 720)) || 0),

  currentMaxStamina: computed(() => mltd.levelToMaxStamina(form.plv!) || 0),
  staminaForBoost: computed(() => form.boostCount! * 4500 || 0),

  ptNeeded: computed((): number => {
    const needed =
      (form.targetPt || 0) -
      (form.pt || 0) -
      (result.ptFromBoost + result.ptFromFreeToken + result.ptFromRemainingToken);
    return needed && needed > 0 ? needed : 0;
  }),
  staminaNeeded: computed((): number => {
    return Math.ceil(result.ptNeeded * (450 / (1071 + (1071 / 720) * 2148)));
  }),
  tokenNeeded: computed((): number => {
    return Math.floor((result.staminaNeeded / 450) * 1071);
  }),

  jewelNeeded: computed((): number =>
    Math.ceil(((result.staminaNeeded + result.staminaForBoost) / result.currentMaxStamina) * 50),
  ),
  boostPlays: computed((): number => form.boostCount! * 10 || 0),
  gainTokenPlays: computed((): number => Math.ceil(result.staminaNeeded / 450) || 0),
  burnTokenPlays: computed(
    (): number =>
      Math.ceil(
        ((form.token ?? 0) + (form.freeTokenCount ?? 0) * 4540 + result.tokenNeeded) / 450,
      ) || 0,
  ),
});

const calculatedFlag = ref(false);
const calculatedForm = ref(form);

onMounted(() => {
  resetCurrentRemainingTime();
  form.targetPt = 5000000;
  form.pt = 1903752;
  form.plv = 541;
  form.token = 115548;
});

function resetCurrentRemainingTime() {
  const remainingTime = Number(
    (
      (new Date('2024-07-12 23:59:59+0900').getTime() - new Date().getTime()) /
      (1000 * 3600 * 24)
    ).toFixed(2),
  );
  form.remainingTime = remainingTime > 0 ? remainingTime : 0;
  if (remainingTime > 0) {
    form.boostCount = Math.floor(remainingTime);
    form.freeTokenCount = form.boostCount;
  }
  return form.remainingTime;
}

function handleClear() {
  formRef.value?.resetFields();
  resetCurrentRemainingTime();
  calculatedFlag.value = false;

  nextTick(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function handleSubmit() {
  calculatedForm.value = { ...form };
  calculatedFlag.value = true;

  nextTick(() => {
    document.getElementById('mltd-anni-calc-result')?.scrollIntoView({ behavior: 'smooth' });
  });
}
</script>

<template>
  <div id="view-mltd-anni-calc">
    <h1 class="view-title">偶像大师百万现场 周年活动计算器</h1>
    <div class="al-divider"></div>
    <div id="mltd-anni-calc-form">
      <el-row :gutter="16">
        <el-col :lg="12" :sm="24">
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
                    :max="99999999"
                    type="number"
                    inputmode="numeric"
                  >
                    <template #append>pt</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <h2>当前活动状况</h2>
            <el-row :gutter="16">
              <el-col :span="8" :xs="24">
                <el-form-item label="当前等级" prop="level">
                  <el-input
                    v-model.number="form.plv"
                    :min="1"
                    :max="999"
                    type="number"
                    inputmode="numeric"
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
                    :max="99999999"
                    type="number"
                    inputmode="numeric"
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
                    :max="999999"
                    type="number"
                    inputmode="numeric"
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
                    :max="13"
                    type="number"
                    inputmode="numeric"
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
                    :max="13"
                    type="number"
                    inputmode="numeric"
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
                    :max="9999"
                    type="number"
                    inputmode="numeric"
                    disabled
                    placeholder="开发中"
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
                    :max="9999"
                    type="number"
                    inputmode="numeric"
                    disabled
                    placeholder="开发中"
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
                    :max="9999"
                    type="number"
                    inputmode="numeric"
                    disabled
                    placeholder="开发中"
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
                    :max="9999"
                    type="number"
                    inputmode="numeric"
                    disabled
                    placeholder="开发中"
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
                <el-form-item label="单轮攒道具时间" prop="tokenGainTime">
                  <el-input
                    v-model.number="form.tokenGainTime"
                    :min="0"
                    :max="13"
                    type="number"
                    inputmode="decimal"
                  >
                    <template #append>分钟</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="单轮清道具时间" prop="tokenBurnTime">
                  <el-input
                    v-model.number="form.tokenBurnTime"
                    :min="0"
                    :max="13"
                    type="number"
                    inputmode="decimal"
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
                    :max="13"
                    type="number"
                    inputmode="decimal"
                  >
                    <template #append>天</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label=" ">
              <!-- <el-button type="primary" @click="handleSubmit">开始计算</el-button> -->
              <el-button @click="handleClear">清空</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="0.1" class="hidden-sm-and-down">
          <div class="al-divider-vertical" style="margin: 0 0.5%"></div>
        </el-col>
        <el-col :lg="0" :sm="24">
          <div class="al-divider"></div>
        </el-col>
        <el-col :lg="11" :sm="24">
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
                </tr>
              </thead>
              <tbody>
                <tr style="color: red">
                  <td>需要钻石数量</td>
                  <td style="font-weight: 700">
                    {{ result.jewelNeeded ?? '?' }}
                  </td>
                </tr>
                <tr>
                  <td>火攒道具次数</td>
                  <td>{{ result.boostPlays ?? '?' }}</td>
                </tr>
                <tr>
                  <td>普通攒道具次数</td>
                  <td>{{ result.gainTokenPlays ?? '?' }}</td>
                </tr>
                <tr>
                  <td>清道具次数</td>
                  <td>{{ result.burnTokenPlays ?? '?' }}</td>
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
                  <td>{{ result.ptFromBoost }}</td>
                </tr>
                <tr>
                  <td>来自于白给道具的pt</td>
                  <td>{{ result.ptFromFreeToken }}</td>
                </tr>
                <tr>
                  <td>来自于剩余道具的pt</td>
                  <td>{{ result.ptFromRemainingToken }}</td>
                </tr>
                <tr style="color: red">
                  <td>还需要获得pt</td>
                  <td>{{ result.ptNeeded }}</td>
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
                  <td>{{ result.ptNeeded }}</td>
                </tr>
                <tr>
                  <td>还需要体力</td>
                  <td>{{ result.staminaNeeded }}</td>
                  <td>不包含火消耗的体力</td>
                </tr>
                <tr>
                  <td>还需要获取道具</td>
                  <td>{{ result.tokenNeeded }}</td>
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
                  <td>{{ result.currentMaxStamina ?? '?' }}</td>
                </tr>
                <tr>
                  <td>火攒道具消耗体力</td>
                  <td>{{ result.staminaForBoost ?? '?' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

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
    font-family: monospace;
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
