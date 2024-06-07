<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElForm } from 'element-plus';

const formRef = ref<InstanceType<typeof ElForm> | null>();

const form = reactive({
  scenario: 1,
  difficulty: 'PRO' as keyof typeof maxStatsDict,
  vocal: 1000,
  dance: 1000,
  visual: 800,
  beforeFinalTest: true,
});

const totalStats = ref(0);
const calculatedFlag = ref(false);

const maxStatsDict = {
  PRO: 1500,
  REGULAR: 1000,
};

const rankTargetList = [
  {
    name: 'B',
    target: 6000,
  },
  {
    name: 'A',
    target: 10000,
  },
  {
    name: 'A+',
    target: 11500,
  },
  {
    name: 'S',
    target: 13000,
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
  form.vocal = 0;
  form.dance = 0;
  form.visual = 0;
  form.beforeFinalTest = true;

  calculatedFlag.value = false;
}

function handleSubmit() {
  const maxSingleStat: number = maxStatsDict[form.difficulty] || maxStatsDict.PRO;

  form.vocal = Math.floor(Number(form.vocal));
  form.dance = Math.floor(Number(form.dance));
  form.visual = Math.floor(Number(form.visual));

  form.vocal = Math.min(maxSingleStat, form.vocal);
  form.dance = Math.min(maxSingleStat, form.dance);
  form.visual = Math.min(maxSingleStat, form.visual);

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
  calculatedFlag.value = true;
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

  if(rankPointsNeededFromFinal <= 0) {
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
    finalTestResultToRankPointList[finalTestResultToRankPointList.length - 1].max
    ? '过大'
    : auditionPointsCurrentInFinal;
}
</script>

<template>
  <div id="view-gakuen-rank-calc">
    <h1>学园偶像大师评级计算器</h1>
    <div class="al-divider"></div>
    <el-form
      ref="formRef"
      :model="form"
      label-width="auto"
      label-position="top"
      style="max-width: 1000px"
    >
      <el-form-item label="选择剧本">
        <el-select v-model="form.scenario" disabled>
          <el-option label="定期公演《初》" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="选择难度">
        <el-select v-model="form.difficulty">
          <el-option label="PRO" value="PRO"></el-option>
          <el-option label="REGULAR" value="REGULAR"></el-option>
        </el-select>
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="8" :xs="24">
          <el-form-item label="Vocal">
            <el-input-number
              v-model.number="form.vocal"
              :controls="false"
              class="is-normal-input"
            ></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8" :xs="24">
          <el-form-item label="Dance">
            <el-input-number
              v-model.number="form.dance"
              :controls="false"
              class="is-normal-input"
            ></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8" :xs="24">
          <el-form-item label="Visual">
            <el-input-number
              v-model.number="form.visual"
              :controls="false"
              class="is-normal-input"
            ></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="包含最终测验能力值">
        <el-radio-group v-model="form.beforeFinalTest">
          <el-radio label="否" :value="true"> </el-radio>
          <el-radio label="是" :value="false"> </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label=" ">
        <el-button type="primary" @click="handleSubmit">开始计算</el-button>
        <el-button @click="handleClear">清空</el-button>
      </el-form-item>
    </el-form>
    <div v-if="calculatedFlag" class="al-divider"></div>
    <div v-if="calculatedFlag">
      <h2>结果</h2>
      <p>最终测验后能力值：{{ totalStats }}</p>
      <h4>最终测验拿到1位后：</h4>
      <p v-for="each of calculatedResultList" :key="`gakuen-rank-calc-result-p-${each.name}`">
        达到{{ each.name }}评级需要最终测验得分：{{ each.finalTestTarget }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
