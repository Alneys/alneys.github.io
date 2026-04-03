<template>
  <h1 class="view-title">Endfield gacha info</h1>
  <div class="al-divider"></div>
  <div class="endfield-gacha-title" id="endfield-gacha-character" style="font-weight: bold">
    角色
  </div>
  <div class="endfield-gacha-config gacha-character">
    <el-form :model="formModel" :inline="true" class="gacha-config-form" label-width="168px">
      <el-form-item label="模拟次数">
        <el-input-number
          v-model="formModel.simulationCount"
          :min="10000"
          :max="1000000"
          :step="10000"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item label="目标突破等级">
        <el-input-number
          v-model="formModel.targetRank"
          :min="0"
          :max="5"
          :step="1"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item label="当前已抽取次数">
        <el-input-number
          v-model="formModel.currentDrawCount"
          :min="0"
          :max="1200"
          :step="1"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item label="6星保底剩余计数">
        <el-input-number
          v-model="formModel.remainingNo6StarCount"
          :min="1"
          :max="80"
          :step="1"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item label="5星保底剩余计数">
        <el-input-number
          v-model="formModel.remainingNo5Or6StarCount"
          :min="1"
          :max="10"
          :step="1"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item
        label="特定6星保底剩余计数"
        :style="{
          textDecoration: formModel.hasUsedSpecific6StarGuarantee ? 'line-through' : '',
        }"
      >
        <el-input-number
          v-model="formModel.remainingNoSpecific6StarCount"
          :min="0"
          :max="120"
          :step="1"
          controls-position="right"
          :disabled="formModel.hasUsedSpecific6StarGuarantee"
        />
      </el-form-item>
      <el-form-item label="已使用特定6星保底">
        <el-segmented
          v-model="formModel.hasUsedSpecific6StarGuarantee"
          :options="[
            { label: '未使用', value: false },
            { label: '已使用', value: true },
          ]"
        />
      </el-form-item>
      <el-form-item label="当前已抽到数量">
        <el-input-number
          v-model="formModel.currentSpecific6StarCount"
          :min="0"
          :max="6"
          :step="1"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item label="抽卡策略">
        <el-select v-model="formModel.gachaStrategy" placeholder="请选择">
          <el-option label="单抽" value="single"></el-option>
          <el-option label="智能" value="smart"></el-option>
          <el-option label="十连抽" value="batch"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="redrawCharacterChart">重新模拟</el-button>
        <el-button @click="resetCharacterForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div class="al-divider"></div>
  <div class="endfield-charts gacha-character">
    <div ref="chartCharacterRef" style="width: 100%; height: 800px"></div>
  </div>
  <div class="endfield-gacha-result gacha-character">
    <div class="simulation-summary">
      平均抽取次数：{{ characterAverageDraws.toFixed(2) }} / 中位数抽取次数：{{
        characterMedianDraws
      }}
    </div>
    <div class="simulation-summary">平均获得配额：{{ characterAverageTokens.toFixed(0) }}</div>
    <div class="simulation-summary">注：“平均获得配额”为对应抽取数达成设定目标时的平均配额</div>
  </div>
  <div class="al-divider"></div>
  <div class="endfield-gacha-title" id="endfield-gacha-weapon" style="font-weight: bold">武器</div>
  <div class="endfield-gacha-config gacha-weapon">
    <el-form :model="weaponFormModel" :inline="true" class="gacha-config-form">
      <el-form-item label="模拟次数">
        <el-input-number
          v-model="weaponFormModel.simulationCount"
          :min="10000"
          :max="1000000"
          :step="10000"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item label="目标突破等级">
        <el-input-number
          v-model="weaponFormModel.targetRank"
          :min="0"
          :max="5"
          :step="1"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="redrawWeaponChart">重新模拟</el-button>
        <el-button @click="resetWeaponForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div class="al-divider"></div>
  <div class="endfield-charts gacha-weapon">
    <div ref="chartWeaponRef" style="width: 100%; height: 500px"></div>
  </div>
  <div class="endfield-gacha-result gacha-weapon">
    <div class="simulation-summary">平均抽取次数：{{ weaponAverageDraws.toFixed(2) }}</div>
    <div class="simulation-summary">平均消耗配额：{{ weaponAverageTokens.toFixed(0) }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, nextTick, useTemplateRef } from 'vue';
import * as echarts from 'echarts';
import {
  type GachaStrategy,
  type GachaSimulationResult,
  simulateCharacterGachaToTargetMultipleTimes,
} from './EndfieldGachaUtils';

