<template>
  <div id="view-mltd-event-parking">
    <h1 class="view-title">偶像大师百万现场 活动控分计算器</h1>
    <div class="al-divider"></div>
    <div style="margin-bottom: 1em">
      <el-alert type="error" :closable="false" show-icon>
        <h2>警告：本页面正在开发中，无法保证结果的准确性！</h2>
      </el-alert>
    </div>
    <div id="mltd-event-parking-form">
      <el-row :gutter="16">
        <el-col :lg="13" :sm="24">
          <el-form
            ref="formRef"
            :model="form"
            label-width="auto"
            label-position="top"
            style="max-width: 800px"
          >
            <el-form-item label="选择活动类型">
              <el-select v-model="form.eventType">
                <el-option label="Theater" value="theater"></el-option>
                <el-option label="Anniversary" value="anniversary"></el-option>
                <el-option label="Tour" value="tour" disabled></el-option>
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
            <el-form-item label=" ">
              <el-space wrap>
                <el-button type="primary" @click="handleSubmit">开始计算</el-button>
                <el-button @click="handleClear">清空</el-button>
              </el-space>
            </el-form-item>
          </el-form>
          <el-alert
            v-show="form.eventType === 'anniversary'"
            type="warning"
            :closable="false"
            show-icon
          >
            <p style="font-size: var(--el-font-size-base)">
              注意：周年活动有每日推荐曲和普通曲的区别
            </p>
          </el-alert>
        </el-col>
        <el-col :span="0.1" class="hidden-sm-and-down">
          <div class="al-divider-vertical" style="margin: 0 0.5%"></div>
        </el-col>
        <el-col :lg="0" :sm="24">
          <div class="al-divider"></div>
        </el-col>
        <el-col :lg="10" :sm="24">
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
                  <el-table-column prop="name" label="曲目" header-align="center" align="center" />
                  <el-table-column
                    prop="multiplier"
                    label="倍率"
                    header-align="center"
                    align="center"
                  />
                  <el-table-column prop="count" label="次数" header-align="center" align="right" />
                  <el-table-column prop="pt" label="pt" header-align="center" align="right" />
                  <el-table-column prop="token" label="道具" header-align="center" align="right" />
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
    <!-- <div class="al-divider"></div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed } from 'vue';
import type { FormInstance } from 'element-plus';
import { useMltdUtils } from './composables/useMltdUtils';

const { eventTheaterChoices } = useMltdUtils();

const formRef = ref<FormInstance | null>();

interface formCheckedInterface {
  eventType: string;
  targetPt: number;
  pt: number;
  token: number;
}

type formType = { [P in keyof formCheckedInterface]: formCheckedInterface[P] | undefined };

const form = reactive<formType>({
  eventType: 'theater',
  targetPt: undefined,
  pt: undefined,
  token: undefined,
});

const calculatedFlag = ref(false);
const calculatedForm = ref(form);

interface resultItemInterface {
  name: string;
  multiplier: string;
  value: number;
}

const parkingResult = ref<{
  flag: boolean;
  message?: string;
  result?: Array<resultItemInterface>;
}>();

// 格式化数字
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// 当前状态表格数据
const statusTableData = computed(() => [
  {
    item: 'pt差距',
    value: `${formatNumber((form.targetPt ?? 0) - (form.pt ?? 0))} pt`,
  },
  {
    item: '当前道具',
    value: `${formatNumber(form.token ?? 0)} 个`,
  },
]);

// 控分方案表格数据
interface PlanTableRow {
  name: string;
  multiplier: string;
  count: number;
  pt: string;
  token: string;
  ptRaw: number;
  tokenRaw: number;
  highlight?: boolean;
}

const planTableData = computed<PlanTableRow[]>(() => {
  if (!parkingResult.value?.result) return [];

  const data: PlanTableRow[] = parkingResult.value.result.map((item) => {
    const choice = eventTheaterChoices.value.find(
      (c) => c.name === item.name && c.multiplier === item.multiplier,
    );
    const ptTotal = (choice?.pt ?? 0) * item.value;
    const tokenTotal = (choice?.token ?? 0) * item.value;

    return {
      name: item.name,
      multiplier: item.multiplier,
      count: item.value,
      pt: `+${formatNumber(ptTotal)}`,
      token: tokenTotal >= 0 ? `+${formatNumber(tokenTotal)}` : formatNumber(tokenTotal),
      ptRaw: ptTotal,
      tokenRaw: tokenTotal,
    };
  });

  // 汇总行
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const totalPt = data.reduce((sum, item) => sum + item.ptRaw, 0);
  const totalToken = data.reduce((sum, item) => sum + item.tokenRaw, 0);

  data.push({
    name: '汇总',
    multiplier: '',
    count: totalCount,
    pt: `+${formatNumber(totalPt)}`,
    token: totalToken >= 0 ? `+${formatNumber(totalToken)}` : formatNumber(totalToken),
    ptRaw: totalPt,
    tokenRaw: totalToken,
    highlight: true,
  });

  return data;
});

