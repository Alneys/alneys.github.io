<template>
  <div id="view-mltd-event-parking">
    <h1 class="view-title">偶像大师百万现场 活动控分计算器</h1>
    <div class="al-divider"></div>
    <div id="mltd-event-parking-form">
      <el-row :gutter="16">
        <el-col :lg="11" :sm="24">
          <el-form ref="formRef" :model="form" label-width="auto" label-position="top">
            <el-form-item label="选择活动类型">
              <el-select v-model="form.eventType">
                <el-option label="Theater" value="theater"></el-option>
                <el-option label="Tour" value="tour"></el-option>
                <el-option label="Anniversary" value="anniversary"></el-option>
                <el-option label="Trust" value="trust"></el-option>
                <el-option label="Tune" value="tune"></el-option>
                <el-option label="其他活动开发中" value="disabled" disabled></el-option>
                <!-- 1: Showtime -->
                <!-- 2: Millicolle! -->
                <!-- 3: Theater / Trust -->
                <!-- 4: Tour / Tour Bingo -->
                <!-- 5: Anniversary -->
                <!-- 6: Working -->
                <!-- 7: April Fool -->
                <!-- 8: Game Corner -->
                <!-- 9: Millicolle! (Box Gasha) -->
                <!-- 10: Twin Stage (High Score by Song) -->
                <!-- 11: Tune -->
                <!-- 12: Twin Stage (Total High Score) -->
                <!-- 13: Tale / Time / Team -->
                <!-- 14: Talk Party -->
                <!-- 16: Treasure -->
              </el-select>
            </el-form-item>
            <el-row :gutter="16" @keyup.enter="handleSubmit">
              <el-col :span="8" :xs="24">
                <el-form-item label="目标pt" prop="targetPt">
                  <template #label><b>目标pt</b></template>
                  <el-input
                    v-model.number="form.targetPt"
                    :min="0"
                    :max="99999999"
                    type="number"
                    maxlength="8"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>pt</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="当前pt" prop="pt">
                  <el-input
                    v-model.number="form.pt"
                    :min="0"
                    :max="99999999"
                    type="number"
                    maxlength="8"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>pt</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="道具数" prop="token">
                  <el-input
                    v-model.number="form.token"
                    :min="0"
                    :max="999999"
                    type="number"
                    maxlength="6"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>个</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row v-if="form.eventType === 'tune'" :gutter="16">
              <el-col :span="8" :xs="24">
                <el-form-item label="获得pt加成" prop="bonus">
                  <template #label><b>获得pt加成</b></template>
                  <el-input
                    v-model.number="form.bonus"
                    :min="0"
                    :max="30"
                    type="number"
                    inputmode="numeric"
                    placeholder="30"
                  >
                    <template #append>%</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item label="活动折返">
                  <el-switch v-model="form.isBoostPeriod" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row v-if="form.eventType === 'tour'" :gutter="16">
              <el-col :span="6" :xs="24">
                <el-form-item label="道具进度" prop="itemProgress">
                  <template #label><b>道具进度</b></template>
                  <el-input
                    v-model.number="form.itemProgress"
                    :min="0"
                    :max="19"
                    type="number"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>/20</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6" :xs="24">
                <el-form-item label="Live进度" prop="liveProgress">
                  <el-input
                    v-model.number="form.liveProgress"
                    :min="0"
                    :max="40"
                    type="number"
                    inputmode="numeric"
                    placeholder="0"
                  >
                    <template #append>/40</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6" :xs="24">
                <el-form-item label="已折返">
                  <el-switch v-model="form.isBoostPeriod" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="打工票使用更多倍率（默认只使用最大倍率）">
              <el-switch v-model="form.enableExtraChoices" />
            </el-form-item>
            <el-form-item label=" ">
              <el-space wrap>
                <el-button type="primary" @click="handleSubmit">开始计算</el-button>
                <el-button @click="handleClear">清空</el-button>
              </el-space>
            </el-form-item>
            <el-alert
              v-if="currentNotices.length > 0"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 1em"
            >
              <ul
                style="
                  margin: 0;
                  padding-left: 1.5em;
                  font-size: var(--el-font-size-base);
                  line-height: 1.5;
                "
              >
                <li v-for="(notice, index) in currentNotices" :key="index">
                  {{ notice }}
                </li>
              </ul>
            </el-alert>
            <el-alert
              v-if="currentTips.length > 0"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 1em"
            >
              <ul
                style="
                  margin: 0;
                  padding-left: 1.5em;
                  font-size: var(--el-font-size-base);
                  line-height: 1.5;
                "
              >
                <li v-for="(tip, index) in currentTips" :key="index">{{ tip }}</li>
              </ul>
            </el-alert>

            <!-- 分数表折叠面板 -->
            <el-collapse v-model="activeCollapse" style="--el-collapse-header-font-size: 16px">
              <el-collapse-item title="分数表" name="pointTable">
                <el-table :data="pointTableData" border :cell-class-name="monoCellClassName">
                  <el-table-column
                    prop="name"
                    label="曲目"
                    header-align="center"
                    align="left"
                    min-width="120"
                  />
                  <el-table-column
                    prop="type"
                    label="类型"
                    header-align="center"
                    align="center"
                    min-width="70"
                  />
                  <el-table-column
                    prop="multiplier"
                    label="倍率"
                    header-align="center"
                    align="center"
                    min-width="70"
                  />
                  <el-table-column
                    prop="pt"
                    label="获得pt"
                    header-align="center"
                    align="right"
                    min-width="70"
                  />
                  <el-table-column
                    prop="token"
                    label="道具"
                    header-align="center"
                    align="right"
                    min-width="70"
                  />
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </el-form>
        </el-col>
        <el-col :span="0.1" class="hidden-sm-and-down">
          <div class="al-divider-vertical" style="margin: 0 0.5%"></div>
        </el-col>
        <el-col :lg="0" :sm="24">
          <div class="al-divider"></div>
        </el-col>
        <el-col :lg="12" :sm="24">
          <div id="mltd-event-parking-result" style="margin-bottom: 2em">
            <h2>结果</h2>

            <!-- 错误提示 -->
            <el-alert
              v-if="calculatedFlag && parkingResult?.flag === false"
              type="error"
              :closable="false"
              style="margin-bottom: 1em"
            >
              控分失败：{{ parkingResult.message }}
            </el-alert>

            <!-- 成功结果 -->
            <template v-if="calculatedFlag && parkingResult?.flag === true">
              <!-- 当前状态卡片 -->
              <el-card class="mltd-parking-result-card" shadow="never">
                <template #header>当前状态</template>
                <el-table :data="statusTableData" border :cell-class-name="monoCellClassName">
                  <el-table-column prop="item" label="项目" header-align="center" align="center" />
                  <el-table-column prop="value" label="数值" header-align="center" align="right" />
                </el-table>
              </el-card>

              <!-- 控分方案卡片 -->
              <el-card class="mltd-parking-result-card" shadow="never">
                <template #header>控分方案</template>
                <el-table
                  :data="planTableData"
                  border
                  :row-class-name="highlightRowClassName"
                  :cell-class-name="monoCellClassName"
                >
                  <el-table-column prop="name" label="曲目" header-align="center" align="center">
                    <template #default="{ row }">
                      <span v-if="row.isRecommended">
                        {{ row.name.replace('推荐曲', '')
                        }}<span class="recommended-text">推荐曲</span>
                      </span>
                      <span v-else>{{ row.name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="类型" header-align="center" align="center" />
                  <el-table-column
                    prop="multiplier"
                    label="倍率"
                    header-align="center"
                    align="center"
                  />
                  <el-table-column prop="count" label="次数" header-align="center" align="right" />
                  <el-table-column prop="pt" label="pt" header-align="center" align="right" />
                  <el-table-column prop="token" label="道具" header-align="center" align="right" />
                  <el-table-column label="操作" header-align="center" align="center" min-width="80">
                    <template #default="{ row }">
                      <el-button-group v-if="!row.highlight && row.rawItem">
                        <el-button
                          :icon="Plus"
                          size="small"
                          :disabled="row.count >= getInitialCount(row.rawItem)"
                          @click="undoOperation(row.rawItem)"
                        />
                        <el-button
                          :icon="Minus"
                          size="small"
                          :disabled="row.count <= 0"
                          @click="executeOperation(row.rawItem)"
                        />
                      </el-button-group>
                      <el-button
                        v-if="row.highlight"
                        :icon="RefreshRight"
                        size="small"
                        :disabled="!hasExecutedOperations"
                        @click="resetToInitial"
                      >
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </template>

            <!-- 等待输入 -->
            <el-alert v-if="!calculatedFlag" type="info" :closable="false">
              请输入数据后点击「开始计算」
            </el-alert>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, useTemplateRef, watch } from 'vue';
import { Minus, Plus, RefreshRight } from '@element-plus/icons-vue';
import { useMltdEventParking, createDefaultParkingForm } from './composables/useMltdEventParking';
import { EVENT_PARKING_TIPS, EVENT_PARKING_NOTICES } from './data/MltdEventParkingConstant';
import type { ParkingForm, EventTheaterChoice, ParkingResultItem } from './MltdTypes';

const form = ref<ParkingForm>(createDefaultParkingForm());
const activeCollapse = ref<string[]>([]);

const {
  calculatedFlag,
  parkingResult,
  formSnapshot,
  parkingResultSnapshot,
  executedCounts,
  eventTheaterChoices,
  handleClear: clearCalculation,
  handleSubmit: submitCalculation,
  executeOperation,
  undoOperation,
  getRemainingCount,
  getInitialCount,
  resetToInitial,
} = useMltdEventParking(form);

const formRef = useTemplateRef('formRef');

// 监听活动类型变化，清空计算结果
watch(
  () => form.value.eventType,
  () => {
    clearCalculation();
  },
);

// 格式化数字
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// 格式化 token（正确处理 0 和负数）
function formatToken(n: number): string {
  if (n === 0 || Object.is(n, -0)) return '0';
  if (n > 0) return `+${formatNumber(n)}`;
  return formatNumber(n); // 负数已经带有负号
}

// 是否有已执行的操作（用于重置按钮的禁用状态）
const hasExecutedOperations = computed(() => {
  return Object.values(executedCounts.value).some((count) => count > 0);
});

// 当前活动类型的注意事项
const currentNotices = computed(() => {
  const eventType = form.value.eventType;
  if (
    eventType === 'theater' ||
    eventType === 'anniversary' ||
    eventType === 'trust' ||
    eventType === 'tune' ||
    eventType === 'tour'
  ) {
    return EVENT_PARKING_NOTICES[eventType];
  }
  return [];
});

// 当前活动类型的提示信息
const currentTips = computed(() => {
  const eventType = form.value.eventType;
  if (
    eventType === 'theater' ||
    eventType === 'anniversary' ||
    eventType === 'trust' ||
    eventType === 'tune' ||
    eventType === 'tour'
  ) {
    return EVENT_PARKING_TIPS[eventType];
  }
  return [];
});

// 当前状态表格数据
const statusTableData = computed(() => {
  const targetPt = formSnapshot.value?.targetPt ?? form.value.targetPt ?? 0;
  const pt = form.value.pt ?? 0;
  const token = form.value.token ?? 0;

  // Tour 活动专属状态行
  if (form.value.eventType === 'tour') {
    return [
      {
        item: 'pt差距',
        value: `${formatNumber(targetPt - pt)} pt`,
      },
      {
        item: '当前道具',
        value: `${formatNumber(token)} 个`,
      },
      {
        item: '道具进度',
        value: `${form.value.itemProgress ?? 0}/20`,
      },
      {
        item: 'Live进度',
        value: `${form.value.liveProgress ?? 0}`,
      },
      {
        item: '折返状态',
        value: form.value.isBoostPeriod ? '已折返' : '未折返',
      },
    ];
  }

  // 其他活动类型的标准状态行
  return [
    {
      item: 'pt差距',
      value: `${formatNumber(targetPt - pt)} pt`,
    },
    {
      item: '当前道具',
      value: `${formatNumber(token)} 个`,
    },
  ];
});

// 控分方案表格数据
interface PlanTableRow {
  name: string;
  type: string;
  multiplier: string;
  count: number;
  pt: string;
  token: string;
  ptRaw: number;
  tokenRaw: number;
  highlight?: boolean;
  isRecommended?: boolean;
  // 用于操作列
  rawItem?: ParkingResultItem;
}

const planTableData = computed<PlanTableRow[]>(() => {
  if (!parkingResult.value?.result) return [];

  const data: PlanTableRow[] = parkingResult.value.result.map((item) => {
    const choice = eventTheaterChoices.value.find(
      (c: EventTheaterChoice) => c.name === item.name && c.multiplier === item.multiplier,
    );
    const remainingCount = getRemainingCount(item);
    const ptTotal = (choice?.pt ?? 0) * remainingCount;

    // Tour 活动：歌曲游玩显示进度带来的道具收益
    let tokenTotal: number;
    let tokenDisplay: string;
    if (form.value.eventType === 'tour' && choice?.progress && choice.progress > 0) {
      // 歌曲游玩增加进度，计算总进度
      const progressTotal = choice.progress * remainingCount;
      tokenTotal = Math.floor(progressTotal / 20); // 完整道具数量
      tokenDisplay = `+${progressTotal}/20`;
    } else {
      tokenTotal = (choice?.token ?? 0) * remainingCount;
      tokenDisplay = formatToken(tokenTotal);
    }

    return {
      name: item.name,
      type: choice?.type ?? '',
      multiplier: item.multiplier,
      count: remainingCount,
      pt: `+${formatNumber(ptTotal)}`,
      token: tokenDisplay,
      ptRaw: ptTotal,
      tokenRaw: tokenTotal,
      rawItem: item,
      isRecommended: form.value.eventType === 'anniversary' && item.name.includes('推荐曲'),
    };
  });

  // 汇总行
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const totalPt = data.reduce((sum, item) => sum + item.ptRaw, 0);
  const totalToken = data.reduce((sum, item) => sum + item.tokenRaw, 0);

  // Tour 活动：汇总行需要特殊处理进度和道具
  let totalTokenDisplay: string;
  if (form.value.eventType === 'tour') {
    // 计算总进度（从所有歌曲游玩中）
    let totalProgress = 0;
    for (const row of data) {
      const choice = eventTheaterChoices.value.find(
        (c: EventTheaterChoice) => c.name === row.name && c.multiplier === row.multiplier,
      );
      if (choice?.progress && choice.progress > 0) {
        totalProgress += choice.progress * row.count;
      }
    }
    // 计算进度转换后的道具数量
    const progressTokens = Math.floor(totalProgress / 20);
    const progressRemainder = totalProgress % 20;

    // Event Live 消耗的道具
    const eventLiveToken = data.reduce((sum, row) => {
      const choice = eventTheaterChoices.value.find(
        (c: EventTheaterChoice) => c.name === row.name && c.multiplier === row.multiplier,
      );
      if (choice?.token && choice.token < 0) {
        return sum + choice.token * row.count;
      }
      return sum;
    }, 0);

    // 合并道具变化：进度获得的道具 + Event Live消耗的道具
    const netTokenChange = progressTokens + eventLiveToken;

    // 组合显示：净道具变化 + 剩余进度
    const parts: string[] = [];
    parts.push(formatToken(netTokenChange));
    if (progressRemainder > 0) {
      parts.push(`(进度${progressRemainder}/20)`);
    }
    totalTokenDisplay = parts.join(' ');
  } else {
    totalTokenDisplay = formatToken(totalToken);
  }

  data.push({
    name: '汇总',
    type: '',
    multiplier: '',
    count: totalCount,
    pt: `+${formatNumber(totalPt)}`,
    token: totalTokenDisplay,
    ptRaw: totalPt,
    tokenRaw: totalToken,
    highlight: true,
  });

  return data;
});

// 分数表数据
const pointTableData = computed(() => {
  return eventTheaterChoices.value.map((choice) => {
    // Tour 活动：歌曲游玩显示进度带来的道具收益
    let tokenDisplay: string;
    if (form.value.eventType === 'tour' && choice.progress && choice.progress > 0) {
      // 歌曲游玩增加进度，显示为 "+进度/20"
      tokenDisplay = `+${choice.progress}/20`;
    } else {
      tokenDisplay = formatToken(choice.token);
    }

    return {
      name: choice.name,
      type: choice.type ?? '',
      multiplier: choice.multiplier,
      pt: choice.pt.toLocaleString('en-US'),
      token: tokenDisplay,
    };
  });
});

// 表格行样式
function highlightRowClassName({ row }: { row: PlanTableRow }) {
  return row.highlight ? 'highlight-row' : '';
}

// 表格单元格样式
function monoCellClassName({ column }: { column: any }) {
  const monoColumnProps = ['value', 'count', 'pt', 'token'];
  return monoColumnProps.includes(column.property) ? 'font-mono' : '';
}

function handleClear() {
  formRef.value?.resetFields();
  clearCalculation();

  nextTick(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function handleSubmit() {
  await submitCalculation();

  nextTick(() => {
    document.getElementById('mltd-event-parking-result')?.scrollIntoView({ behavior: 'smooth' });
  });
}
</script>

<style lang="scss" scoped>
:deep() {
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    appearance: textfield;
  }
}

.mltd-parking-result-card {
  margin-bottom: 1em;
  --border-color: var(--el-border-color);

  :deep(.el-card__header) {
    padding: 8px;
    line-height: 23px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    text-align: center;
    background-color: var(--el-color-primary-light-3);
    border-top: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    border-left: 1px solid var(--border-color);
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    --el-table-border-color: var(--border-color);
    --el-table-text-color: var(--el-text-color-primary);
    --el-table-header-text-color: var(--el-text-color-primary);

    .el-table__header th {
      background-color: var(--el-color-primary-light-3);
    }

    .font-mono .cell {
      padding: 0 8px;
    }
  }

  :deep(.highlight-row) {
    color: var(--el-color-danger);

    .el-table__cell {
      font-weight: bold;
    }
  }

  :deep(.recommended-text) {
    color: var(--el-color-danger);
  }
}
</style>