const chartCharacterRef = useTemplateRef('chartCharacterRef');
const chartWeaponRef = useTemplateRef('chartWeaponRef');
const frequencyList = ref<GachaSimulationResult[]>([]);
const weaponFrequencyList = ref<any[]>([]);
const characterAverageDraws = ref<number>(0);
const weaponAverageDraws = ref<number>(0);
const weaponAverageTokens = ref<number>(0);
const characterMedianDraws = ref<number>(0);
// 新增：计算平均获取配额数量
const characterAverageTokens = ref<number>(0);

const formModel = reactive({
  simulationCount: 100000,
  targetRank: 0,
  remainingNo6StarCount: 80,
  remainingNo5Or6StarCount: 10,
  remainingNoSpecific6StarCount: 120,
  currentSpecific6StarCount: 0,
  currentDrawCount: 0,
  hasUsedSpecific6StarGuarantee: false,
  gachaStrategy: 'single' as GachaStrategy,
});

const weaponFormModel = reactive({
  simulationCount: 100000,
  targetRank: 0,
});

// 保存初始值用于重置
const initialFormModel = {
  simulationCount: 100000,
  targetRank: 0,
  remainingNo6StarCount: 80,
  remainingNo5Or6StarCount: 10,
  remainingNoSpecific6StarCount: 120,
  currentSpecific6StarCount: 0,
  currentDrawCount: 0,
  hasUsedSpecific6StarGuarantee: false,
  gachaStrategy: 'single' as GachaStrategy,
};

const initialWeaponFormModel = {
  simulationCount: 100000,
  targetRank: 0,
};

// 重置角色表单
function resetCharacterForm() {
  Object.assign(formModel, initialFormModel);
}

// 重置武器表单
function resetWeaponForm() {
  Object.assign(weaponFormModel, initialWeaponFormModel);
}

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let weaponDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 单次角色抽卡模拟函数
 * @param no6StarCount 连续未抽到6星次数
 * @param no5Or6StarCount 连续未抽到5/6星次数
 * @param noSpecific6StarCount 连续未抽到特定6星次数
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底
 * @returns 抽取的结果字符串（"6_up", "6_other", "5", "4"）
 */
function simulateCharacterGachaSingle(
  no6StarCount: number,
  no5Or6StarCount: number,
  noSpecific6StarCount: number,
  hasUsedSpecific6StarGuarantee: boolean,
): string {
  let p6: number, p5: number;

  // 1. 基础概率
  p6 = 0.008;
  p5 = 0.08;

  // 2. 120次特定保底：连续119次未抽特定6星 → 本次（第120次）必定 6星
  // 只有在未使用特定6星保底的情况下才生效
  if (!hasUsedSpecific6StarGuarantee && noSpecific6StarCount >= 119) {
    p6 = 1.0;
    p5 = 0.0;
  }
  // 3. 80次6星保底：连续79次未抽6星 → 本次（第80次）必定 6星
  else if (no6StarCount >= 79) {
    p6 = 1.0;
    p5 = 0.0;
  }
  // 5. 65次6星概率提升：连续65次未抽6星 → 从第66次起，6星概率 = 0.8% + 5% * (n - 64)
  else if (no6StarCount >= 65) {
    p6 = 0.008 + 0.05 * (no6StarCount - 64); // 6星概率提升对应数值
  }

  // 4. 10次5星保底：连续9次未抽5/6星 → 本次（第10次）必定5星及以上
  if (no5Or6StarCount >= 9) {
    p5 = 1;
  }

  // 执行抽取
  const rand = Math.random();

  if (rand < p6) {
    // 6星
    let isSpecific = false;
    // 120次保底：连续119次未获特定6星 → 本次（第120次）必定获得
    // 只有在未使用特定6星保底的情况下才生效
    if (!hasUsedSpecific6StarGuarantee && noSpecific6StarCount >= 119) {
      isSpecific = true;
    } else {
      isSpecific = Math.random() < 0.5; // 50%概率为特定6星
    }

    return isSpecific ? '6_up' : '6_other'; // 特定6星 / 其他6星
  } else if (rand < p6 + p5) {
    return '5'; // 5星
  } else {
    return '4'; // 4星
  }
}

/**
 * 模拟一次完整的角色抽卡过程，直到获得特定6星
 * @param initialNoSpecific6StarCount 继承的未抽取特定6星次数，默认0
 * @param initialNo6StarCount 继承的未抽取6星次数，默认0
 * @param initialNo5Or6StarCount 继承的未抽取5星次数，默认0
 * @param targetRank 目标突破等级，默认0
 * @param gachaStrategy 抽卡策略，默认单抽
 * @param currentSpecific6StarCount 当前已拥有的特定6星数量，默认0
 * @param currentDrawCount 当前已抽取次数，默认0
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底，默认false
 * @returns 返回本次模拟的所有抽取结果的对象，包含result字段，值为字符串列表，以及actualDraws字段表示实际抽取次数
 */
