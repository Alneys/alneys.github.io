import { shallowRef } from 'vue';

import type { ECharts, EChartsOption } from 'echarts';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import { init, use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export function useGachaChart() {
  const chart = shallowRef<ECharts | null>(null);

  function initChart(el: HTMLElement) {
    if (!chart.value) {
      chart.value = init(el);
    }
    return chart.value;
  }

  function setOption(option: EChartsOption) {
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
