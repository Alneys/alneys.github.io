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
import { MLTD_PARKING_CONSTANTS } from '../data/MltdEventParkingConstant';
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

  /** DFS 搜索参数配置 */
  const DFS_CONFIG = {
    iterationPauseInterval: 100000,
    maxIterations: 10000000,
  } as const;

  /**
   * Treasure 活动控分计算算法
   *
   * 使用深度优先搜索（DFS）+ 状态去重算法找到从当前积分到目标积分的游玩路径。
   *
   * 算法特点（最简）：
   * 由于所有步骤均为正积分且无消耗，搜索空间无循环风险，
   * 但仍使用 visited Set + pathSet Set 按 ptDiff 值去重，
   * 防止不同路径到达相同 ptDiff 时的重复探索。
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
    const sortedChoices = [...choices].sort((a, b) => b.pt - a.pt);

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
      if (top.stepIndex >= sortedChoices.length) {
        visited.add(top.ptDiff);
        pathSet.delete(top.ptDiff);
        stack.pop();
        continue;
      }

      // 获取当前要尝试的步骤
      const currentStepIndex = top.stepIndex;
      top.stepIndex++;

      const choice = sortedChoices[currentStepIndex];
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