function simulateCharacterGachaToTarget(
  initialNoSpecific6StarCount: number = 0,
  initialNo6StarCount: number = 0,
  initialNo5Or6StarCount: number = 0,
  targetRank: number = 0,
  gachaStrategy: GachaStrategy = 'single',
  currentSpecific6StarCount: number = 0,
  currentDrawCount: number = 0,
  hasUsedSpecific6StarGuarantee: boolean = false,
): GachaSimulationResult {
  let drawCount = currentDrawCount;
  let no6StarCount = initialNo6StarCount;
  let no5Or6StarCount = initialNo5Or6StarCount;
  let noSpecific6StarCount = initialNoSpecific6StarCount;
  let freeGachaUsed = currentDrawCount >= 30; // 如果当前已抽取次数>=30，则免费10连已使用
  let specific6StarCount = currentSpecific6StarCount;
  let rankUpMaterials = Math.floor(currentDrawCount / 240); // 根据当前已抽取次数计算已有突破材料
  const currentSimulationResults: string[] = [];

  while (drawCount <= 1200) {
    // 检查是否触发免费10连抽（累计抽取30次且未使用过）
    if (drawCount >= 30 && !freeGachaUsed) {
      let freeNo5Or6StarCount = 0;
      for (let j = 0; j < 10; j++) {
        const freeResult = simulateCharacterGachaSingle(0, freeNo5Or6StarCount, 0, false);

        currentSimulationResults.push(freeResult);

        if (freeResult === '6_up') {
          specific6StarCount++;
        } else if (freeResult === '6_other') {
          freeNo5Or6StarCount = 0;
        } else if (freeResult === '5') {
          freeNo5Or6StarCount = 0;
        } else {
          freeNo5Or6StarCount++;
        }
      }
      freeGachaUsed = true;
      continue;
    }

    // 满足目标条件时，结束模拟
    if (specific6StarCount >= 1 && specific6StarCount + rankUpMaterials >= 1 + targetRank) {
      break;
    }

    let nextGachaTries = 1;

    if (gachaStrategy === 'single') {
      nextGachaTries = 1;
    } else if (gachaStrategy === 'batch') {
      nextGachaTries = 10;
    } else if (gachaStrategy === 'smart') {
      if (
        no6StarCount >= 60 ||
        (!hasUsedSpecific6StarGuarantee && drawCount >= 110) ||
        drawCount % 240 >= 230
      ) {
        nextGachaTries = 1;
      } else {
        nextGachaTries = 10;
      }
    }

    for (let i = 0; i < nextGachaTries; i++) {
      const result = simulateCharacterGachaSingle(
        no6StarCount,
        no5Or6StarCount,
        noSpecific6StarCount,
        hasUsedSpecific6StarGuarantee,
      );
      currentSimulationResults.push(result);
      drawCount += 1;

      if (drawCount > 0 && drawCount % 240 === 0) {
        rankUpMaterials++;
      }

      if (result === '6_up') {
        specific6StarCount++;
        hasUsedSpecific6StarGuarantee = true;
        noSpecific6StarCount = 0;
        no6StarCount = 0;
        no5Or6StarCount = 0;
      } else if (result === '6_other') {
        noSpecific6StarCount++;
        no6StarCount = 0;
        no5Or6StarCount = 0;
      } else if (result === '5') {
        noSpecific6StarCount++;
        no6StarCount++;
        no5Or6StarCount = 0;
      } else {
        noSpecific6StarCount++;
        no6StarCount++;
        no5Or6StarCount++;
      }
    }
  }

  // 计算实际抽数：总长度减去免费10抽（如果有的话）
  let actualDraws = currentSimulationResults.length;
  if (currentSimulationResults.length + currentDrawCount > 30 && currentDrawCount < 30) {
    actualDraws -= 10;
  }

  // 如果总抽取次数达到60次，获得下个卡池的免费十连，模拟抽取
  if (drawCount >= 60) {
    // 使用最后的未抽到6星和5星计数，但不包括未抽到特定6星计数
    let freeNo6StarCount = no6StarCount;
    let freeNo5Or6StarCount = no5Or6StarCount;

    // 下个卡池继承未抽到6星和5星的计数，但不继承未抽到特定6星的计数
    for (let j = 0; j < 10; j++) {
      let freeResult = simulateCharacterGachaSingle(
        freeNo6StarCount,
        freeNo5Or6StarCount,
        0, // 不继承未抽到特定6星的计数，此处简单处理，因为下个卡池的特定角色与当前的不同
        hasUsedSpecific6StarGuarantee,
      );

      currentSimulationResults.push(freeResult);

      // 更新计数器，注意不更新noSpecific6StarCount
      if (freeResult === '6_up') {
        freeResult = '6_other'; // 此处简单处理
        specific6StarCount++;
        hasUsedSpecific6StarGuarantee = true;
        freeNo6StarCount = 0;
        freeNo5Or6StarCount = 0;
      } else if (freeResult === '6_other') {
        freeNo6StarCount = 0;
        freeNo5Or6StarCount = 0;
      } else if (freeResult === '5') {
        freeNo6StarCount++;
        freeNo5Or6StarCount = 0;
      } else {
        freeNo6StarCount++;
        freeNo5Or6StarCount++;
      }
    }
  }

  return { result: currentSimulationResults, actualDraws };
}

