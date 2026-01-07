<!-- CgssUnitViewerCardTooltip.vue -->
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
        <span :class="`color-cg-vocal ${isVocalBold ? 'is-bold is-underline' : ''}`">
          {{ card.vocal || 0 }}
        </span>
        &nbsp;
        <span :class="`color-cg-dance ${isDanceBold ? 'is-bold is-underline' : ''}`">
          {{ card.dance || 0 }}
        </span>
        &nbsp;
        <span :class="`color-cg-visual ${isVisualBold ? 'is-bold is-underline' : ''}`">
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
interface CardData {
  title?: string;
  attribute?: string;
  vocal?: number;
  dance?: number;
  visual?: number;
  skill?: number;
  tw?: number;
}

defineProps<{
  card: CardData;
  isVocalBold: boolean;
  isDanceBold: boolean;
  isVisualBold: boolean;
}>();
</script>

<style scoped>
/* 如果父组件已定义 color-cg-* 等样式，此处通常无需重复定义 */
.is-bold {
  font-weight: bold;
}
.is-underline {
  text-decoration: underline;
}
</style>
