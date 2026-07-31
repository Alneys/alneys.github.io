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
        <el-button type="primary" @click="redrawChart">重新模拟</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div class="al-divider"></div>
  <div class="endfield-charts gacha-weapon">
    <div ref="chartRef" style="width: 100%; height: 500px"></div>
  </div>
  <div class="endfield-gacha-result gacha-weapon">
    <div class="simulation-summary">平均抽取次数：{{ averageDraws.toFixed(2) }}</div>
    <div class="simulation-summary">平均消耗配额：{{ averageTokens.toFixed(0) }}</div>
  </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { ref, reactive, watch, onMounted, onUnmounted, nextTick, useTemplateRef } from 'vue';

import type { EChartsOption } from 'echarts';

import { useGachaChart } from '../composables/useGachaChart';
import {
  simulateWeaponGachaToTargetMultipleTimes,
  processDataForWeaponChart,
} from '../utils/EndfieldGachaUtils';

const isDark = useDark();
const chartRef = useTemplateRef('chartRef');
const { initChart, setOption, resize, dispose, setTheme } = useGachaChart();

const frequencyList = ref<string[][]>([]);
const averageDraws = ref<number>(0);
const averageTokens = ref<number>(0);

const formModel = reactive({
  simulationCount: 100000,
  targetRank: 0,
});

const initialFormModel = { ...formModel };

function resetForm() {
  Object.assign(formModel, initialFormModel);
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function redrawChart() {
  frequencyList.value = simulateWeaponGachaToTargetMultipleTimes(
    formModel.simulationCount,
    formModel.targetRank,
  );

  let totalTenPulls = 0;
  for (const simulation of frequencyList.value) {
    const tenPullCount = Math.ceil(simulation.length / 10);
    totalTenPulls += tenPullCount;
  }
  averageDraws.value = totalTenPulls / frequencyList.value.length;
  averageTokens.value = averageDraws.value * 1980;

  await nextTick();

  if (chartRef.value) {
    initChart(chartRef.value);

    const processedData = processDataForWeaponChart(frequencyList.value);

    const option: EChartsOption = {
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

    setOption(option);
    setTheme(isDark.value ? 'dark' : 'default');
  }
}

watch(
  () => [formModel.simulationCount, formModel.targetRank],
  () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      redrawChart();
    }, 500);
  },
);

function handleResize() {
  resize();
}

watch(isDark, (val) => {
  setTheme(val ? 'dark' : 'default');
});

onMounted(async () => {
  await redrawChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  dispose();
});
</script>

<style lang="scss" scoped>
@use '../styles/EndfieldGachaChart' as *;

@include gacha-chart-styles;
</style>