/**
 * 单次武器抽卡模拟函数
 * @param totalDrawCount 总抽取次数（用于计算累计抽取次数）
 * @param no6StarWeaponCount 连续未抽到6星武器的次数
 * @param hasObtainedSpecific6StarWeapon 是否已获得特定概率提升的6星武器
 * @returns 抽取的结果字符串数组（每个元素为"6_up", "6_other", "5", "4"）
 */
function simulateWeaponGachaSingle(
  totalDrawCount: number,
  no6StarWeaponCount: number,
  hasObtainedSpecific6StarWeapon: boolean,
): string[] {
  const results: string[] = [];
  let currentNo6StarCount = 0; // 当前这次10连中未抽到6星的次数
  let currentNoSpecific6StarCount = 0; // 当前这次10连中未抽到特定6星的次数

  // 检查是否触发6星保底（连续3次武器抽取没有获取6星武器）
  const shouldGuarantee6Star = no6StarWeaponCount >= 3;

  // 检查是否触发特定6星保底（前7次武器抽取没有获取特定6星武器，且尚未获得过）
  const shouldGuaranteeSpecific6Star = !hasObtainedSpecific6StarWeapon && totalDrawCount >= 7;

  // 获得10把武器
  for (let i = 0; i < 10; i++) {
    // 基础概率
    let p6 = 0.04; // 6星基础概率
    let p5 = 0.15; // 5星基础概率
    // 4星概率 = 1 - p6 - p5 = 0.81

    // 检查是否触发保底（仅在第10次抽卡时）
    if (i === 9) {
      // 一次性检查前9次结果
      let has5OrAbove = false;
      let has6Star = false;
      let hasSpecific6Star = false;

      for (let j = 0; j < 9; j++) {
        const r = results[j];
        if (r === '5' || r === '6_up' || r === '6_other') {
          has5OrAbove = true;
        }
        if (r === '6_up' || r === '6_other') {
          has6Star = true;
        }
        if (r === '6_up') {
          hasSpecific6Star = true;
        }
      }

      // 5星保底：前9次无5星及以上
      if (!has5OrAbove) {
        p5 = 1.0;
      }

      // 6星保底：满足全局6星保底条件 且 前9次无6星
      if (shouldGuarantee6Star && !has6Star) {
        p6 = 1.0;
        p5 = 0.0;
      }

      // 特定6星保底：满足特定保底条件 且 前9次无特定6星
      if (shouldGuaranteeSpecific6Star && !hasSpecific6Star) {
        p6 = 1.0;
        p5 = 0.0;
      }
    }

    // 执行抽取
    const rand = Math.random();
    let result: string;

    if (rand < p6) {
      // 6星
      let isSpecific = false;

      // 检查是否触发特定6星保底（前7次未抽特定6星，且当前是第10把）
      if (shouldGuaranteeSpecific6Star && i === 9) {
        let hasSpecific6Star = false;
        for (let j = 0; j < 9; j++) {
          if (results[j] === '6_up') {
            hasSpecific6Star = true;
            break;
          }
        }
        if (!hasSpecific6Star) {
          isSpecific = true;
        } else {
          isSpecific = Math.random() < 0.25; // 25%概率为特定6星
        }
      } else {
        isSpecific = Math.random() < 0.25; // 25%概率为特定6星
      }

      result = isSpecific ? '6_up' : '6_other';
    } else if (rand < p6 + p5) {
      result = '5'; // 5星
    } else {
      result = '4'; // 4星
    }

    results.push(result);

    // 更新计数器
    if (result === '6_up' || result === '6_other') {
      currentNo6StarCount = 0;
    } else {
      currentNo6StarCount++;
    }

    if (result === '6_up') {
      currentNoSpecific6StarCount = 0;
    } else {
      currentNoSpecific6StarCount++;
    }
  }

  return results;
}

