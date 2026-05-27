/**
 * 控分计算器子组合式 — Theater 组
 * 覆盖活动类型：theater / anniversary / trust / tune
 *
 * 使用标准道具系统（Token），所有类型共用同一套 DFS 算法，
 * 仅在选择项生成（generate*Choices）上有差异。
 */

import { computed, type Ref } from 'vue';
import { MLTD_PARKING_CONSTANTS } from '../data/MltdEventParkingConstant';
import type { ParkingForm, ParkingResult, ParkingResultItem, EventChoice } from '../MltdTypes';

/**
 * Theater 组控分计算子组合式
 * @param form - 表单数据引用
 * @returns 类型相关的状态和方法
 */
export function useMltdEventParkingTheater(form: Ref<ParkingForm>) {
  // ============ 选择项生成 ============

  /** 根据活动子类型生成游玩选择列表 */
  const eventChoices = computed<EventChoice[]>(() => {
    if (form.value.eventType === 'anniversary') {
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      return MLTD_PARKING_CONSTANTS.generateAnniversaryChoices(isBoostPeriod);
    } else if (form.value.eventType === 'trust') {
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      return MLTD_PARKING_CONSTANTS.generateTrustChoices(isBoostPeriod);
    } else if (form.value.eventType === 'tune') {
      const bonus = form.value.bonus ?? 30;
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      return MLTD_PARKING_CONSTANTS.generateTuneChoices(bonus, isBoostPeriod);
    } else {
      // theater（默认）
      const isBoostPeriod = form.value.isBoostPeriod ?? false;
      return MLTD_PARKING_CONSTANTS.generateTheaterChoices(isBoostPeriod);
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

  /** DFS 搜索参数配置 */
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
   * 各活动类型的差异仅体现在选择项（choices）的生成上，搜索算法本身无需区分活动类型。
   *
   * @param choices - 游玩选择项列表（已按活动类型生成）
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calc(
    choices: EventChoice[],
    formData: { targetPt: number; pt: number; token: number },
  ): Promise<ParkingResult> {
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
    const sortedChoices = [...choices].sort((a, b) => {
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
      if (top.stepIndex >= sortedChoices.length) {
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
          const choice = sortedChoices[Number(key)];
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
