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
  // Tale 专属字段默认值
  progress: 0,
});

/**
 * 活动控分计算器组合式函数
 * @param form - 表单数据引用
 * @returns 计算结果和操作方法
 */
export function useMltdEventParking(form: Ref<ParkingForm>) {
  // 根据活动类型返回对应的选择项列表，并根据开关过滤 extra 选项
  const eventChoices = computed<EventTheaterChoice[]>(() => {
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
    } else if (form.value.eventType === 'tale') {
      choices = MLTD_PARKING_CONSTANTS.eventTaleChoices;
    } else if (form.value.eventType === 'treasure') {
      // Treasure 活动需要 bonus 参数（倍率 1.0~1.7）
      const bonus = form.value.bonus ?? 1.7;
      choices = MLTD_PARKING_CONSTANTS.generateTreasureChoices(bonus);
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
    | {
        targetPt: number;
        pt: number;
        token: number;
        progress: number;
      }
    | {
        targetPt: number;
        pt: number;
        token: number;
        bonus: number;
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
    const baseKey = `${item.name}-${item.multiplier}`;
    return item.type ? `${baseKey}-${item.type}` : baseKey;
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
    // Tale 类型需要重置进度字段
    if ('progress' in formSnapshot.value && !('itemProgress' in formSnapshot.value)) {
      form.value.progress = formSnapshot.value.progress;
    }
    // Treasure 类型需要重置 bonus 字段
    if (
      'bonus' in formSnapshot.value &&
      !('itemProgress' in formSnapshot.value) &&
      !('progress' in formSnapshot.value)
    ) {
      form.value.bonus = (formSnapshot.value as unknown as { bonus: number }).bonus;
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
      (s) =>
        s.name === item.name &&
        s.multiplier === item.multiplier &&
        (item.type === undefined || s.type === item.type),
    );

    // 找到对应的 choice 获取 pt/token
    const choice = eventChoices.value.find(
      (c) =>
        c.name === item.name &&
        c.multiplier === item.multiplier &&
        (item.type === undefined || c.type === item.type),
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
        // 活动曲：消耗道具，重置5倍进度
        form.value.token = (form.value.token ?? 0) + choice.token;
        form.value.liveProgress = 0;
      }
    } else if (form.value.eventType === 'tale') {
      // Tale 活动：更新进度
      form.value.progress = (form.value.progress ?? 0) + (choice.progress ?? 0);
    } else if (form.value.eventType === 'treasure') {
      // Treasure 活动：无道具系统，仅更新 pt（token 始终为 0）
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
    const choice = eventChoices.value.find(
      (c) =>
        c.name === item.name &&
        c.multiplier === item.multiplier &&
        (item.type === undefined || c.type === item.type),
    );
    if (!choice) return;

    // 更新 pt（通用）
    form.value.pt = (form.value.pt ?? 0) - choice.pt;

    // Tour 活动需要特殊处理进度和道具（仅支持歌曲游玩的撤销）
    if (form.value.eventType === 'tour' && choice.progress && choice.progress > 0) {
      // 歌曲游玩：逆向计算进度，处理道具逆向转换
      const currentProgress = form.value.itemProgress ?? 0;
      const progressToUndo = choice.progress;

      // 减少5倍进度
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
    } else if (form.value.eventType === 'tale') {
      // Tale 活动：逆向更新进度
      form.value.progress = Math.max(0, (form.value.progress ?? 0) - (choice.progress ?? 0));
    } else if (form.value.eventType === 'treasure') {
      // Treasure 活动：无道具系统，仅更新 pt（token 始终为 0）
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
      (s) =>
        s.name === item.name &&
        s.multiplier === item.multiplier &&
        (item.type === undefined || s.type === item.type),
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
      (s) =>
        s.name === item.name &&
        s.multiplier === item.multiplier &&
        (item.type === undefined || s.type === item.type),
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
    } else if (form.value.eventType === 'tale') {
      formSnapshot.value = {
        targetPt: form.value.targetPt ?? 0,
        pt: form.value.pt ?? 0,
        token: form.value.token ?? 0,
        progress: form.value.progress ?? 0,
      };
      parkingResult.value = await calcParkingTale(formSnapshot.value);
    } else if (form.value.eventType === 'treasure') {
      formSnapshot.value = {
        targetPt: form.value.targetPt ?? 0,
        pt: form.value.pt ?? 0,
        token: form.value.token ?? 0,
        bonus: form.value.bonus ?? 1.7,
      };
      parkingResult.value = await calcParkingTreasure(formSnapshot.value);
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
    const choices = [...eventChoices.value].sort((a, b) => {
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
   * 2. 引入5倍进度系统
   * 3. 活动曲需要5倍进度达到 40 才能使用
   * 4. 3倍活动曲额外需要 isBoostPeriod（已折返）
   * 5. 活动曲会重置5倍进度为 0
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

    const choices = [...eventChoices.value];
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

      // 活动曲倍率条件检查
      if (isEventLive) {
        // 需要5倍进度达到40
        if (top.liveProgress < 40) continue;
        // 3 倍道具消耗需要 isBoostPeriod
        if (choice.token === -3 && !formData.isBoostPeriod) continue;
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

      // 6. 活动曲重置5倍进度
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

  /**
   * Tale 活动控分计算算法
   *
   * 使用深度优先搜索（DFS）+ 状态去重算法找到从当前积分到目标积分的游玩路径。
   *
   * Tale 活动特点：
   * 1. 进度系统：3rd 阶段歌曲增加进度，Event Live 消耗进度
   * 2. 进度 < 100：禁止打活动曲（必须累积进度）
   * 3. 进度 ≥ 100：必须优先打活动曲（禁止打普通曲）
   * 4. 积分不能超过目标积分
   * 5. 1st/2nd 阶段：退出组曲策略，获得积分但不增加进度
   *
   * 算法特点（与 Theater/Tour 不同）：
   * 由于进度可以增减（打普通曲增加、活动曲减少），搜索空间存在循环可能性，
   * 因此使用 visited Set + pathSet Set 双重状态去重，防止无限循环。
   * 状态哈希键为 `${ptDiff}:${progress}`。
   *
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calcParkingTale(formData: {
    targetPt: number;
    pt: number;
    token: number;
    progress: number;
  }): Promise<ParkingResult> {
    // 验证：负数参数
    if (formData.targetPt < 0 || formData.pt < 0 || formData.progress < 0) {
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
    // 1. 活动曲（消耗进度，neededForStep === 'trigger'）优先，pt 获取多的靠前
    // 2. 其他选项按 pt 降序
    const choices = [...eventChoices.value].sort((a, b) => {
      const aIsEventLive = a.neededForStep === 'trigger';
      const bIsEventLive = b.neededForStep === 'trigger';

      if (aIsEventLive && !bIsEventLive) return -1;
      if (!aIsEventLive && bIsEventLive) return 1;

      // 相同类型：按 pt 降序
      return b.pt - a.pt;
    });

    /**
     * Tale 栈节点结构
     *
     * 算法说明：
     * 1. 初始化状态栈，包含 pt 差距（负数表示还需要多少）和进度
     * 2. 遍历选择项列表中的每个游玩方式
     * 3. 检查约束条件：
     *    - 进度 < 100 时不能打活动曲（neededForStep === 'trigger'）
     *    - 进度 ≥ 100 时必须先打活动曲（不能打普通曲）
     *    - 积分不能超过目标
     * 4. 使用 visited / pathSet 进行状态去重，避免循环
     * 5. 如果恰好到达目标积分，返回步骤路径
     * 6. 否则将新状态压入栈中继续搜索
     */
    interface TaleStackNode {
      ptDiff: number;
      progress: number;
      stepIndex: number;
      viaStepIndex?: number;
    }

    // visited: 已完全探索过的状态（所有子步骤都已回溯）
    const visited = new Set<string>();
    // pathSet: 当前 DFS 路径上的状态（防止环）
    const pathSet = new Set<string>();
    let iterations = 0;

    const startHash = `${formData.pt - formData.targetPt}:${formData.progress}`;
    const stack: TaleStackNode[] = [
      {
        ptDiff: formData.pt - formData.targetPt,
        progress: formData.progress,
        stepIndex: 0,
      },
    ];
    pathSet.add(startHash);

    while (stack.length > 0) {
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

      // 所有步骤都尝试过了，标记已访问并回溯
      if (top.stepIndex >= choices.length) {
        const hash = `${top.ptDiff}:${top.progress}`;
        visited.add(hash);
        pathSet.delete(hash);
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

      // 约束 1：进度 < 100 时不能打活动曲（neededForStep === 'trigger'）
      if (top.progress < 100 && choice.neededForStep === 'trigger') {
        continue;
      }

      // 约束 2：进度 ≥ 100 时必须先打活动曲（不能打普通曲）
      if (top.progress >= 100 && choice.neededForStep !== 'trigger') {
        continue;
      }

      // 计算新状态
      const newPtDiff = top.ptDiff + choice.pt;
      const newProgress = top.progress + (choice.progress ?? 0);

      // 约束 3：积分不能超过目标
      if (newPtDiff > 0) {
        continue;
      }

      // 状态去重：如果新状态已访问或在当前路径上，跳过
      const newHash = `${newPtDiff}:${newProgress}`;
      if (visited.has(newHash) || pathSet.has(newHash)) {
        continue;
      }

      // 找到解
      if (newPtDiff === 0) {
        pathSet.add(newHash);
        stack.push({
          ptDiff: newPtDiff,
          progress: newProgress,
          stepIndex: 0,
          viaStepIndex: currentStepIndex,
        });
        break;
      }

      // 继续深入搜索
      pathSet.add(newHash);
      stack.push({
        ptDiff: newPtDiff,
        progress: newProgress,
        stepIndex: 0,
        viaStepIndex: currentStepIndex,
      });
    }

    // 提取结果
    const lastNode = stack[stack.length - 1];
    if (stack.length > 0 && lastNode && lastNode.ptDiff === 0) {
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
            type: choice.type || undefined,
          });
        }
      }

      return { flag: true, result };
    }

    return { flag: false, message: '不存在控分方案' };
  }

  /**
   * Treasure 活动控分计算算法
   *
   * 使用深度优先搜索（DFS）+ 状态去重算法找到从当前积分到目标积分的游玩路径。
   *
   * Treasure 活动特点：
   * 1. 无道具系统：所有游玩方式均为正积分（token 始终为 0）
   * 2. 无进度系统：状态仅由 ptDiff 决定
   * 3. 4th 阶段：活动曲 + 通常曲×3 的捆绑套装（type: '4th'）
   * 4. 获得pt加成倍率（bonus 1.0~1.7）影响所有积分计算
   * 5. 打工票倍率固定 4 档：[2.8, 2.1, 1.4, 0.7]
   *
   * 算法特点（最简）：
   * 由于所有步骤均为正积分且无消耗，搜索空间无循环风险，
   * 但仍使用 visited Set + pathSet Set 按 ptDiff 值去重，
   * 防止不同路径到达相同 ptDiff 时的重复探索。
   *
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calcParkingTreasure(formData: {
    targetPt: number;
    pt: number;
    token: number;
    bonus: number;
  }): Promise<ParkingResult> {
    // 验证：负数参数
    if (formData.targetPt < 0 || formData.pt < 0) {
      return { flag: false, message: '参数不能为负数' };
    }

    // 验证：bonus 范围
    if (formData.bonus < 1 || formData.bonus > 1.7) {
      return { flag: false, message: '获得pt加成倍率必须在 1.0 ~ 1.7 之间' };
    }

    // 验证：已达标（语义修正为成功）
    if (formData.pt >= formData.targetPt) {
      return { flag: true, result: [] };
    }

    // 验证：差距过大
    if (formData.targetPt - formData.pt > 100000) {
      return { flag: false, message: '积分差距大于100000，请缩小后重试' };
    }

    // 排序：按 pt 降序，获取多的靠前
    // Treasure 无活动曲优先级区分（所有步骤 token 均为 0）
    const choices = [...eventChoices.value].sort((a, b) => b.pt - a.pt);

    /**
     * Treasure 栈节点结构
     *
     * 算法说明：
     * 1. 初始化状态栈，仅包含 pt 差距（负数表示还需要多少）
     * 2. 遍历选择项列表中的每个游玩方式（按 pt 降序）
     * 3. 计算新状态：newPtDiff = ptDiff + choice.pt
     * 4. 检查约束条件：newPtDiff <= 0（不能超过目标）
     * 5. 使用 visited / pathSet 按 ptDiff 值去重
     * 6. 如果 newPtDiff === 0，返回解
     * 7. 否则将新状态压入栈中继续搜索
     */
    interface TreasureStackNode {
      ptDiff: number;
      stepIndex: number;
      viaStepIndex?: number;
    }

    // visited: 已完全探索过的 ptDiff 值（所有子步骤都已回溯）
    const visited = new Set<number>();
    // pathSet: 当前 DFS 路径上的 ptDiff 值（防止不同路径到达相同状态）
    const pathSet = new Set<number>();
    let iterations = 0;

    const startPtDiff = formData.pt - formData.targetPt;
    const stack: TreasureStackNode[] = [{ ptDiff: startPtDiff, stepIndex: 0 }];
    pathSet.add(startPtDiff);

    while (stack.length > 0) {
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

      // 所有步骤都尝试过了，标记已访问并回溯
      if (top.stepIndex >= choices.length) {
        visited.add(top.ptDiff);
        pathSet.delete(top.ptDiff);
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

      // 计算新状态（Treasure 无 token 变化）
      const newPtDiff = top.ptDiff + choice.pt;

      // 约束：积分不能超过目标
      if (newPtDiff > 0) {
        continue;
      }

      // 状态去重：如果新 ptDiff 已访问或在当前路径上，跳过
      if (visited.has(newPtDiff) || pathSet.has(newPtDiff)) {
        continue;
      }

      // 找到解
      if (newPtDiff === 0) {
        pathSet.add(newPtDiff);
        stack.push({
          ptDiff: newPtDiff,
          stepIndex: 0,
          viaStepIndex: currentStepIndex,
        });
        break;
      }

      // 继续深入搜索
      pathSet.add(newPtDiff);
      stack.push({
        ptDiff: newPtDiff,
        stepIndex: 0,
        viaStepIndex: currentStepIndex,
      });
    }

    // 提取结果
    const lastNode = stack[stack.length - 1];
    if (stack.length > 0 && lastNode && lastNode.ptDiff === 0) {
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
            type: choice.type || undefined,
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
    eventChoices,
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
