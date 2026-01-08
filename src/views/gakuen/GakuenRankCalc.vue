<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';

const formRef = ref<FormInstance | null>();

const form = reactive({
  scenario: 1,
  difficulty: 'MASTER' as keyof typeof maxStatsDict,
  vocal: undefined as number | undefined,
  dance: undefined as number | undefined,
  visual: undefined as number | undefined,
  beforeFinalTest: true,
});

const totalStatsBeforeFinalTest = ref(0);
const totalStats = ref(0);
const calculatedFlag = ref(false);
const calculatedForm = ref(form);

const maxStatsDict = {
  MASTER: 1800,
  PRO: 1500,
  REGULAR: 1000,
};

const rankTargetList = [
  {
    name: 'SS',
    target: 16000,
  },
  {
    name: 'S+',
    target: 14500,
  },
  {
    name: 'S',
    target: 13000,
  },
  {
    name: 'A+',
    target: 11500,
  },
  {
    name: 'A',
    target: 10000,
  },
  {
    name: 'B+',
    target: 8000,
  },
  {
    name: 'B',
    target: 6000,
  },
];

const finalTestResultToRankPointList = [
  {
    min: 0,
    max: 5000,
    ratio: 0.3,
  },
  {
    min: 5000,
    max: 10000,
    ratio: 0.15,
  },
  {
    min: 10000,
    max: 20000,
    ratio: 0.08,
  },
  {
    min: 20000,
    max: 30000,
    ratio: 0.04,
  },
  {
    min: 30000,
    max: 40000,
    ratio: 0.02,
  },
  {
    min: 40000,
    max: 1000000,
    ratio: 0.01,
  },
];

const calculatedResultList: { name: string; finalTestTarget: number | string }[] = [];

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
  const maxSingleStat: number = maxStatsDict[form.difficulty] || maxStatsDict.PRO;

  let vocal = Math.floor(Number(form.vocal)) || 0;
  let dance = Math.floor(Number(form.dance)) || 0;
  let visual = Math.floor(Number(form.visual)) || 0;

  form.vocal = Math.min(maxSingleStat, vocal);
  form.dance = Math.min(maxSingleStat, dance);
  form.visual = Math.min(maxSingleStat, visual);

  totalStatsBeforeFinalTest.value = form.vocal + form.dance + form.visual;
  totalStats.value = calculateTotalStats(form.difficulty, form.beforeFinalTest, [
    form.vocal,
    form.dance,
    form.visual,
  ]);

  calculatedResultList.length = 0;
  rankTargetList.forEach((each) => {
    calculatedResultList.push({
      name: each.name,
      finalTestTarget: calculateFinalTestTarget(totalStats.value, each.target),
    });
  });
  calculatedForm.value = { ...form };
  calculatedFlag.value = true;

  nextTick(() => {
    document.getElementById('gakuen-rank-calc-result')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function calculateTotalStats(
  difficulty: string,
  beforeFinalTest: boolean,
  stats: number[],
): number {
  const maxSingleStat: number =
    maxStatsDict[difficulty as keyof typeof maxStatsDict] || maxStatsDict.PRO;
  let totalStats = 0;

  stats.forEach((each) => {
    totalStats = totalStats + Math.min(maxSingleStat, each + (beforeFinalTest ? 30 : 0));
  });

  return totalStats;
}

function calculateFinalTestTarget(
  currentStatsAfterFinal: number,
  targetRankPt: number,
): number | string {
  const rankPointsFromStats = Math.floor(2.3 * currentStatsAfterFinal);
  const rankPointsFromFirstInFinal = 1700;
  const rankPointsNeededFromFinal = targetRankPt - rankPointsFromStats - rankPointsFromFirstInFinal;

  if (rankPointsNeededFromFinal <= 0) {
    return 0;
  }

  let rankPointsCurrentFromFinal = 0;
  let auditionPointsCurrentInFinal = 0;

  finalTestResultToRankPointList.every((each) => {
    if (
      (each.max - each.min) * each.ratio + rankPointsCurrentFromFinal <
      rankPointsNeededFromFinal
    ) {
      auditionPointsCurrentInFinal = each.max;
      rankPointsCurrentFromFinal = rankPointsCurrentFromFinal + (each.max - each.min) * each.ratio;
      return true;
    } else {
      const auditionPointsNeededThisStep = Math.ceil(
        (rankPointsNeededFromFinal - rankPointsCurrentFromFinal) / each.ratio,
      );
      auditionPointsCurrentInFinal = auditionPointsCurrentInFinal + auditionPointsNeededThisStep;
      return false;
    }
  });

  return auditionPointsCurrentInFinal ==
    finalTestResultToRankPointList[finalTestResultToRankPointList.length - 1]?.max
    ? '过大'
    : auditionPointsCurrentInFinal;
}
</script>

<template>
  <div id="view-gakuen-rank-calc">
    <h1 class="view-title">学园偶像大师 评级计算器</h1>
    <div class="al-divider"></div>
    <div id="gakuen-rank-calc-form">
      <el-form
        ref="formRef"
        :model="form"
        label-width="auto"
        label-position="top"
        style="max-width: 1200px"
      >
        <el-form-item label="选择剧本">
          <el-select v-model="form.scenario" disabled>
            <el-option label="定期公演《初》" :value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8" :xs="24">
            <el-form-item label="选择难度" prop="difficulty">
              <el-segmented
                v-model="form.difficulty"
                :options="Object.keys(maxStatsDict)"
                size="default"
              ></el-segmented>
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item label="当前难度属性最大值">
              {{ maxStatsDict[form.difficulty] }}
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" @keyup.enter="handleSubmit">
          <el-col :span="8" :xs="24">
            <el-form-item label="Vocal" prop="vocal">
              <el-input v-model.number="form.vocal" type="number" inputmode="numeric"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item label="Dance" prop="dance">
              <el-input v-model.number="form.dance" type="number" inputmode="numeric"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item label="Visual" prop="visual">
              <el-input v-model.number="form.visual" type="number" inputmode="numeric"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="包含最终测验能力值" prop="beforeFinalTest">
          <el-radio-group v-model="form.beforeFinalTest">
            <el-radio label="否" :value="true"> </el-radio>
            <el-radio label="是" :value="false"> </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label=" ">
          <el-space wrap>
            <el-button type="primary" @click="handleSubmit">开始计算</el-button>
            <el-button @click="handleClear">清空</el-button>
          </el-space>
        </el-form-item>
      </el-form>
    </div>
    <div class="al-divider"></div>
    <div id="gakuen-rank-calc-result" style="margin-bottom: 2em">
      <h2>结果</h2>
      <div v-if="calculatedFlag">
        <p>
          最终测验后能力值：{{ totalStats }}
          <span v-if="calculatedForm.beforeFinalTest">
            ({{ totalStatsBeforeFinalTest }}+{{ totalStats - totalStatsBeforeFinalTest }})
          </span>
        </p>
        <h4>最终测验拿到1位后：</h4>
        <p v-for="each of calculatedResultList" :key="`gakuen-rank-calc-result-p-${each.name}`">
          达到{{ each.name }}评级需要最终测验得分：{{ each.finalTestTarget }}
        </p>
      </div>
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