/**
 * 模拟一次完整的武器抽卡过程，直到达到目标突破等级
 * @param targetRank 目标突破等级，默认0
 * @returns 返回本次模拟的所有抽取结果的字符串列表
 */
function simulateWeaponGachaToTarget(targetRank: number = 0): string[] {
  let totalDrawCount = 0; // 总抽取次数（以10连为单位计算）
  let no6StarWeaponCount = 0; // 连续未抽到6星武器的次数
  let specific6StarWeaponCount = 0; // 获得特定6星武器的次数
  const currentSimulationResults: string[] = []; // 记录当前模拟的所有抽取结果

  // 持续抽取直到达到目标突破等级
  while (totalDrawCount <= 100) {
    // 设置合理的上限防止无限循环
    // 检查是否满足条件（武器数量达到目标数量）
    if (specific6StarWeaponCount >= 1 + targetRank) {
      break;
    }

    // 执行一次10连抽
    const results = simulateWeaponGachaSingle(
      totalDrawCount,
      no6StarWeaponCount,
      specific6StarWeaponCount > 0,
    );

    // 添加结果到当前模拟结果
    currentSimulationResults.push(...results);
    totalDrawCount++;

    // 统计额外武器（第18次起，每16次抽取额外获得一把武器）
    if (totalDrawCount >= 18 && totalDrawCount % 16 === 2) {
      specific6StarWeaponCount++;
    }

    // 检查是否有6星武器
    let has6Star = false;
    let hasSpecific6Star = false;

    for (const result of results) {
      if (result === '6_up' || result === '6_other') {
        has6Star = true;
        if (result === '6_up') {
          hasSpecific6Star = true;
          specific6StarWeaponCount++;
        }
      }
    }

    // 更新未抽到6星武器的计数器
    if (has6Star) {
      no6StarWeaponCount = 0;
    } else {
      no6StarWeaponCount++;
    }
  }

  return currentSimulationResults;
}
/**
 * 模拟多次武器抽卡过程，获得达到目标时的各种抽取情况
 * @param simulationCount 模拟次数，默认10000
 * @param targetRank 目标突破等级，默认0
 * @returns 返回一个列表，每个元素是一次模拟的所有抽取结果的字符串列表
 */
function simulateWeaponGachaToTargetMultipleTimes(
  simulationCount: number = 10000,
  targetRank: number = 0,
): string[][] {
  const allSimulationResults: string[][] = []; // 存储所有模拟的结果

  for (let i = 0; i < simulationCount; i++) {
    const currentSimulationResult = simulateWeaponGachaToTarget(targetRank);
    allSimulationResults.push(currentSimulationResult); // 添加完整的单次模拟结果
  }

  return allSimulationResults;
}

/**
 * 将原始数据转换为ECharts可用的格式（角色）
 * @param data 原始数据，包含多次模拟，每次模拟包含抽取结果的对象，包含result字段，值为字符串列表，以及actualDraws字段表示实际抽取次数
 * @returns {Object} 包含概率密度、互补累计分布和平均配额的数据对象
 */
