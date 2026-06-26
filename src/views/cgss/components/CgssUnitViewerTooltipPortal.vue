<template>
  <el-tooltip
    :virtual-ref="triggerElement ?? undefined"
    virtual-triggering
    :visible="visible"
    placement="top"
    popper-class="cgss-unit-viewer-card-tooltip"
    @before-hide="emit('beforeHide')"
    @hide="emit('hide')"
  >
    <template #content>
      <div v-if="card" class="tooltip-card font-jp">
        <span v-if="card.title">{{ `[${card.title}] ${card.name}` }}</span>
        <br />
        <template v-if="card.skill?.type === 'dominant'">
          <span
            v-if="card.leaderSkill.params?.target_attribute_2"
            :class="`color-cg-${card.leaderSkill.params?.target_attribute_2.toLowerCase()} is-bold`"
          >
            {{ card.leaderSkill.params?.target_attribute_2 }}
          </span>
          /
        </template>
        <span v-if="card.attribute" :class="`color-cg-${card.attribute.toLowerCase()} is-bold`">
          {{ card.attribute }}
        </span>
        <br />
        <span
          :class="[
            'color-cg-vocal',
            { 'is-bold': isVocalBold, 'is-underline': underlineProps.vocal },
          ]"
        >
          {{ card.stats?.vocal }}
        </span>
        &nbsp;
        <span
          :class="[
            'color-cg-dance',
            { 'is-bold': isDanceBold, 'is-underline': underlineProps.dance },
          ]"
        >
          {{ card.stats?.dance }}
        </span>
        &nbsp;
        <span
          :class="[
            'color-cg-visual',
            { 'is-bold': isVisualBold, 'is-underline': underlineProps.visual },
          ]"
        >
          {{ card.stats?.visual }}
        </span>
        <br />
        <span class="is-bold">{{ SKILL_NAME_MAPPING[card.skill.type] ?? card.skill.type }}</span>
        &nbsp;
        <span class="is-bold">{{ card.skill?.params?.tw }}s</span>
      </div>
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { SKILL_NAME_MAPPING, STATS_BOLD_THRESHOLD } from '../CgssUnitViewerTypes';
import type { CgssCardSkillTableItem } from '../CgssUnitViewerTypes';
import type { UnderlineProps } from '../composables/useCardTooltip';

const props = defineProps<{
  visible: boolean;
  card: CgssCardSkillTableItem | null;
  triggerElement: HTMLElement | null;
  underlineProps: UnderlineProps;
}>();

const emit = defineEmits<{
  beforeHide: [];
  hide: [];
}>();

const totalStats = computed(() => {
  const { vocal, dance, visual } = props.card?.stats || { vocal: 0, dance: 0, visual: 0 };
  if (typeof vocal !== 'number' || typeof dance !== 'number' || typeof visual !== 'number') {
    return 0;
  }
  return vocal + dance + visual;
});

const isVocalBold = computed(() =>
  props.card?.stats?.vocal && totalStats.value > 0
    ? props.card.stats.vocal / totalStats.value > STATS_BOLD_THRESHOLD
    : false,
);

const isDanceBold = computed(() =>
  props.card?.stats?.dance && totalStats.value > 0
    ? props.card.stats.dance / totalStats.value > STATS_BOLD_THRESHOLD
    : false,
);

const isVisualBold = computed(() =>
  props.card?.stats?.visual && totalStats.value > 0
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

:global(.cgss-unit-viewer-card-tooltip) {
  transition: opacity 0.3s var(--el-transition-function-fast-bezier);
}
</style>
