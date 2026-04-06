<template>
  <el-tooltip placement="top" :show-after="640">
    <template #content>
      <div class="tooltip-card font-jp">
        <span v-if="card.title">{{ `[${card.title}] ${card.name}` || '?' }}</span>
        <br />
        <span v-if="card.attribute" :class="`color-cg-${card.attribute.toLowerCase()} is-bold`">
          {{ card.attribute || '?' }}
        </span>
        <br />
        <span
          :class="`color-cg-vocal ${isVocalBold ? 'is-bold' : ''} ${props.isVocalUnderlined ? 'is-underline' : ''}`"
        >
          {{ card.stats?.vocal || '?' }}
        </span>
        &nbsp;
        <span
          :class="`color-cg-dance ${isDanceBold ? 'is-bold' : ''} ${props.isDanceUnderlined ? 'is-underline' : ''}`"
        >
          {{ card.stats?.dance || '?' }}
        </span>
        &nbsp;
        <span
          :class="`color-cg-visual ${isVisualBold ? 'is-bold' : ''} ${props.isVisualUnderlined ? 'is-underline' : ''}`"
        >
          {{ card.stats?.visual || '?' }}
        </span>
        <br />
        <span class="is-bold">{{
          card.skill ? (SKILL_NAME_MAPPING[card.skill.type] ?? card.skill.type) : ''
        }}</span>
        &nbsp;
        <span class="is-bold">{{ card.skill?.params?.tw || '' }}s</span>
      </div>
    </template>
    <slot></slot>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  type CgssCardSkillTableItem,
  SKILL_NAME_MAPPING,
  STATS_BOLD_THRESHOLD,
} from './CgssUnitViewerTypes';

// 传入属性
const props = defineProps<{
  card: CgssCardSkillTableItem;
  isVocalUnderlined?: boolean;
  isDanceUnderlined?: boolean;
  isVisualUnderlined?: boolean;
}>();

const totalStats = computed(() => {
  const { vocal, dance, visual } = props.card.stats || { vocal: 0, dance: 0, visual: 0 };
  if (typeof vocal !== 'number' || typeof dance !== 'number' || typeof visual !== 'number') {
    return 0;
  }
  return vocal + dance + visual;
});

const isVocalBold = computed(() =>
  props.card.stats?.vocal && totalStats.value > 0
    ? props.card.stats.vocal / totalStats.value > STATS_BOLD_THRESHOLD
    : false,
);

const isDanceBold = computed(() =>
  props.card.stats?.dance && totalStats.value > 0
    ? props.card.stats.dance / totalStats.value > STATS_BOLD_THRESHOLD
    : false,
);

const isVisualBold = computed(() =>
  props.card.stats?.visual && totalStats.value > 0
    ? props.card.stats.visual / totalStats.value > STATS_BOLD_THRESHOLD
    : false,
);
</script>

<style scoped lang="scss">
.tooltip-card {
  font-size: 14px;
}
.is-bold {
  font-weight: bold;
}
.is-underline {
  text-decoration: underline;
}
</style>
