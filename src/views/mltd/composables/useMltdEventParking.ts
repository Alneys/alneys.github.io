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
  bonus: 30,
  isBoostPeriod: true,
  // Tour 专属字段默认值
  itemProgress: 0,
  liveProgress: 0,
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
    } else if (form.value.eventType === 'tune') {
      // Tune 活动需要 bonus 和 isBoostPeriod 参数
      const bonus = form.value.bonus ?? 30;
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      choices = MLTD_PARKING_CONSTANTS.generateTuneChoices(bonus, isBoostPeriod);
    } else if (form.value.eventType === 'tour') {
      choices = MLTD_PARKING_CONSTANTS.eventTourChoices;
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
  const formSnapshot = ref<
    | { targetPt: number; pt: number; token: number }
    | {
        targetPt: number;
        pt: number;
        token: number;
        itemProgress: number;
        liveProgress: number;
        isBoostPeriod: boolean;
      }
  >();

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
    // Tour 类型需要重置额外字段
    if ('itemProgress' in formSnapshot.value) {
      form.value.itemProgress = formSnapshot.value.itemProgress;
      form.value.liveProgress = formSnapshot.value.liveProgress;
      form.value.isBoostPeriod = formSnapshot.value.isBoostPeriod;
    }
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

    // 更新 pt（通用）
    form.value.pt = (form.value.pt ?? 0) + choice.pt;

    // Tour 活动需要特殊处理进度和道具
    if (form.value.eventType === 'tour') {
      const isEventLive = choice.neededForStep === 'trigger';

      if (!isEventLive && choice.progress && choice.progress > 0) {
        // 歌曲游玩：增加进度，处理道具转换
        let newItemProgress = (form.value.itemProgress ?? 0) + choice.progress;
        let newToken = form.value.token ?? 0;

        // 道具进度满 20 转换 1 个道具
        if (newItemProgress >= 20) {
          newToken++;
          newItemProgress -= 20;
        }

        form.value.itemProgress = newItemProgress;
        form.value.liveProgress = (form.value.liveProgress ?? 0) + choice.progress;
        form.value.token = newToken;
      } else if (isEventLive) {
        // Event Live：消耗道具，重置 Live 进度
        form.value.token = (form.value.token ?? 0) + choice.token;
        form.value.liveProgress = 0;
      }
    } else {
      // 其他活动类型：直接更新 token
      form.value.token = (form.value.token ?? 0) + choice.token;
    }

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

    // 更新 pt（通用）
    form.value.pt = (form.value.pt ?? 0) - choice.pt;

    // Tour 活动需要特殊处理进度和道具（仅支持歌曲游玩的撤销）
    if (form.value.eventType === 'tour' && choice.progress && choice.progress > 0) {
      // 歌曲游玩：逆向计算进度，处理道具逆向转换
      const currentProgress = form.value.itemProgress ?? 0;
      const progressToUndo = choice.progress;

      // 减少 Live 进度
      form.value.liveProgress = Math.max(0, (form.value.liveProgress ?? 0) - progressToUndo);

      // 处理道具进度逆向转换
      if (currentProgress >= progressToUndo) {
        // 当前进度足够，直接扣减
        form.value.itemProgress = currentProgress - progressToUndo;
      } else {
        // 当前进度不足，说明之前转换了道具，需要逆向处理
        // 扣减 1 个道具，恢复进度 = 当前进度 + 20 - progressToUndo
        form.value.token = Math.max(0, (form.value.token ?? 0) - 1);
        form.value.itemProgress = currentProgress + 20 - progressToUndo;
      }
    } else {
      // 其他活动类型：直接更新 token
      form.value.token = (form.value.token ?? 0) - choice.token;
    }

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

    // 根据活动类型保存快照并选择计算函数
    if (form.value.eventType === 'tour') {
      formSnapshot.value = {
        targetPt: form.value.targetPt ?? 0,
        pt: form.value.pt ?? 0,
        token: form.value.token ?? 0,
        itemProgress: form.value.itemProgress ?? 0,
        liveProgress: form.value.liveProgress ?? 0,
        isBoostPeriod: form.value.isBoostPeriod ?? false,
      };
      parkingResult.value = await calcParkingTour(formSnapshot.value);
    } else {
      formSnapshot.value = {
        targetPt: form.value.targetPt ?? 0,
        pt: form.value.pt ?? 0,
        token: form.value.token ?? 0,
      };
      parkingResult.value = await calcParkingTheater(formSnapshot.value);
    }

    // 保存初始方案快照并重置执行状态
    if (parkingResult.value?.flag && parkingResult.value.result) {
      parkingResultSnapshot.value = [...parkingResult.value.result];
      executedCounts.value = {};
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
   * 活动控分计算算法（Theater / Anniversary / Trust / Tune 通用）
   *
   * 使用深度优先搜索（DFS）算法找到从当前积分到目标积分的最优游玩路径。
   * 各活动类型的差异仅体现在选择项（choices）的生成上（见 eventTheaterChoices），
   * 搜索算法本身无需区分活动类型。
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
    // 1. 活动曲（消耗活动道具，token < 0）优先，pt 获取多的靠前
    // 2. 其他选项按 pt 降序，pt 获取多的靠前
    const choices = [...eventTheaterChoices.value].sort((a, b) => {
      const aIsEventLive = a.token < 0;
      const bIsEventLive = b.token < 0;

      if (aIsEventLive && !bIsEventLive) return -1;
      if (!aIsEventLive && bIsEventLive) return 1;

      // 相同类型：选项按 pt 降序，获取多的靠前
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

  /**
   * Tour 活动专用计算算法
   *
   * 使用深度优先搜索（DFS）算法找到从当前积分到目标积分的最优游玩路径。
   * Tour 活动特点：
   * 1. 引入道具进度系统（满 20 转换 1 个道具）
   * 2. 引入 Live 进度系统（未折返上限 40）
   * 3. Event Live 需要满足 Live 进度条件才能使用
   * 4. Event Live 会重置 Live 进度为 0
   *
   * @param formData - 表单数据（已预处理，包含 Tour 专属字段）
   * @returns 计算结果
   */
  async function calcParkingTour(formData: {
    targetPt: number;
    pt: number;
    token: number;
    itemProgress: number;
    liveProgress: number;
    isBoostPeriod: boolean;
  }): Promise<ParkingResult> {
    // 验证：负数参数
    if (
      formData.targetPt < 0 ||
      formData.pt < 0 ||
      formData.token < 0 ||
      formData.itemProgress < 0 ||
      formData.liveProgress < 0
    ) {
      return { flag: false, message: '参数不能为负数' };
    }

    // 验证：道具进度范围
    if (formData.itemProgress > 19) {
      return { flag: false, message: '道具进度必须在 0-19 之间' };
    }

    // 验证：已达标
    if (formData.pt >= formData.targetPt) {
      return { flag: true, result: [] };
    }

    // 验证：差距过大
    if (formData.targetPt - formData.pt > 100000) {
      return { flag: false, message: '积分差距大于100000，请缩小后重试' };
    }

    /**
     * Tour 栈节点结构
     *
     * 扩展状态：ptDiff, token, itemProgress, liveProgress
     */
    interface TourStackNode {
      ptDiff: number;
      token: number;
      itemProgress: number;
      liveProgress: number;
      stepIndex: number;
      viaStepIndex?: number;
    }

    const choices = [...eventTheaterChoices.value];
    let iterations = 0;
    const stack: TourStackNode[] = [
      {
        ptDiff: formData.pt - formData.targetPt,
        token: formData.token,
        itemProgress: formData.itemProgress,
        liveProgress: formData.liveProgress,
        stepIndex: 0,
      },
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

      // Tour 专用约束检查
      const isEventLive = choice.neededForStep === 'trigger';

      // Event Live 倍率条件检查
      if (isEventLive) {
        // 3 倍道具消耗需要 isBoostPeriod（已折返）
        if (choice.token === -3 && !formData.isBoostPeriod) continue;
        // 2 倍和 1 倍道具消耗需要 Live 进度达到 40
        if ((choice.token === -2 || choice.token === -1) && top.liveProgress < 40) continue;
      }

      // 3. 计算新状态
      let newItem = top.token + choice.token;
      const newPtDiff = top.ptDiff + choice.pt;
      let newItemProgress = top.itemProgress + (choice.progress ?? 0);
      let newLiveProgress = top.liveProgress + (choice.progress ?? 0);

      // 道具进度满 20 转换 1 个道具
      if (newItemProgress >= 20) {
        newItem++;
        newItemProgress -= 20;
      }

      // 4. 道具数量不能为负
      if (newItem < 0) {
        continue;
      }

      // 5. 积分不能超过目标
      if (newPtDiff > 0) {
        continue;
      }

      // 6. Event Live 重置 Live 进度
      if (isEventLive) {
        newLiveProgress = 0;
      }

      // 找到解
      if (newPtDiff === 0) {
        stack.push({
          ptDiff: newPtDiff,
          token: newItem,
          itemProgress: newItemProgress,
          liveProgress: newLiveProgress,
          stepIndex: 0,
          viaStepIndex: currentStepIndex,
        });
        break;
      }

      // 继续深入搜索
      stack.push({
        ptDiff: newPtDiff,
        token: newItem,
        itemProgress: newItemProgress,
        liveProgress: newLiveProgress,
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
