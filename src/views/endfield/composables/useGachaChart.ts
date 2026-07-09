import { shallowRef } from 'vue';

import * as echarts from 'echarts';

export function useGachaChart() {
  const chart = shallowRef<echarts.ECharts | null>(null);

  function initChart(el: HTMLElement) {
    if (!chart.value) {
      chart.value = echarts.init(el);
    }
    return chart.value;
  }

  function setOption(option: echarts.EChartsOption) {
    chart.value?.setOption(option, { notMerge: true });
  }

  function resize() {
    chart.value?.resize();
  }

  function dispose() {
    chart.value?.dispose();
    chart.value = null;
  }

  function setTheme(theme: string) {
    chart.value?.setTheme(theme);
  }

  return { chart, initChart, setOption, resize, dispose, setTheme };
}