// 表格行样式
function highlightRowClassName({ row }: { row: any }) {
  return row.highlight ? 'highlight-row' : '';
}

// 表格单元格样式
function monoCellClassName({ column }: { column: any }) {
  const monoColumnProps = ['value', 'count', 'pt', 'token'];
  return monoColumnProps.includes(column.property) ? 'font-mono' : '';
}

function handleClear() {
  formRef.value?.resetFields();
  calculatedFlag.value = false;

  nextTick(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function handleSubmit() {
  preprocessingForm();
  calculatedForm.value = { ...form };
  if (form.eventType === 'theater' || form.eventType === 'anniversary') {
    parkingResult.value = await calcParkingTheater(
      form as formCheckedInterface,
      form.eventType === 'anniversary',
    );
  }
  calculatedFlag.value = true;

  nextTick(() => {
    document.getElementById('mltd-event-parking-result')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function preprocessingForm() {
  Object.keys(form).forEach((each) => {
    const key = each as keyof typeof form;
    if (key !== 'eventType') {
      form[key] = Number(form[key]) || 0;
    }
  });
}

async function calcParkingTheater(
  form: { targetPt: number; pt: number; token: number },
  isAnniversary = false,
): Promise<{
  flag: boolean;
  message?: string;
  result?: Array<resultItemInterface>;
}> {
  if (form.pt >= form.targetPt) {
    return { flag: false, message: '当前pt已达到或超过目标pt' };
  }
  if (form.targetPt - form.pt > 10000) {
    return { flag: false, message: 'pt差距大于10000，请缩小后重试' };
  }

  // 过滤可用的选择项
  const choices = eventTheaterChoices.value.filter(
    (each) => isAnniversary || each.anniversaryOnly !== true,
  );

  // 栈节点结构
  interface StackNode {
    ptDiff: number; // pt 差距（负数表示还需要多少）
    token: number;
    stepIndex: number; // 下一个要尝试的步骤索引
    viaStepIndex?: number; // 到达此状态所用的步骤索引
  }

  let iterations = 0;
  const stack: StackNode[] = [{ ptDiff: form.pt - form.targetPt, token: form.token, stepIndex: 0 }];

  while (stack.length) {
    // 防阻塞：每 100000 次迭代让出执行权
    iterations++;
    if (iterations % 100000 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }

    const top = stack[stack.length - 1]!;

    // 所有步骤都尝试过了，回溯
    if (top.stepIndex >= choices.length) {
      stack.pop();
      continue;
    }

    // 获取当前要尝试的步骤
    const currentStepIndex = top.stepIndex;
    top.stepIndex++; // 下次尝试下一个步骤

    const choice = choices[currentStepIndex]!;

    // 检查 token 是否足够
    if (top.token < -choice.token) {
      continue;
    }

    // 计算新状态
    const newPtDiff = top.ptDiff + choice.pt;
    const newToken = top.token + choice.token;

    // 剪枝：pt 超过目标
    if (newPtDiff > 0) {
      continue;
    }

    // 找到解
    if (newPtDiff === 0) {
      stack.push({
        ptDiff: newPtDiff,
        token: newToken,
        stepIndex: 0,
        viaStepIndex: currentStepIndex,
      });
      break;
    }

    // 继续深入搜索
    stack.push({
      ptDiff: newPtDiff,
      token: newToken,
      stepIndex: 0,
      viaStepIndex: currentStepIndex,
    });
  }

  // 提取结果
  const lastNode = stack[stack.length - 1];
  if (stack.length && lastNode && lastNode.ptDiff === 0) {
    // 统计每个步骤使用的次数
    const record: Record<string, number> = {};
    for (const node of stack) {
      if (node.viaStepIndex !== undefined) {
        record[node.viaStepIndex] = (record[node.viaStepIndex] ?? 0) + 1;
      }
    }

    const result: Array<resultItemInterface> = [];
    for (const [key, value] of Object.entries(record)) {
      if (value > 0) {
        const choice = choices[Number(key)]!;
        result.push({
          name: choice.name,
          multiplier: choice.multiplier,
          value,
        });
      }
    }

    return { flag: true, result };
  }

  return { flag: false, message: '不存在控分方案' };
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

    .el-table__cell {
      padding: 8px 10px;
      min-width: 80px;
    }

    .font-mono {
      font-family: var(--al-font-family-mono);
    }
  }

  :deep(.highlight-row) {
    color: var(--el-color-danger);

    .el-table__cell {
      font-weight: bold;
    }
  }
}
</style>
