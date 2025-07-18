<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, computed } from 'vue';
import type { FormInstance } from 'element-plus';

import * as mltd from './mltd-utils';

const formRef = ref<FormInstance | null>();

const form = ref({
  eventEndTime: new Date('2025-07-13 00:00:00+0900'),
  targetPt: undefined as number | undefined,

  plv: undefined as number | undefined,
  maxStamina: undefined as number | undefined,
  pt: undefined as number | undefined,
  token: undefined as number | undefined,

  boostCount: 0 as number | undefined,
  freeTokenCount: 0 as number | undefined,

  staminaMaxCount: 0,
  stamina30Count: 0,
  stamina20Count: 0,
  stamina10Count: 0,

  gainTokenTime: 6.5,
  burnTokenTime: 3,
  remainingTime: 0,
});

const result = reactive({
  ptFromBoost: computed(
    () => Math.floor(form.value.boostCount! * (2142 + (2142 * 2148) / 720) * 10) || 0,
  ),
  ptFromFreeToken: computed(
    () => Math.floor(form.value.freeTokenCount! * ((4540 * 2148) / 720)) || 0,
  ),
  ptFromRemainingToken: computed(() => Math.floor(form.value.token! * (2148 / 720)) || 0),

  currentMaxStamina: computed(() => mltd.levelToMaxStamina(form.value.plv!) || 0),
  staminaForBoost: computed(() => form.value.boostCount! * 4500 || 0),
  staminaRecover: computed(() => Math.floor(form.value.remainingTime * 24 * 12) || 0),
  staminaFromBottles: computed(
    (): number =>
      (form.value.staminaMaxCount || 0) * result.currentMaxStamina +
      (form.value.stamina30Count || 0) * 30 +
      (form.value.stamina20Count || 0) * 20 +
      (form.value.stamina10Count || 0) * 10,
  ),
  staminaFromDaily: computed(
    (): number => (2 * result.currentMaxStamina + 10 * 30) * (form.value.freeTokenCount || 0),
  ),

  ptNeeded: computed((): number => {
    const needed =
      (form.value.targetPt || 0) -
      (form.value.pt || 0) -
      (result.ptFromBoost + result.ptFromFreeToken + result.ptFromRemainingToken);
    return needed && needed > 0 ? needed : 0;
  }),
  staminaNeeded: computed((): number => {
    return Math.ceil(result.ptNeeded * (450 / (1071 + (1071 / 720) * 2148)));
  }),
  tokenNeeded: computed((): number => {
    return Math.ceil((result.staminaNeeded / 450) * 1071);
  }),

  jewelNeeded: computed((): number => {
    const res = Math.ceil(
      ((result.staminaNeeded +
        result.staminaForBoost -
        result.staminaRecover -
        result.staminaFromBottles -
        result.staminaFromDaily) /
        result.currentMaxStamina) *
        50,
    );
    return res > 0 ? res : 0;
  }),
  boostPlays: computed((): number => form.value.boostCount! * 10 || 0),
  gainTokenPlays: computed((): number => Math.ceil(result.staminaNeeded / 450) || 0),
  burnTokenPlays: computed(
    (): number =>
      Math.ceil(
        ((form.value.token ?? 0) +
          (form.value.boostCount ?? 0) * 1071 * 2 * 10 +
          (form.value.freeTokenCount ?? 0) * 4540 +
          result.tokenNeeded) /
          720,
      ) || 0,
  ),
  boostTimeSpend: computed((): number => result.boostPlays * form.value.gainTokenTime),
  gainTokenTimeSpend: computed((): number => result.gainTokenPlays * form.value.gainTokenTime),
  burnTokenTimeSpend: computed((): number => result.burnTokenPlays * form.value.burnTokenTime),
  totalTimeSpend: computed(
    (): number => result.boostTimeSpend + result.gainTokenTimeSpend + result.burnTokenTimeSpend,
  ),
});

// const calculatedFlag = ref(false);
// const calculatedForm = ref(form);

onMounted(() => {
  resetCurrentRemainingTime();
  setBoostFromRemainingTime();
});

function resetCurrentRemainingTime() {
  const remainingTime = Number(
    ((form.value.eventEndTime.getTime() - new Date().getTime()) / (1000 * 3600 * 24)).toFixed(3),
  );
  form.value.remainingTime = remainingTime;
  form.value.remainingTime = form.value.remainingTime > 0 ? form.value.remainingTime : 0;
  form.value.remainingTime = form.value.remainingTime > 13 ? 13 : form.value.remainingTime;
  return form.value.remainingTime;
}

function setBoostFromRemainingTime() {
  if (form.value.remainingTime > 0) {
    form.value.boostCount = Math.floor(form.value.remainingTime);
    form.value.freeTokenCount = form.value.boostCount;
  }
}

function handleClear() {
  formRef.value?.resetFields();
  resetCurrentRemainingTime();

  nextTick(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('mltd-anni', JSON.stringify(form.value));
    ElMessage.success('保存成功');
  } catch (error) {
    ElMessage.error('保存失败');
    throw error;
  }
}

function loadFromLocalStorage() {
  try {
    const formFromLocal = localStorage.getItem('mltd-anni');
    if (!formFromLocal) {
      ElMessage.error('读取失败：没有数据');
      return;
    }
    form.value = JSON.parse(formFromLocal || '{}');
    form.value.eventEndTime = new Date(form.value.eventEndTime);
    ElMessage.success('读取成功');
  } catch (error) {
    ElMessage.error('读取失败');
    throw error;
  }
}

function clearLocalStorage() {
  try {
    localStorage.removeItem('mltd-anni');
    ElMessage.success('清除成功');
  } catch (error) {
    ElMessage.error('清除失败');
    throw error;
  }
}

// function handleSubmit() {
//   calculatedForm.value.value = { ...form };
//   calculatedFlag.value = true;

//   nextTick(() => {
//     document.getElementById('mltd-anni-calc-result')?.scrollIntoView({ behavior: 'smooth' });
//   });
// }
</script>

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
                    :max="99999999"
                    :formatter="(value: string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                    :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')"
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
                  <span>
                    {{
                      new Intl.DateTimeFormat('ja-JP', {
                        // dateStyle: 'short',
                        // timeStyle: 'long',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short',
                        timeZone: 'Japan',
                      }).format(form.eventEndTime)
                    }}</span
                  >
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
                    :max="999"
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
                    :max="99999999"
                    :formatter="(value: string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                    :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')"
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
                    :max="999999"
                    :formatter="(value: string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                    :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')"
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
                    :max="13"
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
                    :max="13"
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
                    :max="9999"
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
                    :max="9999"
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
                    :max="9999"
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
                    :max="9999"
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
                    :max="30"
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
                    :max="30"
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
                    :max="13"
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
              <el-space wrap>
                <el-button type="primary" @click="saveToLocalStorage">保存输入到浏览器</el-button>
                <el-button @click="loadFromLocalStorage"
                  >读取缓存（需要手动重新获取剩余时间）</el-button
                >
                <el-button @click="clearLocalStorage">清除缓存</el-button>
              </el-space>
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
