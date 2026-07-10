<template>
  <el-collapse v-model="activeNames" class="hold-stats-collapse">
    <el-collapse-item :title="panelTitle" name="stats">
      <template v-if="isToggleMode">
        <div class="stats-switch">
          <el-switch v-model="showDetail" active-text="显示偏科明细" />
        </div>

        <!-- 变换 & 交互 -->
        <div class="stats-section">
          <h3 class="stats-section-title">变换 &amp; 交互</h3>
          <el-row :gutter="8">
            <el-col
              v-for="seconds in ALT_MUT_SECONDS"
              :key="seconds"
              :span="12"
              :xs="24"
              class="seconds-block"
            >
              <table class="stats-matrix">
                <thead>
                  <tr>
                    <th class="seconds-header">{{ seconds }}s</th>
                    <th class="color-cg-cute">Cute</th>
                    <th class="color-cg-cool">Cool</th>
                    <th class="color-cg-passion">Passion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="skillType in ALT_MUT_TYPES" :key="skillType">
                    <td class="matrix-row-header">{{ SKILL_TYPE_LABELS[skillType] }}</td>
                    <td v-for="attr in ATTRIBUTES" :key="attr" class="matrix-cell">
                      <span v-if="getCell(skillType, seconds, attr)" class="cell-content">
                        <template v-if="showDetail">
                          <span class="color-cg-vocal">{{
                            getCell(skillType, seconds, attr)!.vocal
                          }}</span>
                          &nbsp;/&nbsp;
                          <span class="color-cg-dance">{{
                            getCell(skillType, seconds, attr)!.dance
                          }}</span>
                          &nbsp;/&nbsp;
                          <span class="color-cg-visual">{{
                            getCell(skillType, seconds, attr)!.visual
                          }}</span>
                        </template>
                        <template v-else>
                          {{ getCell(skillType, seconds, attr)!.total }}
                        </template>
                      </span>
                      <span v-else class="cell-empty">&mdash;</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </el-col>
          </el-row>
        </div>

        <div class="section-divider"></div>

        <!-- 过载 & 超载 -->
        <div class="stats-section">
          <h3 class="stats-section-title">过载 &amp; 超载</h3>
          <el-row :gutter="8">
            <el-col
              v-for="seconds in OVL_OVD_SECONDS"
              :key="seconds"
              :span="12"
              :xs="24"
              class="seconds-block"
            >
              <table class="stats-matrix">
                <thead>
                  <tr>
                    <th class="seconds-header">{{ seconds }}s</th>
                    <th class="color-cg-cute">Cute</th>
                    <th class="color-cg-cool">Cool</th>
                    <th class="color-cg-passion">Passion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="skillType in OVL_OVD_TYPES" :key="skillType">
                    <td class="matrix-row-header">{{ SKILL_TYPE_LABELS[skillType] }}</td>
                    <td v-for="attr in ATTRIBUTES" :key="attr" class="matrix-cell">
                      <span v-if="getCell(skillType, seconds, attr)" class="cell-content">
                        <template v-if="showDetail">
                          <span class="color-cg-vocal">{{
                            getCell(skillType, seconds, attr)!.vocal
                          }}</span>
                          &nbsp;/&nbsp;
                          <span class="color-cg-dance">{{
                            getCell(skillType, seconds, attr)!.dance
                          }}</span>
                          &nbsp;/&nbsp;
                          <span class="color-cg-visual">{{
                            getCell(skillType, seconds, attr)!.visual
                          }}</span>
                        </template>
                        <template v-else>
                          {{ getCell(skillType, seconds, attr)!.total }}
                        </template>
                      </span>
                      <span v-else class="cell-empty">&mdash;</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </el-col>
          </el-row>
        </div>
      </template>
      <div v-else class="stats-prompt">
        请在配置面板中将「图标点击操作」切换为「卡片持有切换模式」以查看持有统计
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import { STATS_BOLD_THRESHOLD } from '../CgssUnitViewerTypes';
import type { CgssCardSkillTableItem } from '../CgssUnitViewerTypes';
import { useCardBrightness } from '../composables/useCardBrightness';

