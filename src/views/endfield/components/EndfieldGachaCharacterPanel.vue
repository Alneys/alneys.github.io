<template>
  <div id="endfield-gacha-character" class="endfield-gacha-title" style="font-weight: bold">
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
          <el-option label="单抽" value="single" />
          <el-option label="智能" value="smart" />
          <el-option label="十连抽" value="batch" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="isSimulating" @click="startSimulation"
          >重新模拟</el-button
        >
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div class="al-divider"></div>
  <div class="endfield-charts gacha-character">
    <div ref="chartRef" v-loading="isSimulating" style="width: 100%; height: 800px"></div>
  </div>
  <div class="endfield-gacha-result gacha-character">
    <div class="simulation-summary">
      平均抽取次数：{{ characterAverageDraws.toFixed(2) }} / 中位数抽取次数：{{
        characterMedianDraws
      }}
    </div>
    <div class="simulation-summary">平均获得配额：{{ characterAverageTokens.toFixed(0) }}</div>
    <div class="simulation-summary">注："平均获得配额"为对应抽取数达成设定目标时的平均配额</div>
  </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { ref, reactive, watch, onMounted, onUnmounted, useTemplateRef } from 'vue';

import type { EChartsOption } from 'echarts';

import { useGachaChart } from '../composables/useGachaChart';
import type { GachaStrategy } from '../utils/EndfieldGachaUtils';
import type { CharacterAggregateResult } from '../utils/EndfieldGachaWorker';

const isDark = useDark();
const chartRef = useTemplateRef('chartRef');
const { initChart, setOption, resize, dispose, setTheme } = useGachaChart();

const isSimulating = ref(false);
const characterAverageDraws = ref<number>(0);
const characterMedianDraws = ref<number>(0);
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

const initialFormModel = { ...formModel };

function resetForm() {
  Object.assign(formModel, initialFormModel);
}

let worker: Worker | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function buildOption(data: CharacterAggregateResult): EChartsOption {
  return {
    title: {
      text: '角色抽取分布模拟',
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
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
      data: ['概率密度', '互补累计分布', '平均获得配额', '每1配额换算为玉'],
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
        position: 'right',
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
        data: data.pdfData,
        smooth: true,
        showSymbol: false,
      },
      {
        name: '互补累计分布',
        type: 'line',
        areaStyle: {
          color: 'rgba(128, 128, 128, 0.3)',
        },
        data: data.ccdfData,
        smooth: true,
        showSymbol: false,
      },
      {
        name: '平均获得配额',
        type: 'line',
        data: data.avgTokenData,
        smooth: true,
        showSymbol: false,
        xAxisIndex: 1,
        yAxisIndex: 1,
      },
      {
        name: '每1配额换算为玉',
        type: 'line',
        data: data.jadePerTokenData,
        smooth: true,
        showSymbol: false,
        xAxisIndex: 1,
        yAxisIndex: 2,
      },
    ],
  };
}

function startSimulation() {
  worker?.terminate();
  worker = new Worker(new URL('../utils/EndfieldGachaWorker.ts', import.meta.url), {
    type: 'module',
  });
  isSimulating.value = true;

  worker.onmessage = (event: MessageEvent<CharacterAggregateResult>) => {
    const data = event.data;
    characterAverageDraws.value = data.averageDraws;
    characterMedianDraws.value = data.medianDraws;
    characterAverageTokens.value = data.averageTokens;

    if (chartRef.value) {
      initChart(chartRef.value);
      setOption(buildOption(data));
      setTheme(isDark.value ? 'dark' : 'default');
    }
    isSimulating.value = false;
    worker?.terminate();
  };

  worker.onerror = () => {
    isSimulating.value = false;
  };

  worker.postMessage({
    type: 'character',
    payload: {
      simulationCount: formModel.simulationCount,
      initialNoSpecific6StarCount: 120 - formModel.remainingNoSpecific6StarCount,
      initialNo6StarCount: 80 - formModel.remainingNo6StarCount,
      initialNo5Or6StarCount: 10 - formModel.remainingNo5Or6StarCount,
      targetRank: formModel.targetRank,
      gachaStrategy: formModel.gachaStrategy,
      currentSpecific6StarCount: formModel.currentSpecific6StarCount,
      currentDrawCount: formModel.currentDrawCount,
      hasUsedSpecific6StarGuarantee: formModel.hasUsedSpecific6StarGuarantee,
    },
  });
}

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
      startSimulation();
    }, 500);
  },
);

function handleResize() {
  resize();
}

watch(isDark, (val) => {
  setTheme(val ? 'dark' : 'default');
});

onMounted(() => {
  startSimulation();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  worker?.terminate();
  dispose();
});
</script>

<style lang="scss" scoped>
@use '../styles/EndfieldGachaChart' as *;

@include gacha-chart-styles;
</style>
