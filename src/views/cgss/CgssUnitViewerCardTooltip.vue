<template>
  <el-tooltip placement="top" :show-after="640">
    <template #content>
      <div style="font-size: 14px">
        <span v-if="card.title">{{ card.title }}</span>
        <br />
        <span v-if="card.attribute" :class="`color-cg-${card.attribute.toLowerCase()} is-bold`">
          {{ card.attribute }}
        </span>
        <br />
        <span :class="`color-cg-vocal ${isVocalBold ? 'is-bold' : ''} ${props.isVocalUnderlined ? 'is-underline' : ''}`">
          {{ card.vocal || 0 }}
        </span>
        &nbsp;
        <span :class="`color-cg-dance ${isDanceBold ? 'is-bold' : ''} ${props.isDanceUnderlined ? 'is-underline' : ''}`">
          {{ card.dance || 0 }}
        </span>
        &nbsp;
        <span :class="`color-cg-visual ${isVisualBold ? 'is-bold' : ''} ${props.isVisualUnderlined ? 'is-underline' : ''}`">
          {{ card.visual || 0 }}
        </span>
        <br />
        <span class="is-bold">{{ card.skill || 0 }}</span>
        &nbsp;
        <span class="is-bold">{{ card.tw || 0 }}</span>
      </div>
    </template>
    <slot></slot>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface CardData {
  title?: string;
  attribute?: string;
  vocal?: number;
  dance?: number;
  visual?: number;
  skill?: number;
  tw?: number;
}

const props = defineProps<{
  card: CardData;
  isVocalUnderlined?: boolean;
  isDanceUnderlined?: boolean;
  isVisualUnderlined?: boolean;
}>();

// 使用计算属性来计算总和和判断加粗状态
const totalStats = computed(() => {
  const { vocal, dance, visual } = props.card;
  // 检查是否所有值都是有效的数字
  if (typeof vocal !== 'number' || typeof dance !== 'number' || typeof visual !== 'number') {
    return 0;
  }
  return vocal + dance + visual;
});

const isVocalBold = computed(() =>
  props.card.vocal && totalStats.value > 0 ? props.card.vocal / totalStats.value > 0.35 : false,
);

const isDanceBold = computed(() =>
  props.card.dance && totalStats.value > 0 ? props.card.dance / totalStats.value > 0.35 : false,
);

const isVisualBold = computed(() =>
  props.card.visual && totalStats.value > 0 ? props.card.visual / totalStats.value > 0.35 : false,
);
</script>

<style scoped>
.is-bold {
  font-weight: bold;
}
.is-underline {
  text-decoration: underline;
}
</style>
