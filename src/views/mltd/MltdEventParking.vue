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
                    type="number"
                    maxlength="8"
                    inputmode="numeric"
                    placeholder="0"
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
                    type="number"
                    maxlength="8"
                    inputmode="numeric"
                    placeholder="0"
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
                    type="number"
                    maxlength="6"
                    inputmode="numeric"
                    placeholder="0"
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

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';
import { useMltdUtils } from './composables/useMltdUtils';

const { eventTheaterChoices } = useMltdUtils();

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

async function handleSubmit() {
  preprocessingForm();
  calculatedForm.value = { ...form };
  if (form.eventType === 3 || form.eventType === 5) {
    parkingResult.value = await calcParkingTheater(
      form as formCheckedInterface,
      form.eventType === 5,
    );
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

async function calcParkingTheater(
  form: { targetPt: number; pt: number; token: number },
  isAnniversary = false,
): Promise<{
  flag: boolean;
  message?: string;
  result?: Array<resultItemInterface>;
}> {
  if (form.pt >= form.targetPt) {
    return { flag: false, message: '当前pt已达到或超过目标pt' };
  }
  if (form.targetPt - form.pt > 10000) {
    return { flag: false, message: 'pt差距大于10000，请缩小后重试' };
  }

  // 过滤可用的选择项
  const choices = eventTheaterChoices.value.filter(
    (each) => isAnniversary || each.anniversaryOnly !== true,
  );

  // 栈节点结构
  interface StackNode {
    ptDiff: number; // pt 差距（负数表示还需要多少）
    token: number;
    stepIndex: number; // 下一个要尝试的步骤索引
    viaStepIndex?: number; // 到达此状态所用的步骤索引
  }

  let iterations = 0;
  const stack: StackNode[] = [{ ptDiff: form.pt - form.targetPt, token: form.token, stepIndex: 0 }];

  while (stack.length) {
    // 防阻塞：每 100000 次迭代让出执行权
    iterations++;
    if (iterations % 100000 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }

    const top = stack[stack.length - 1]!;

    // 所有步骤都尝试过了，回溯
    if (top.stepIndex >= choices.length) {
      stack.pop();
      continue;
    }

    // 获取当前要尝试的步骤
    const currentStepIndex = top.stepIndex;
    top.stepIndex++; // 下次尝试下一个步骤

    const choice = choices[currentStepIndex]!;

    // 检查 token 是否足够
    if (top.token < -choice.token) {
      continue;
    }

    // 计算新状态
    const newPtDiff = top.ptDiff + choice.pt;
    const newToken = top.token + choice.token;

    // 剪枝：pt 超过目标
    if (newPtDiff > 0) {
      continue;
    }

    // 找到解
    if (newPtDiff === 0) {
      stack.push({
        ptDiff: newPtDiff,
        token: newToken,
        stepIndex: 0,
        viaStepIndex: currentStepIndex,
      });
      break;
    }

    // 继续深入搜索
    stack.push({
      ptDiff: newPtDiff,
      token: newToken,
      stepIndex: 0,
      viaStepIndex: currentStepIndex,
    });
  }

  // 提取结果
  const lastNode = stack[stack.length - 1];
  if (stack.length && lastNode && lastNode.ptDiff === 0) {
    // 统计每个步骤使用的次数
    const record: Record<string, number> = {};
    for (const node of stack) {
      if (node.viaStepIndex !== undefined) {
        record[node.viaStepIndex] = (record[node.viaStepIndex] ?? 0) + 1;
      }
    }

    const result: Array<resultItemInterface> = [];
    for (const [key, value] of Object.entries(record)) {
      if (value > 0) {
        const choice = choices[Number(key)]!;
        result.push({
          name: choice.name,
          multiplier: choice.multiplier,
          value,
        });
      }
    }

    return { flag: true, result };
  }

  return { flag: false, message: '不存在控分方案' };
}
</script>

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