const props = defineProps<{
  originalData: CgssCardSkillTableItem[] | null;
  clickIconAction: string;
}>();

const { disabledCids } = useCardBrightness();

const isToggleMode = computed(() => props.clickIconAction === 'ToggleCardStatus');

const panelTitle = computed(() =>
  isToggleMode.value ? '持有卡片统计' : '持有卡片统计（需卡片持有切换模式）',
);

const activeNames = ref([]);
const showDetail = ref(true);

const ATTRIBUTES = ['Cute', 'Cool', 'Passion'] as const;
const ALT_MUT_TYPES = ['alternate', 'mutual'] as const;
const OVL_OVD_TYPES = ['overload', 'overdrive'] as const;
const ALT_MUT_SECONDS = [6, 9, 11, 13] as const;
const OVL_OVD_SECONDS = [4, 6, 7, 9] as const;

const SKILL_TYPE_LABELS: Record<string, string> = {
  alternate: '变换',
  mutual: '交互',
  overload: '过载',
  overdrive: '超载',
};

interface CellStats {
  total: number;
  vocal: number;
  dance: number;
  visual: number;
}

type StatsMap = Record<string, Record<number, Record<string, CellStats>>>;

const statsMap = computed<StatsMap>(() => {
  const map: StatsMap = {};
  if (!props.originalData) return map;

  const targetTypes = new Set<string>([...ALT_MUT_TYPES, ...OVL_OVD_TYPES]);

  for (const card of props.originalData) {
    const skillType = card.skill.type;
    if (!targetTypes.has(skillType)) continue;
    if (disabledCids.value.has(card.cid)) continue;

    const tw = card.skill.params.tw;
    const attr = card.attribute;

    if (!map[skillType]) map[skillType] = {};
    if (!map[skillType][tw]) map[skillType][tw] = {};
    if (!map[skillType][tw][attr]) {
      map[skillType][tw][attr] = { total: 0, vocal: 0, dance: 0, visual: 0 };
    }

    const cell = map[skillType][tw][attr];
    cell.total++;

    const totalStats = card.stats.vocal + card.stats.dance + card.stats.visual;
    if (totalStats > 0) {
      if (card.stats.vocal / totalStats > STATS_BOLD_THRESHOLD) cell.vocal++;
      if (card.stats.dance / totalStats > STATS_BOLD_THRESHOLD) cell.dance++;
      if (card.stats.visual / totalStats > STATS_BOLD_THRESHOLD) cell.visual++;
    }
  }

  return map;
});

function getCell(skillType: string, seconds: number, attribute: string): CellStats | undefined {
  return statsMap.value[skillType]?.[seconds]?.[attribute];
}
</script>

<style scoped lang="scss">
.hold-stats-collapse {
  margin: 1em 0;

  :deep(.el-collapse-item__header) {
    font-size: var(--el-font-size-base);
  }
}

.stats-switch {
  display: flex;
  gap: 0.5em;
  align-items: center;
  margin-bottom: 0.75em;
}

.stats-section {
  margin-bottom: 0.5em;
}

.stats-section-title {
  margin: 0 0 0.5em;
  font-size: var(--el-font-size-base);
}

.seconds-block {
  min-width: 0;
  padding-bottom: 8px;
}

.section-divider {
  height: 1px;
  margin: 0.75em 0;
  background: var(--el-border-color-light, #dcdfe6);
}

.stats-matrix {
  table-layout: fixed;
  border-collapse: collapse;
  width: 100%;
  font-size: var(--el-font-size-base);

  th,
  td {
    padding: 3px 4px;
    border: 1px solid var(--el-border-color-light, #dcdfe6);
    text-align: center;
  }

  th {
    font-weight: 600;
  }
}

.seconds-header {
  width: 3.5em;
}

.matrix-row-header {
  width: 3em;
  font-weight: 600;
  white-space: nowrap;
}

.matrix-cell {
  width: 80px;
}

.cell-content {
  font-weight: 700;
  white-space: nowrap;
}

.cell-empty {
  color: var(--el-text-color-placeholder, #c0c4cc);
}

.stats-prompt {
  padding: 1em 0;
  font-size: var(--el-font-size-base);
}
</style>
