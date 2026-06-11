/**
 * 控分计算器子组合式 — Treasure 组
 * 覆盖活动类型：treasure
 *
 * Treasure 活动特点：
 * 1. 无道具系统：所有游玩方式均为正积分（token 始终为 0）
 * 2. 无进度系统：状态仅由 ptDiff 决定
 * 3. 4th 阶段：活动曲 + 通常曲×3 的捆绑套装（type: '4th'）
 * 4. 获得 pt 加成倍率（bonus 1.0~1.7）影响所有积分计算
 * 5. 打工票倍率固定 4 档：[2.8, 2.1, 1.4, 0.7]
 */

import { computed, type Ref } from 'vue';
import { MLTD_PARKING_CONSTANTS, DFS_CONFIG } from '../data/MltdEventParkingConstant';
import type { ParkingForm, ParkingResult, ParkingResultItem, EventChoice } from '../MltdTypes';

/**
 * Treasure 活动控分计算子组合式
 * @param form - 表单数据引用
 * @returns 类型相关的状态和方法
 */
export function useMltdEventParkingTreasure(form: Ref<ParkingForm>) {
  // ============ 选择项生成 ============

  /** 生成 Treasure 活动的游玩选择列表 */
  const eventChoices = computed<EventChoice[]>(() => {
    const bonus = form.value.bonus ?? 1.7;
    const isBoostPeriod = form.value.isBoostPeriod ?? false;
    return MLTD_PARKING_CONSTANTS.generateTreasureChoices(bonus, isBoostPeriod);
  });

  // ============ 执行 / 撤销操作 ============

  /**
   * 执行一次操作（修改表单状态）
   *
   * Treasure 活动无道具系统，仅需更新 pt。
   * @param choice - 游玩选择项
   */
  const execute = (choice: EventChoice) => {
    form.value.pt = (form.value.pt ?? 0) + choice.pt;
  };

  /**
   * 撤销一次操作（逆向修改表单状态）
   * @param choice - 游玩选择项
   */
  const undo = (choice: EventChoice) => {
    form.value.pt = (form.value.pt ?? 0) - choice.pt;
  };

  // ============ 快照管理 ============

  /** 创建计算时的表单数据快照 */
  const createSnapshot = () => ({
    targetPt: form.value.targetPt ?? 0,
    pt: form.value.pt ?? 0,
    token: form.value.token ?? 0,
    bonus: form.value.bonus ?? 1.7,
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
    bonus: number;
    isBoostPeriod: boolean;
  }) => {
    form.value.pt = snapshot.pt;
    form.value.token = snapshot.token;
    form.value.bonus = snapshot.bonus;
    form.value.isBoostPeriod = snapshot.isBoostPeriod;
  };

  // ============ DFS 计算算法 ============

  /**
   * 活动控分计算算法（Treasure 专用）
   *
   * 使用深度优先搜索（DFS）算法找到从当前积分到目标积分的游玩路径。
   *
   * 状态特征：pt 单向递增，无消耗系统（所有选项 token = 0）。
   *
   * @param choices - 游玩选择项列表
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calc(
    choices: EventChoice[],
    formData: {
      targetPt: number;
      pt: number;
      token: number;
      bonus: number;
      isBoostPeriod: boolean;
    },
  ): Promise<ParkingResult> {
    // ---- 输入验证 ----

    // 负数参数
    if (formData.targetPt < 0 || formData.pt < 0) {
      return { flag: false, message: '参数不能为负数' };
    }

    // bonus 范围
    if (formData.bonus < 1 || formData.bonus > 1.7) {
      return { flag: false, message: '获得pt加成倍率必须在 1.0 ~ 1.7 之间' };
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
    // Treasure 无活动曲优先级区分，直接按 pt 降序
    const sortedChoices = [...choices].sort((a, b) => b.pt - a.pt);

    // ---- 栈节点类型定义 ----
    interface StackNode {
      ptDiff: number;
      stepIndex: number;
      viaStepIndex?: number;
    }

    // ---- 搜索初始化 ----
    let iterations = 0;
    const startPtDiff = formData.pt - formData.targetPt;
    const stack: StackNode[] = [{ ptDiff: startPtDiff, stepIndex: 0 }];

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

      // ---- 计算新状态 ----
      const newPtDiff = top.ptDiff + choice.pt;

      // 积分不能超过目标
      if (newPtDiff > 0) continue;

      // 找到解
      if (newPtDiff === 0) {
        stack.push({
          ptDiff: newPtDiff,
          stepIndex: 0,
          viaStepIndex: currentStepIndex,
        });
        break;
      }

      // 继续深入搜索
      stack.push({
        ptDiff: newPtDiff,
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
