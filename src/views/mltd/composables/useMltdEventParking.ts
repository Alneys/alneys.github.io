/**
 * 活动控分计算器组合式函数
 * 提供表单预处理、计算逻辑和状态管理
 */

import { ref, computed, type Ref } from 'vue';
import { MLTD_PARKING_CONSTANTS } from '../data/MltdEventParkingConstant';
import type {
  ParkingForm,
  ParkingResult,
  ParkingResultItem,
  EventTheaterChoice,
} from '../MltdTypes';

/**
 * 创建默认表单数据
 * @returns 默认的 ParkingForm 对象
 */
export const createDefaultParkingForm = (): ParkingForm => ({
  eventType: 'theater',
  targetPt: undefined,
  pt: undefined,
  token: undefined,
  enableExtraChoices: true,
});

/**
 * 活动控分计算器组合式函数
 * @param form - 表单数据引用
 * @returns 计算结果和操作方法
 */
export function useMltdEventParking(form: Ref<ParkingForm>) {
  // 根据活动类型返回对应的选择项列表，并根据开关过滤 extra 选项
  const eventTheaterChoices = computed<EventTheaterChoice[]>(() => {
    let choices: EventTheaterChoice[];
    if (form.value.eventType === 'anniversary') {
      choices = MLTD_PARKING_CONSTANTS.eventAnniversaryChoices;
    } else if (form.value.eventType === 'trust') {
      choices = MLTD_PARKING_CONSTANTS.eventTrustChoices;
    } else {
      choices = MLTD_PARKING_CONSTANTS.eventTheaterChoices;
    }

    // 当禁用更多倍率时，过滤掉 extra: true 的选项
    if (form.value.enableExtraChoices === false) {
      choices = choices.filter((c) => !c.extra);
    }

    return choices;
  });

  const calculatedFlag = ref(false);
  const parkingResult = ref<ParkingResult>();

  /** 计算时的表单数据快照 */
  const formSnapshot = ref<{ targetPt: number; pt: number; token: number }>();

  /** 初始方案快照（用于撤销操作的上限判断） */
  const parkingResultSnapshot = ref<ParkingResultItem[]>([]);

  /** 已执行次数记录（key: `${name}-${multiplier}`） */
  const executedCounts = ref<Record<string, number>>({});

  /**
   * 预处理表单数据
   * @description 将 undefined 字段转换为 0
   */
  const preprocessingForm = () => {
    const numericFields: (keyof ParkingForm)[] = ['targetPt', 'pt', 'token'];
    for (const key of numericFields) {
      (form.value as unknown as Record<string, number>)[key] = Number(form.value[key]) || 0;
    }
  };

  /**
   * 生成方案项的唯一标识 key
   */
  const getOperationKey = (item: ParkingResultItem): string => {
    return `${item.name}-${item.multiplier}`;
  };

  /**
   * 清除计算状态
   */
  const handleClear = () => {
    calculatedFlag.value = false;
    formSnapshot.value = undefined;
    parkingResultSnapshot.value = [];
    executedCounts.value = {};
  };

  /**
   * 重置执行状态（保留方案但清空执行记录）
   */
  const resetExecution = () => {
    executedCounts.value = {};
  };

  /**
   * 重置为初始状态（恢复表单数据并清空执行记录）
   */
  const resetToInitial = () => {
    if (!formSnapshot.value) return;
    form.value.pt = formSnapshot.value.pt;
    form.value.token = formSnapshot.value.token;
    executedCounts.value = {};
  };

  /**
   * 执行一次操作（模拟玩家进行游戏）
   * @param item - 方案项
   */
  const executeOperation = (item: ParkingResultItem) => {
    const key = getOperationKey(item);
    const snapshotItem = parkingResultSnapshot.value.find(
      (s) => s.name === item.name && s.multiplier === item.multiplier,
    );

    // 找到对应的 choice 获取 pt/token
    const choice = eventTheaterChoices.value.find(
      (c) => c.name === item.name && c.multiplier === item.multiplier,
    );
    if (!choice) return;

    // 更新表单数据
    form.value.pt = (form.value.pt ?? 0) + choice.pt;
    form.value.token = (form.value.token ?? 0) + choice.token;

    // 更新执行次数
    executedCounts.value[key] = (executedCounts.value[key] ?? 0) + 1;
  };

  /**
   * 撤销一次操作
   * @param item - 方案项
   */
  const undoOperation = (item: ParkingResultItem) => {
    const key = getOperationKey(item);

    // 已执行次数为 0，无法撤销
    if ((executedCounts.value[key] ?? 0) <= 0) return;

    // 找到对应的 choice 获取 pt/token
    const choice = eventTheaterChoices.value.find(
      (c) => c.name === item.name && c.multiplier === item.multiplier,
    );
    if (!choice) return;

    // 更新表单数据（撤销）
    form.value.pt = (form.value.pt ?? 0) - choice.pt;
    form.value.token = (form.value.token ?? 0) - choice.token;

    // 更新执行次数
    executedCounts.value[key] = (executedCounts.value[key] ?? 0) - 1;
  };

  /**
   * 获取方案项的剩余次数
   * @param item - 方案项
   * @returns 剩余次数
   */
  const getRemainingCount = (item: ParkingResultItem): number => {
    const key = getOperationKey(item);
    const snapshotItem = parkingResultSnapshot.value.find(
      (s) => s.name === item.name && s.multiplier === item.multiplier,
    );
    const initialCount = snapshotItem?.value ?? 0;
    const executed = executedCounts.value[key] ?? 0;
    return initialCount - executed;
  };

  /**
   * 获取方案项的初始次数
   * @param item - 方案项
   * @returns 初始次数
   */
  const getInitialCount = (item: ParkingResultItem): number => {
    const snapshotItem = parkingResultSnapshot.value.find(
      (s) => s.name === item.name && s.multiplier === item.multiplier,
    );
    return snapshotItem?.value ?? 0;
  };

  /**
   * 提交计算
   */
  const handleSubmit = async () => {
    preprocessingForm();
    // 保存表单数据快照
    formSnapshot.value = {
      targetPt: form.value.targetPt ?? 0,
      pt: form.value.pt ?? 0,
      token: form.value.token ?? 0,
    };
    if (
      form.value.eventType === 'theater' ||
      form.value.eventType === 'anniversary' ||
      form.value.eventType === 'trust'
    ) {
      parkingResult.value = await calcParkingTheater(formSnapshot.value);
      // 保存初始方案快照并重置执行状态
      if (parkingResult.value?.flag && parkingResult.value.result) {
        parkingResultSnapshot.value = [...parkingResult.value.result];
        executedCounts.value = {};
      }
    }
    calculatedFlag.value = true;
  };

  /**
   * DFS 搜索参数配置
   */
  const DFS_CONFIG = {
    /** 每隔多少次迭代执行一次异步暂停 */
    iterationPauseInterval: 100000,
    /** 最大迭代次数限制（防止无限循环） */
    maxIterations: 10000000,
  } as const;

  /**
   * Theater / Anniversary / Trust 活动控分计算算法
   *
   * 使用深度优先搜索（DFS）算法找到从当前积分到目标积分的最优游玩路径
   *
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calcParkingTheater(formData: {
    targetPt: number;
    pt: number;
    token: number;
  }): Promise<ParkingResult> {
    // 验证：负数参数
    if (formData.targetPt < 0 || formData.pt < 0 || formData.token < 0) {
      return { flag: false, message: '参数不能为负数' };
    }

    // 验证：已达标（语义修正为成功）
    if (formData.pt >= formData.targetPt) {
      return { flag: true, result: [] };
    }

    // 验证：差距过大
    if (formData.targetPt - formData.pt > 100000) {
      return { flag: false, message: '积分差距大于100000，请缩小后重试' };
    }

    // 排序优先级：
    // 1. 活动曲（消耗活动道具，token < 0）优先
    // 2. 其他选项按 pt 降序
    const choices = [...eventTheaterChoices.value].sort((a, b) => {
      const aIsEventLive = a.token < 0;
      const bIsEventLive = b.token < 0;

      if (aIsEventLive && !bIsEventLive) return -1;
      if (!aIsEventLive && bIsEventLive) return 1;

      return b.pt - a.pt;
    });

    /**
     * 栈节点结构
     *
     * 算法说明：
     * 1. 初始化状态栈，包含 pt 差距（负数表示还需要多少）和 token 数量
     * 2. 遍历选择项列表中的每个游玩方式
     * 3. 计算新状态：newPtDiff = ptDiff + choice.pt, newToken = token + choice.token
     * 4. 检查约束条件：
     *    - token 数量足够（token >= -choice.token）
     *    - ptDiff <= 0（不能超过目标）
     * 5. 如果 newPtDiff === 0，返回解
     * 6. 否则将新状态加入栈中继续搜索
     */
    interface StackNode {
      ptDiff: number;
      token: number;
      stepIndex: number;
      viaStepIndex?: number;
    }

    let iterations = 0;
    const stack: StackNode[] = [
      { ptDiff: formData.pt - formData.targetPt, token: formData.token, stepIndex: 0 },
    ];

    while (stack.length) {
      // 检查迭代限制
      if (iterations >= DFS_CONFIG.maxIterations) {
        return { flag: false, message: '达到最大迭代次数限制，搜索终止' };
      }

      // 防阻塞：定期让出执行权
      iterations++;
      if (iterations % DFS_CONFIG.iterationPauseInterval === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }

      const top = stack[stack.length - 1];
      if (!top) {
        stack.pop();
        continue;
      }

      // 所有步骤都尝试过了，回溯
      if (top.stepIndex >= choices.length) {
        stack.pop();
        continue;
      }

      // 获取当前要尝试的步骤
      const currentStepIndex = top.stepIndex;
      top.stepIndex++;

      const choice = choices[currentStepIndex];
      if (!choice) {
        continue;
      }

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

      const result: ParkingResultItem[] = [];
      for (const [key, value] of Object.entries(record)) {
        if (value > 0) {
          const choice = choices[Number(key)];
          if (!choice) continue;
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

  return {
    calculatedFlag,
    parkingResult,
    formSnapshot,
    parkingResultSnapshot,
    executedCounts,
    eventTheaterChoices,
    preprocessingForm,
    handleClear,
    handleSubmit,
    executeOperation,
    undoOperation,
    getRemainingCount,
    getInitialCount,
    resetExecution,
    resetToInitial,
  };
}
