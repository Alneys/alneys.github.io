/**
 * 控分计算器子组合式 — Theater 组
 * 覆盖活动类型：theater / anniversary / trust / tune
 *
 * 使用标准道具系统（Token），所有类型共用同一套 DFS 算法，
 * 仅在选择项生成（generate*Choices）上有差异。
 */

import { computed, type Ref } from 'vue';

import { MLTD_PARKING_CONSTANTS, DFS_CONFIG } from '../data/MltdEventParkingConstant';
import type {
  ParkingForm,
  ParkingResult,
  ParkingResultItem,
  EventChoice,
} from '../utils/MltdTypes';

/**
 * Theater 组控分计算子组合式
 * @param form - 表单数据引用
 * @returns 类型相关的状态和方法
 */
export function useMltdEventParkingTheater(form: Ref<ParkingForm>) {
  // ============ 选择项生成 ============

  /** 根据活动子类型生成游玩选择列表 */
  const eventChoices = computed<EventChoice[]>(() => {
    if (form.value.eventType === 'theater') {
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      return MLTD_PARKING_CONSTANTS.generateTheaterChoices(isBoostPeriod);
    } else if (form.value.eventType === 'anniversary') {
      return MLTD_PARKING_CONSTANTS.generateAnniversaryChoices();
    } else if (form.value.eventType === 'trust') {
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      return MLTD_PARKING_CONSTANTS.generateTrustChoices(isBoostPeriod);
    } else {
      // tune（默认）
      const bonus = form.value.bonus ?? 30;
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      return MLTD_PARKING_CONSTANTS.generateTuneChoices(bonus, isBoostPeriod);
    }
  });

  // ============ 执行 / 撤销操作 ============

  /**
   * 执行一次操作（修改表单状态）
   * @param choice - 游玩选择项
   */
  const execute = (choice: EventChoice) => {
    form.value.pt = (form.value.pt ?? 0) + choice.pt;
    form.value.token = (form.value.token ?? 0) + choice.token;
  };

  /**
   * 撤销一次操作（逆向修改表单状态）
   * @param choice - 游玩选择项
   */
  const undo = (choice: EventChoice) => {
    form.value.pt = (form.value.pt ?? 0) - choice.pt;
    form.value.token = (form.value.token ?? 0) - choice.token;
  };

  // ============ 快照管理 ============

  /** 创建计算时的表单数据快照 */
  const createSnapshot = () => ({
    targetPt: form.value.targetPt ?? 0,
    pt: form.value.pt ?? 0,
    token: form.value.token ?? 0,
  });

  /**
   * 从快照恢复表单字段
   * @param snapshot - 表单数据快照
   */
  const resetToSnapshot = (snapshot: { targetPt: number; pt: number; token: number }) => {
    form.value.pt = snapshot.pt;
    form.value.token = snapshot.token;
  };

  // ============ DFS 计算算法 ============

  /**
   * 活动控分计算算法（Theater / Anniversary / Trust / Tune 通用）
   *
   * 使用深度优先搜索（DFS）算法找到从当前积分到目标积分的最优游玩路径。
   * 各活动类型的差异仅体现在选择项（choices）的生成上，搜索算法本身无需区分活动类型。
   *
   * 状态特征：pt 单向递增，token 可增可减，但无循环风险，无需状态去重。
   *
   * @param choices - 游玩选择项列表
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calc(
    choices: EventChoice[],
    formData: { targetPt: number; pt: number; token: number },
  ): Promise<ParkingResult> {
    // ---- 输入验证 ----

    // 负数参数
    if (formData.targetPt < 0 || formData.pt < 0 || formData.token < 0) {
      return { flag: false, message: '参数不能为负数' };
    }

    // 已达标
    if (formData.pt >= formData.targetPt) {
      return { flag: true, result: [] };
    }

    // 差距过大
    if (formData.targetPt - formData.pt > 100000) {
      return { flag: false, message: '积分差距大于100000，请缩小后重试' };
    }

    // ---- 选择项排序 ----
    // 优先级：活动曲（token < 0）优先 → 按 pt 降序
    const sortedChoices = [...choices].sort((a, b) => {
      const aIsEventLive = a.token < 0;
      const bIsEventLive = b.token < 0;

      if (aIsEventLive && !bIsEventLive) return -1;
      if (!aIsEventLive && bIsEventLive) return 1;

      return b.pt - a.pt;
    });

    // ---- 栈节点类型定义 ----
    interface StackNode {
      ptDiff: number;
      token: number;
      stepIndex: number;
      viaStepIndex?: number;
    }

    // ---- 搜索初始化 ----
    let iterations = 0;
    const startPtDiff = formData.pt - formData.targetPt;
    const stack: StackNode[] = [{ ptDiff: startPtDiff, token: formData.token, stepIndex: 0 }];

    // ---- DFS 主体循环 ----
    while (stack.length > 0) {
      // 迭代限制检查
      if (iterations >= DFS_CONFIG.maxIterations) {
        return { flag: false, message: '达到最大迭代次数限制，搜索终止' };
      }

      // 防阻塞：定期让出执行权
      iterations++;
      if (iterations % DFS_CONFIG.iterationPauseInterval === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }

      const top = stack[stack.length - 1];

      // 空节点保护
      if (!top) {
        stack.pop();
        continue;
      }

      // 所有步骤都已尝试 → 回溯
      if (top.stepIndex >= sortedChoices.length) {
        stack.pop();
        continue;
      }

      // 获取当前尝试的步骤
      const currentStepIndex = top.stepIndex;
      top.stepIndex++;

      const choice = sortedChoices[currentStepIndex];
      if (!choice) continue;

      // ---- 活动约束检查 ----
      if (top.token < -choice.token) continue;

      // ---- 计算新状态 ----
      const newPtDiff = top.ptDiff + choice.pt;
      const newToken = top.token + choice.token;

      // 积分不能超过目标
      if (newPtDiff > 0) continue;

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

    // ---- 提取结果 ----
    const lastNode = stack[stack.length - 1];
    if (stack.length > 0 && lastNode && lastNode.ptDiff === 0) {
      const record: Record<string, number> = {};
      for (const node of stack) {
        if (node.viaStepIndex !== undefined) {
          record[node.viaStepIndex] = (record[node.viaStepIndex] ?? 0) + 1;
        }
      }

      const result: ParkingResultItem[] = [];
      for (const [key, value] of Object.entries(record)) {
        if (value > 0) {
          const choice = sortedChoices[Number(key)];
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

  return { eventChoices, execute, undo, createSnapshot, resetToSnapshot, calc };
}
