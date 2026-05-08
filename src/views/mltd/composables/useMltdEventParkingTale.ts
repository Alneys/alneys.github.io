/**
 * 控分计算器子组合式 — Tale 组
 * 覆盖活动类型：tale
 *
 * Tale 活动特点：
 * 1. 进度系统：3rd 阶段歌曲增加进度，Event Live 消耗进度
 * 2. 进度 < 100：禁止打活动曲（必须累积进度）
 * 3. 进度 ≥ 100：必须优先打活动曲（禁止打普通曲）
 * 4. 积分不能超过目标积分
 * 5. 1st/2nd 阶段：退出组曲策略，获得积分但不增加进度
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
 * Tale 活动控分计算子组合式
 * @param form - 表单数据引用
 * @returns 类型相关的状态和方法
 */
export function useMltdEventParkingTale(form: Ref<ParkingForm>) {
  // ============ 选择项生成 ============

  /** 生成 Tale 活动的游玩选择列表 */
  const eventChoices = computed<EventTheaterChoice[]>(() => {
    return MLTD_PARKING_CONSTANTS.generateTaleChoices();
  });

  // ============ 执行 / 撤销操作 ============

  /**
   * 执行一次操作（修改表单状态）
   * @param choice - 游玩选择项
   */
  const execute = (choice: EventTheaterChoice) => {
    form.value.pt = (form.value.pt ?? 0) + choice.pt;
    form.value.progress = (form.value.progress ?? 0) + (choice.progress ?? 0);
  };

  /**
   * 撤销一次操作（逆向修改表单状态）
   * @param choice - 游玩选择项
   */
  const undo = (choice: EventTheaterChoice) => {
    form.value.pt = (form.value.pt ?? 0) - choice.pt;
    form.value.progress = Math.max(0, (form.value.progress ?? 0) - (choice.progress ?? 0));
  };

  // ============ 快照管理 ============

  /** 创建计算时的表单数据快照 */
  const createSnapshot = () => ({
    targetPt: form.value.targetPt ?? 0,
    pt: form.value.pt ?? 0,
    token: form.value.token ?? 0,
    progress: form.value.progress ?? 0,
  });

  /**
   * 从快照恢复表单字段
   * @param snapshot - 表单数据快照
   */
  const resetToSnapshot = (snapshot: {
    targetPt: number;
    pt: number;
    token: number;
    progress: number;
  }) => {
    form.value.pt = snapshot.pt;
    form.value.token = snapshot.token;
    form.value.progress = snapshot.progress;
  };

  // ============ DFS 计算算法 ============

  /** DFS 搜索参数配置 */
  const DFS_CONFIG = {
    iterationPauseInterval: 100000,
    maxIterations: 10000000,
  } as const;

  /**
   * Tale 活动控分计算算法
   *
   * 使用深度优先搜索（DFS）+ 状态去重算法找到从当前积分到目标积分的游玩路径。
   *
   * 算法特点（与 Theater/Tour 不同）：
   * 由于进度可以增减（打普通曲增加、活动曲减少），搜索空间存在循环可能性，
   * 因此使用 visited Set + pathSet Set 双重状态去重，防止无限循环。
   * 状态哈希键为 `${ptDiff}:${progress}`。
   *
   * @param choices - 游玩选择项列表
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calc(
    choices: EventTheaterChoice[],
    formData: { targetPt: number; pt: number; token: number; progress: number },
  ): Promise<ParkingResult> {
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
    const sortedChoices = [...choices].sort((a, b) => {
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
      if (top.stepIndex >= sortedChoices.length) {
        const hash = `${top.ptDiff}:${top.progress}`;
        visited.add(hash);
        pathSet.delete(hash);
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
