<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';
import {
  eventTheaterStaminaToTokenList,
  eventAnniversaryTicketToTokenList,
  eventTheaterTokenToPtList,
  eventTheaterTicketToTokenList,
} from './mltd-data';
import { isFocusable } from 'element-plus/es/utils/index.mjs';

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
  if (form.eventType === 3) {
    calcParkingTheater(form as formCheckedInterface);
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

function calcParkingTheater(form: { targetPt: number; pt: number; token: number }) {
  if (form.pt >= form.targetPt) {
    throw Error('当前pt已超过目标pt');
  }
  if (form.pt - form.targetPt > 6000) {
    throw Error('pt差距大于6000，请缩小后重试');
  }
  const result: Record<string, number | undefined> = {};
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
    // result found now
    if (pt === 0) {
      flag = true;
      return;
    }
    // invalid state
    if (pt > 0 || token < 0) {
      return;
    }
    // DFS start
    // Order: token to pt, ticket to token, stamina to token
    [
      ...eventTheaterTokenToPtList,
      ...eventTheaterTicketToTokenList,
      ...eventTheaterStaminaToTokenList,
    ].forEach((each) => {
      // result already found
      if(flag) {
        return;
      }
      // enough token
      if (token >= -each.token) {
        // record try
        result[each.name] = (result[each.name] ?? 0) + 1;
        dfs(pt + each.pt, token + each.token);
        // tries failed, recover result
        if (!flag) {
          result[each.name]! -= 1;
        }
      }
    });
    // failed
    return;
  }
  
  dfs(form.pt - form.targetPt, form.token);
  if(flag) {
    console.log(result);
    return result;
  }
  else {
    throw '控分失败：不存在控分方案'
  }

}
</script>

<template>
  <div id="view-mltd-event-parking">
    <h1 class="view-title">偶像大师百万现场 活动控分计算器</h1>
    <div class="al-divider"></div>
    <div id="mltd-event-parking-form">
      <el-form
        ref="formRef"
        :model="form"
        label-width="auto"
        label-position="top"
        style="max-width: 800px"
      >
        <el-form-item label="选择活动类型">
          <el-select v-model="form.eventType">
            <el-option label="Theater / Trust / Anniversary" :value="3"></el-option>
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
          <el-button type="primary" @click="handleSubmit">开始计算</el-button>
          <el-button @click="handleClear">清空</el-button>
        </el-form-item>
        <el-alert v-show="form.eventType === 3" type="warning" :closable="false" show-icon>
          <p style="font-size: var(--el-font-size-base)">
            注意：周年活动目前没有考虑每日推荐曲1.2倍加成，<b>请不要打推荐曲。</b>
          </p>
        </el-alert>
      </el-form>
    </div>
    <div class="al-divider"></div>
    <div id="mltd-event-parking-result" style="margin-bottom: 2em">
      <h2>结果</h2>
      <div v-if="calculatedFlag"></div>
      <div v-else>
        <p>等待上方输入</p>
      </div>
    </div>
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
