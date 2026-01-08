<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';
import { eventTheaterChoices } from './mltd-data';

const formRef = ref<FormInstance | null>();

interface formCheckedInterface {
  eventType: number;
  targetPt: number;
  pt: number;
  token: number;
}

type formType = { [P in keyof formCheckedInterface]: formCheckedInterface[P] | undefined };

const form = reactive<formType>({
  eventType: 3,
  targetPt: undefined,
  pt: undefined,
  token: undefined,
});

const calculatedFlag = ref(false);
const calculatedForm = ref(form);

interface resultItemInterface {
  name: string;
  multiplier: string;
  value: number;
}

const parkingResult = ref<{
  flag: boolean;
  message?: string;
  result?: Array<resultItemInterface>;
}>();

function handleClear() {
  formRef.value?.resetFields();
  calculatedFlag.value = false;

  nextTick(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function handleSubmit() {
  preprocessingForm();
  calculatedForm.value = { ...form };
  if (form.eventType === 3 || form.eventType === 5) {
    parkingResult.value = calcParkingTheater(form as formCheckedInterface, form.eventType === 5);
  }
  calculatedFlag.value = true;

  nextTick(() => {
    document.getElementById('mltd-event-parking-result')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function preprocessingForm() {
  Object.keys(form).forEach((each) => {
    const key = each as keyof typeof form;
    form[key] = Number(form[key]) || 0;
  });
}

function calcParkingTheater(
  form: { targetPt: number; pt: number; token: number },
  isAnniversary = false,
): {
  flag: boolean;
  message?: string;
  result?: Array<resultItemInterface>;
} {
  if (form.pt >= form.targetPt) {
    return { flag: false, message: '当前pt已达到或超过目标pt' };
  }
  if (form.targetPt - form.pt > 10000) {
    return { flag: false, message: 'pt差距大于10000，请缩小后重试' };
  }
  const record: Record<string, number> = {};
  let flag = false;

  /**
   *
   * @param pt: pt behind target, less than 0
   * @param token: remaining token
   */
  function dfs(pt: number, token: number) {
    // result already found
    if (flag) {
      return;
    }
    // invalid state
    if (pt > 0 || token < 0) {
      return;
    }
    // result found now
    if (pt === 0) {
      flag = true;
      return;
    }
    // DFS start
    // Order: token to pt, ticket to token, stamina to token
    for (let i = 0; i < eventTheaterChoices.length; i++) {
      const each = eventTheaterChoices[i];
      // result already found
      if (flag) {
        return;
      }
      // Check anniversary only choice
      // @ts-expect-error
      if (!isAnniversary && each.anniversaryOnly === true) {
        continue;
      }
      // enough token
      // @ts-expect-error
      if (token >= -each.token) {
        // record in result
        record[i] = (record[i] ?? 0) + 1;
        // DFS
        // @ts-expect-error
        dfs(pt + each.pt, token + each.token);
        // if failed, recover result
        if (!flag) {
          record[i]! -= 1;
        }
      }
    }
    // failed
    return;
  }

  dfs(form.pt - form.targetPt, form.token);
  if (flag) {
    const result: Array<resultItemInterface> = [];
    Object.entries(record).forEach(([key, value]) => {
      if (value > 0) {
        result.push({
          // @ts-expect-error
          name: eventTheaterChoices[Number(key)].name,
          // @ts-expect-error
          multiplier: eventTheaterChoices[Number(key)].multiplier,
          value,
        });
      }
    });

    return { flag, result };
  } else {
    return { flag, message: '不存在控分方案' };
  }
}
</script>

<template>
  <div id="view-mltd-event-parking">
    <h1 class="view-title">偶像大师百万现场 活动控分计算器</h1>
    <div class="al-divider"></div>
    <div style="margin-bottom: 1em">
      <el-alert type="error" :closable="false" show-icon>
        <h2>警告：本页面正在开发中，无法保证结果的准确性！</h2>
      </el-alert>
    </div>
    <div id="mltd-event-parking-form">
      <el-row :gutter="16">
        <el-col :lg="13" :sm="24">
          <el-form
            ref="formRef"
            :model="form"
            label-width="auto"
            label-position="top"
            style="max-width: 800px"
          >
            <el-form-item label="选择活动类型">
              <el-select v-model="form.eventType">
                <el-option label="Theater / Trust" :value="3"></el-option>
                <el-option label="Anniversary" :value="5"></el-option>
                <el-option label="[开发中] Tour / Tour Bingo" :value="4" disabled></el-option>
                <el-option label="其他活动开发中" :value="0" disabled></el-option>
                <!-- 1: Showtime -->
                <!-- 2: Millicolle! -->
                <!-- 3: Theater / Trust -->
                <!-- 4: Tour / Tour Bingo -->
                <!-- 5: Anniversary -->
                <!-- 6: Working -->
                <!-- 7: April Fool -->
                <!-- 8: Game Corner -->
                <!-- 9: Millicolle! (Box Gasha) -->
                <!-- 10: Twin Stage (High Score by Song) -->
                <!-- 11: Tune -->
                <!-- 12: Twin Stage (Total High Score) -->
                <!-- 13: Tale / Time / Team -->
                <!-- 14: Talk Party -->
                <!-- 16: Treasure -->
              </el-select>
            </el-form-item>
            <el-row :gutter="16" @keyup.enter="handleSubmit">
              <el-col :span="8" :xs="24">
                <el-form-item label="目标pt" prop="targetPt">
                  <template #label><b>目标pt</b></template>
                  <el-input
                    v-model.number="form.targetPt"
                    :min="0"
                    :max="99999999"
                    :formatter="(value: string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                    :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')"
                    inputmode="numeric"
                    placeholder="100,000"
                  >
                    <template #append>pt</template>
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
                    placeholder="99,039"
                  >
                    <template #append>pt</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="道具数" prop="token">
                  <el-input
                    v-model.number="form.token"
                    :min="0"
                    :max="999999"
                    :formatter="(value: string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                    :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')"
                    inputmode="numeric"
                    placeholder="1,300"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label=" ">
              <el-space wrap>
                <el-button type="primary" @click="handleSubmit">开始计算</el-button>
                <el-button @click="handleClear">清空</el-button>
              </el-space>
            </el-form-item>
          </el-form>
          <el-alert v-show="form.eventType === 5" type="warning" :closable="false" show-icon>
            <p style="font-size: var(--el-font-size-base)">
              注意：周年活动有每日推荐曲和普通曲的区别
            </p>
          </el-alert>
        </el-col>
        <el-col :span="0.1" class="hidden-sm-and-down">
          <div class="al-divider-vertical" style="margin: 0 0.5%"></div>
        </el-col>
        <el-col :lg="0" :sm="24">
          <div class="al-divider"></div>
        </el-col>
        <el-col :lg="10" :sm="24">
          <div id="mltd-event-parking-result" style="margin-bottom: 2em">
            <h2>结果</h2>
            <div v-if="calculatedFlag">
              <p v-if="parkingResult?.flag === false">控分失败：{{ parkingResult.message }}</p>
              <div v-else>
                <h4>当前状态</h4>
                <p>pt差距：{{ (form.targetPt! - form.pt!).toLocaleString('en-US') }}</p>
                <p>道具数：{{ form.token!.toLocaleString('en-US') }}</p>

                <h4>控分方案</h4>
                <template v-for="each of parkingResult?.result" :key="each.name">
                  <p v-if="each.value > 0">
                    {{ each.name }} {{ each.multiplier }} ：{{ each.value }}次
                  </p>
                </template>
              </div>
            </div>
            <div v-else>
              <p>等待输入</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    <!-- <div class="al-divider"></div> -->
  </div>
</template>

<style lang="scss" scoped>
:deep() {
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    appearance: textfield;
  }
}
</style>