function processDataForCharacterChart(data: GachaSimulationResult[]): any {
  // 统计抽取次数分布
  const countMap: Map<number, number> = new Map(); // 记录每个抽取次数出现的频率
  const tokenSumMap: Map<number, number> = new Map(); // 记录每个抽取次数对应的配额总和

  for (const simulation of data) {
    // 直接使用 simulation.actualDraws 而不是计算
    const actualDraws = simulation.actualDraws;
    countMap.set(actualDraws, (countMap.get(actualDraws) || 0) + 1);

    // 计算该次模拟的配额数量
    const tokenCount = calculateWeaponTokens(simulation.result);
    tokenSumMap.set(actualDraws, (tokenSumMap.get(actualDraws) || 0) + tokenCount);
  }

  // 获取所有出现过的抽取次数并排序
  let uniqueDraws: number[];
  if (formModel.gachaStrategy === 'batch') {
    // 十连抽模式下，只显示出现过的抽取次数
    uniqueDraws = Array.from(countMap.keys()).sort((a, b) => a - b);
  } else {
    // 其他模式下，显示从1到最大值的所有情况
    const maxDraws = Math.max(...Array.from(countMap.keys()));
    uniqueDraws = Array.from({ length: maxDraws }, (_, i) => i + 1);

    // 如果某个抽数没有出现过，将其计数设为0
    for (const draws of uniqueDraws) {
      if (!countMap.has(draws)) {
        countMap.set(draws, 0);
        tokenSumMap.set(draws, 0);
      }
    }
  }

  // 概率密度数据（折线图）- 转换为百分比
  const pdfData = uniqueDraws
    .filter((draws) => countMap.has(draws)) // 只处理存在的数据
    .map((draws) => [draws, ((countMap.get(draws) || 0) / data.length) * 100]);

  // 互补累计分布数据（面积图）- 转换为百分比
  const totalSimulations = data.length;
  let remainingCount = totalSimulations; // 剩余未达到该抽取次数的模拟数量

  const ccdfData = uniqueDraws
    .filter((draws) => countMap.has(draws)) // 只处理存在的数据
    .map((draws) => {
      // 更新剩余数量：减去当前抽取次数的模拟数量
      remainingCount -= countMap.get(draws) || 0;

      // 对于抽取次数为draws的情况，P(X >= draws) = 剩余数量/总模拟数
      const probability = (remainingCount / totalSimulations) * 100;

      return [draws, probability];
    });

  // 平均配额数据 - 取整，并过滤掉配额为0的项目
  const avgTokenData = uniqueDraws
    .filter((draws) => countMap.has(draws)) // 只处理存在的数据
    .map((draws) => {
      const totalCount = countMap.get(draws) || 0;
      const totalTokens = tokenSumMap.get(draws) || 0;
      const avgTokens = totalCount > 0 ? Math.round(totalTokens / totalCount) : 0;
      return [draws, avgTokens];
    })
    .filter(([, tokens]) => {
      return tokens && tokens > 0;
    }); // 过滤掉配额为0的项目

  // 每1配额换算为玉数据
  let jadePerTokenData: [number, number][] = [];

  jadePerTokenData = uniqueDraws
    .filter((draws) => countMap.has(draws) && tokenSumMap.get(draws)! > 0) // 只处理存在的数据且配额大于0
    .map((draws) => {
      const totalCount = countMap.get(draws) || 0;
      const totalTokens = tokenSumMap.get(draws) || 0;
      const avgTokens = totalCount > 0 ? totalTokens / totalCount : 0;

      // 计算玉的消耗：每次实际抽取消耗500玉
      const totalJadeConsumed = draws * 500;
      const avgJadePerToken = avgTokens > 0 ? totalJadeConsumed / avgTokens : 0;

      return [draws, avgJadePerToken];
    });

  return {
    pdfData,
    ccdfData,
    avgTokenData,
    jadePerTokenData, // 新增每1配额换算为玉数据
  };
}

/**
 * 将原始数据转换为ECharts可用的格式（武器）
 * @param data 原始数据，包含多次模拟，每次模拟包含抽取结果的字符串列表
 * @returns {Object} 包含概率密度、互补累计分布的数据对象
 */
function processDataForWeaponChart(data: string[][]): any {
  // 统计抽取次数分布（以10连为单位）
  const countMap: Map<number, number> = new Map(); // 记录每个10连次数出现的频率

  for (const simulation of data) {
    // 计算10连次数
    const tenPullCount = Math.ceil(simulation.length / 10);
    countMap.set(tenPullCount, (countMap.get(tenPullCount) || 0) + 1);
  }

  // 获取所有出现过的10连次数并排序
  const uniqueTenPulls = Array.from(countMap.keys()).sort((a, b) => a - b);

  // 概率密度数据（折线图）- 转换为百分比
  const pdfData = uniqueTenPulls.map((tenPulls) => [
    tenPulls,
    ((countMap.get(tenPulls) || 0) / data.length) * 100,
  ]);

  // 互补累计分布数据（面积图）- 转换为百分比
  const totalSimulations = data.length;
  let remainingCount = totalSimulations; // 剩余未达到该10连次数的模拟数量

  const ccdfData = uniqueTenPulls.map((tenPulls) => {
    // 更新剩余数量：减去当前10连次数的模拟数量
    remainingCount -= countMap.get(tenPulls) || 0;

    // 对于10连次数为tenPulls的情况，P(X >= tenPulls) = 剩余数量/总模拟数
    const probability = (remainingCount / totalSimulations) * 100;

    return [tenPulls, probability];
  });

  return {
    pdfData,
    ccdfData,
  };
}

/**
 * 根据角色抽取结果列表计算可获得的配额数量
 * @param results 抽取结果列表
 * @returns 返回配额总数
 */
function calculateWeaponTokens(results: string[]): number {
  let tokenCount = 0;

  for (const result of results) {
    switch (result) {
      case '6_up': // 6星up角色
      case '6_other': // 其他6星角色
        tokenCount += 2000;
        break;
      case '5': // 5星角色
        tokenCount += 200;
        break;
      case '4': // 4星角色
        tokenCount += 20;
        break;
      default:
        // 其他情况不增加配额
        break;
    }
  }

  return tokenCount;
}

