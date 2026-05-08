/**
 * 控分计算器子组合式 — Tour 组
 * 覆盖活动类型：tour
 *
 * Tour 活动特点：
 * 1. 引入道具进度系统（满 20 转换 1 个道具）
 * 2. 引入 5 倍进度系统
 * 3. 活动曲需要 5 倍进度达到 40 才能使用
 * 4. 3 倍活动曲额外需要 isBoostPeriod（已折返）
 * 5. 活动曲会重置 5 倍进度为 0
 */

import { computed, type Ref } from 'vue';
import { MLTD_PARKING_CONSTANTS } from '../data/MltdEventParkingConstant';
import type {
  ParkingForm,
  ParkingResult,
  ParkingResultItem,
  EventTheaterChoice,
} from '../MltdTypes';

/**
 * Tour 活动控分计算子组合式
 * @param form - 表单数据引用
 * @returns 类型相关的状态和方法
 */
export function useMltdEventParkingTour(form: Ref<ParkingForm>) {
  // ============ 选择项生成 ============

  /** 生成 Tour 活动的游玩选择列表 */
  const eventChoices = computed<EventTheaterChoice[]>(() => {
    const isBoostPeriod = form.value.isBoostPeriod ?? false;
    return MLTD_PARKING_CONSTANTS.generateTourChoices(isBoostPeriod);
  });

  // ============ 执行 / 撤销操作 ============

  /**
   * 执行一次操作（修改表单状态）
   *
   * Tour 活动逻辑：
   * - 歌曲游玩：增加 pt、道具进度、5 倍进度；道具进度满 20 转换 1 个道具
   * - 活动曲：消耗道具，获得 pt，重置 5 倍进度
   *
   * @param choice - 游玩选择项
   */
  const execute = (choice: EventTheaterChoice) => {
    form.value.pt = (form.value.pt ?? 0) + choice.pt;

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
      // 活动曲：消耗道具，重置 5 倍进度
      form.value.token = (form.value.token ?? 0) + choice.token;
      form.value.liveProgress = 0;
    }
  };

  /**
   * 撤销一次操作（逆向修改表单状态）
   *
   * 仅支持歌曲游玩（有进度）的撤销，活动曲的撤销暂不支持。
   *
   * @param choice - 游玩选择项
   */
  const undo = (choice: EventTheaterChoice) => {
    form.value.pt = (form.value.pt ?? 0) - choice.pt;

    if (choice.progress && choice.progress > 0) {
      // 歌曲游玩：逆向计算进度，处理道具逆向转换
      const currentProgress = form.value.itemProgress ?? 0;
      const progressToUndo = choice.progress;

      // 减少 5 倍进度
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
    }
  };

  // ============ 快照管理 ============

  /** 创建计算时的表单数据快照 */
  const createSnapshot = () => ({
    targetPt: form.value.targetPt ?? 0,
    pt: form.value.pt ?? 0,
    token: form.value.token ?? 0,
    itemProgress: form.value.itemProgress ?? 0,
    liveProgress: form.value.liveProgress ?? 0,
    isBoostPeriod: form.value.isBoostPeriod ?? false,
  });

  /**
   * 从快照恢复表单字段
   * @param snapshot - 表单数据快照
   */
  const resetToSnapshot = (snapshot: {
    targetPt: number;
    pt: number;
    token: number;
    itemProgress: number;
    liveProgress: number;
    isBoostPeriod: boolean;
  }) => {
    form.value.pt = snapshot.pt;
    form.value.token = snapshot.token;
    form.value.itemProgress = snapshot.itemProgress;
    form.value.liveProgress = snapshot.liveProgress;
    form.value.isBoostPeriod = snapshot.isBoostPeriod;
  };

  // ============ DFS 计算算法 ============

  /** DFS 搜索参数配置 */
  const DFS_CONFIG = {
    iterationPauseInterval: 100000,
    maxIterations: 10000000,
  } as const;

  /**
   * Tour 活动专用计算算法
   *
   * 使用深度优先搜索（DFS）算法找到从当前积分到目标积分的最优游玩路径。
   *
   * @param choices - 游玩选择项列表
   * @param formData - 表单数据（已预处理，包含 Tour 专属字段）
   * @returns 计算结果
   */
  async function calc(
    choices: EventTheaterChoice[],
    formData: {
      targetPt: number;
      pt: number;
      token: number;
      itemProgress: number;
      liveProgress: number;
      isBoostPeriod: boolean;
    },
  ): Promise<ParkingResult> {
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

    const tourChoices = [...choices];
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
      if (top.stepIndex >= tourChoices.length) {
        stack.pop();
        continue;
      }

      // 获取当前要尝试的步骤
      const currentStepIndex = top.stepIndex;
      top.stepIndex++;

      const choice = tourChoices[currentStepIndex];
      if (!choice) {
        continue;
      }

      // Tour 专用约束检查
      const isEventLive = choice.neededForStep === 'trigger';

      // 活动曲倍率条件检查
      if (isEventLive) {
        // 需要 5 倍进度达到 40
        if (top.liveProgress < 40) continue;
        // 3 倍道具消耗需要 isBoostPeriod
        if (choice.token === -3 && !formData.isBoostPeriod) continue;
      }

      // 计算新状态
      let newItem = top.token + choice.token;
      const newPtDiff = top.ptDiff + choice.pt;
      let newItemProgress = top.itemProgress + (choice.progress ?? 0);
      let newLiveProgress = top.liveProgress + (choice.progress ?? 0);

      // 道具进度满 20 转换 1 个道具
      if (newItemProgress >= 20) {
        newItem++;
        newItemProgress -= 20;
      }

      // 道具数量不能为负
      if (newItem < 0) {
        continue;
      }

      // 积分不能超过目标
      if (newPtDiff > 0) {
        continue;
      }

      // 活动曲重置 5 倍进度
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
          const choice = tourChoices[Number(key)];
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

  return { eventChoices, execute, undo, createSnapshot, resetToSnapshot, calc };
}
