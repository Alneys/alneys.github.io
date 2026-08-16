<template>
  <div id="endfield-gacha-weapon" class="endfield-gacha-title" style="font-weight: bold">武器</div>
  <div class="endfield-gacha-config gacha-weapon">
    <el-form :model="formModel" :inline="true" class="gacha-config-form">
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
      <el-form-item>
        <el-button type="primary" :loading="isSimulating" @click="startSimulation"
          >重新模拟</el-button
        >
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div class="al-divider"></div>
  <div class="endfield-charts gacha-weapon">
    <div ref="chartRef" v-loading="isSimulating" style="width: 100%; height: 500px"></div>
  </div>
  <div class="endfield-gacha-result gacha-weapon">
    <div class="simulation-summary">
      平均抽取次数：{{ averageDraws.toFixed(2) }} / 中位数抽取次数：{{ medianDraws }}
    </div>
    <div class="simulation-summary">平均消耗配额：{{ averageTokens.toFixed(0) }}</div>
  </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { ref, reactive, watch, onMounted, onUnmounted, useTemplateRef } from 'vue';

import type { EChartsOption } from 'echarts';

import { useGachaChart } from '../composables/useGachaChart';
import type { WeaponAggregateResult } from '../utils/EndfieldGachaWorker';

const isDark = useDark();
const chartRef = useTemplateRef('chartRef');
const { initChart, setOption, resize, dispose, setTheme } = useGachaChart();

const isSimulating = ref(false);
const averageDraws = ref<number>(0);
const medianDraws = ref<number>(0);
const averageTokens = ref<number>(0);

const formModel = reactive({
  simulationCount: 100000,
  targetRank: 0,
});

const initialFormModel = { ...formModel };

function resetForm() {
  Object.assign(formModel, initialFormModel);
}

let worker: Worker | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function buildOption(data: WeaponAggregateResult): EChartsOption {
  return {
    title: {
      text: '武器抽取分布模拟',
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const tenPulls = params[0].value[0];
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
    ],
  };
}

function startSimulation() {
  worker?.terminate();
  worker = new Worker(new URL('../utils/EndfieldGachaWorker.ts', import.meta.url), {
    type: 'module',
  });
  isSimulating.value = true;

  worker.onmessage = (event: MessageEvent<WeaponAggregateResult>) => {
    const data = event.data;
    averageDraws.value = data.averageTenPulls;
    medianDraws.value = data.medianTenPulls;
    averageTokens.value = data.averageTokens;

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
    type: 'weapon',
    payload: {
      simulationCount: formModel.simulationCount,
      targetRank: formModel.targetRank,
    },
  });
}

watch(
  () => [formModel.simulationCount, formModel.targetRank],
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