// 重新绘制角色图表的函数
async function redrawCharacterChart() {
  frequencyList.value = simulateCharacterGachaToTargetMultipleTimes(
    formModel.simulationCount,
    120 - formModel.remainingNoSpecific6StarCount,
    80 - formModel.remainingNo6StarCount,
    10 - formModel.remainingNo5Or6StarCount,
    formModel.targetRank,
    formModel.gachaStrategy,
    formModel.currentSpecific6StarCount,
    formModel.currentDrawCount,
    formModel.hasUsedSpecific6StarGuarantee,
  );

  // 计算平均抽取次数
  let totalDraws = 0;
  let totalTokens = 0; // 新增：统计总配额
  const actualDrawsList: number[] = [];
  for (const simulation of frequencyList.value) {
    // 直接使用 simulation.actualDraws 而不是计算
    const actualDraws = simulation.actualDraws;
    totalDraws += actualDraws;
    actualDrawsList.push(actualDraws);

    // 计算此次模拟的配额并累加
    const tokenCount = calculateWeaponTokens(simulation.result);
    totalTokens += tokenCount;
  }
  characterAverageDraws.value = totalDraws / frequencyList.value.length;

  // 计算平均配额
  characterAverageTokens.value = totalTokens / frequencyList.value.length;

  // 计算中位数抽取次数
  actualDrawsList.sort((a, b) => a - b);
  const mid = Math.floor(actualDrawsList.length / 2);
  characterMedianDraws.value =
    actualDrawsList.length % 2 !== 0
      ? actualDrawsList[mid]!
      : Math.round((actualDrawsList[mid - 1]! + actualDrawsList[mid]!) / 2);

  await nextTick();

  if (chartCharacterRef.value) {
    const chart = echarts.init(chartCharacterRef.value);

    const processedData = processDataForCharacterChart(frequencyList.value);

    const option: echarts.EChartsOption = {
      title: {
        text: '角色抽取分布模拟',
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params: any) {
          // 从第一个系列的数据中获取抽取次数
          let result = params[0].value[0] + '次抽取<br/>';
          params.forEach((item: any) => {
            if (item.seriesName === '平均获得配额') {
              result += item.seriesName + ': ' + Math.round(item.value[1]) + '<br/>';
            } else if (item.seriesName === '每1配额换算为玉') {
              result += item.seriesName + ': ' + item.value[1].toFixed(2) + '<br/>';
            } else {
              result += item.seriesName + ': ' + item.value[1].toFixed(3) + '%<br/>';
            }
          });
          return result;
        },
      },
      legend: {
        data: ['概率密度', '互补累计分布', '平均获得配额', '每1配额换算为玉'], // 添加新系列到图例
        top: 40,
        right: 0,
      },
      grid: [
        {
          left: 60,
          right: 50,
          height: '37%',
        },
        {
          left: 60,
          right: 50,
          top: '53%',
          height: '37%',
        },
      ],
      xAxis: [
        {
          type: 'value',
          name: '抽取次数',
          axisLabel: {
            formatter: function (value: number) {
              return Math.round(value).toString();
            },
          },
          min: 0,
          max: 'dataMax',
        },
        {
          gridIndex: 1,
          type: 'value',
          name: '抽取次数',
          axisLabel: {
            formatter: function (value: number) {
              return Math.round(value).toString();
            },
          },
          min: 0,
          max: 'dataMax',
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: '概率(%)',
          axisLabel: {
            formatter: '{value}%',
          },
        },
        {
          gridIndex: 1,
          type: 'value',
          name: '平均获得配额',
          axisLabel: {
            formatter: '{value}',
          },
        },
        {
          gridIndex: 1,
          type: 'value',
          name: '每1配额换算为玉',
          position: 'right', // Y轴位于右侧
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed',
            },
          },
          axisLabel: {
            formatter: '{value}',
          },
        },
      ],
      axisPointer: {
        link: [
          {
            xAxisIndex: 'all',
          },
        ],
      },
      dataZoom: [
        {
          type: 'inside',
          realtime: true,
          xAxisIndex: [0, 1],
        },
        {
          type: 'slider',
          realtime: true,
          xAxisIndex: [0, 1],
        },
      ],
      series: [
        {
          name: '概率密度',
          type: 'line',
          data: processedData.pdfData,
          smooth: true,
          showSymbol: false,
        },
        {
          name: '互补累计分布',
          type: 'line',
          areaStyle: {
            color: 'rgba(128, 128, 128, 0.3)',
          },
          data: processedData.ccdfData,
          smooth: true,
          showSymbol: false,
        },
        {
          name: '平均获得配额',
          type: 'line',
          data: processedData.avgTokenData,
          smooth: true,
          showSymbol: false,
          xAxisIndex: 1,
          yAxisIndex: 1,
        },
        {
          name: '每1配额换算为玉',
          type: 'line',
          data: processedData.jadePerTokenData,
          smooth: true,
          showSymbol: false,
          xAxisIndex: 1,
          yAxisIndex: 2, // 使用右侧Y轴
        },
      ],
    };

    chart.setOption(option);

    // 响应式调整
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }
}

// 重新绘制武器图表的函数
async function redrawWeaponChart() {
  // 调用武器模拟
  weaponFrequencyList.value = simulateWeaponGachaToTargetMultipleTimes(
    weaponFormModel.simulationCount,
    weaponFormModel.targetRank,
  );

  // 计算平均抽取次数
  let totalTenPulls = 0;
  for (const simulation of weaponFrequencyList.value) {
    const tenPullCount = Math.ceil(simulation.length / 10);
    totalTenPulls += tenPullCount;
  }
  weaponAverageDraws.value = totalTenPulls / weaponFrequencyList.value.length;
  // 计算平均消耗配额（每次10连消耗1980配额）
  weaponAverageTokens.value = weaponAverageDraws.value * 1980;

  await nextTick();

  if (chartWeaponRef.value) {
    const chart = echarts.init(chartWeaponRef.value);

    const processedData = processDataForWeaponChart(weaponFrequencyList.value);

    const option: echarts.EChartsOption = {
      title: {
        text: '武器抽取分布模拟',
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params: any) {
          // 从第一个系列的数据中获取10连次数
          const tenPulls = params[0].value[0];
          // 计算总配额：抽取次数 * 1980配额/次
          const totalToken = tenPulls * 1980;
          let result = `${tenPulls}次抽取<br/>`;
          result += `总消耗配额: ${totalToken.toLocaleString()}<br/>`;
          params.forEach((item: any) => {
            result += item.seriesName + ': ' + item.value[1].toFixed(3) + '%<br/>';
          });
          return result;
        },
      },
      legend: {
        data: ['概率密度', '互补累计分布'],
        top: 40,
        right: 0,
      },
      grid: {
        left: 60,
        right: 50,
        top: 80,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        name: '10连抽取次数',
        axisLabel: {
          formatter: function (value: number) {
            return Math.round(value).toString();
          },
        },
        min: 0,
        max: 'dataMax',
      },
      yAxis: {
        type: 'value',
        name: '概率(%)',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      axisPointer: {
        link: [
          {
            xAxisIndex: 'all',
          },
        ],
      },
      dataZoom: [
        {
          type: 'inside',
          realtime: true,
        },
        {
          type: 'slider',
          realtime: true,
        },
      ],
      series: [
        {
          name: '概率密度',
          type: 'line',
          data: processedData.pdfData,
          smooth: true,
          showSymbol: false,
        },
        {
          name: '互补累计分布',
          type: 'line',
          areaStyle: {
            color: 'rgba(128, 128, 128, 0.3)',
          },
          data: processedData.ccdfData,
          smooth: true,
          showSymbol: false,
        },
      ],
    };

    chart.setOption(option);

    // 响应式调整
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }
}

// 监听角色表单变化并使用防抖机制
watch(
  () => [
    formModel.simulationCount,
    formModel.targetRank,
    formModel.gachaStrategy,
    formModel.remainingNo6StarCount,
    formModel.remainingNo5Or6StarCount,
    formModel.remainingNoSpecific6StarCount,
    formModel.currentSpecific6StarCount,
    formModel.currentDrawCount,
    formModel.hasUsedSpecific6StarGuarantee,
  ],
  () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      redrawCharacterChart();
    }, 500); // 500ms防抖延迟
  },
);

// 监听武器表单变化并使用防抖机制
watch(
  () => [weaponFormModel.simulationCount, weaponFormModel.targetRank],
  () => {
    if (weaponDebounceTimer) {
      clearTimeout(weaponDebounceTimer);
    }

    weaponDebounceTimer = setTimeout(() => {
      redrawWeaponChart();
    }, 500); // 500ms防抖延迟
  },
);

onMounted(async () => {
  // 初始化图表
  await redrawCharacterChart();
  await redrawWeaponChart();
});
</script>

<style lang="scss" scoped>
.gacha-config-form {
  padding-top: 1em;

  :deep(.el-form-item) {
    .el-input-number,
    .el-select,
    .el-segmented {
      width: 144px;
    }
  }
}

.simulation-summary {
  margin-top: 1em;
  font-weight: bold;
  text-align: center;
  padding: 0.5em;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
