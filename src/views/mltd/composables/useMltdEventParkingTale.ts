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

import { MLTD_PARKING_CONSTANTS, DFS_CONFIG } from '../data/MltdEventParkingConstants';
import type {
  ParkingForm,
  ParkingResult,
  ParkingResultItem,
  EventChoice,
} from '../utils/MltdTypes';

/**
 * Tale 活动控分计算子组合式
 * @param form - 表单数据引用
 * @returns 类型相关的状态和方法
 */
export function useMltdEventParkingTale(form: Ref<ParkingForm>) {
  // ============ 选择项生成 ============

  /** 生成 Tale 活动的游玩选择列表 */
  const eventChoices = computed<EventChoice[]>(() => {
    return MLTD_PARKING_CONSTANTS.generateTaleChoices();
  });

  // ============ 执行 / 撤销操作 ============

  /**
   * 执行一次操作（修改表单状态）
   * @param choice - 游玩选择项
   */
  const execute = (choice: EventChoice) => {
    form.value.pt = (form.value.pt ?? 0) + choice.pt;
    form.value.progress = (form.value.progress ?? 0) + (choice.progress ?? 0);
  };

  /**
   * 撤销一次操作（逆向修改表单状态）
   * @param choice - 游玩选择项
   */
  const undo = (choice: EventChoice) => {
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

  /**
   * 活动控分计算算法（Tale 专用）
   *
   * 使用深度优先搜索（DFS）算法找到从当前积分到目标积分的最优游玩路径。
   *
   * 状态特征：pt 单向递增，进度可增可减（3rd 增加、活动曲减少）。
   *
   * @param choices - 游玩选择项列表
   * @param formData - 表单数据（已预处理）
   * @returns 计算结果
   */
  async function calc(
    choices: EventChoice[],
    formData: { targetPt: number; pt: number; token: number; progress: number },
  ): Promise<ParkingResult> {
    // ---- 输入验证 ----

    // 负数参数
    if (formData.targetPt < 0 || formData.pt < 0 || formData.progress < 0) {
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
    // 优先级：活动曲（type === '活动曲'）优先 → 按 pt 降序
    const sortedChoices = [...choices].sort((a, b) => {
      const aIsEventLive = a.type === '活动曲';
      const bIsEventLive = b.type === '活动曲';

      if (aIsEventLive && !bIsEventLive) return -1;
      if (!aIsEventLive && bIsEventLive) return 1;

      return b.pt - a.pt;
    });

    // ---- 栈节点类型定义 ----
    interface StackNode {
      ptDiff: number;
      progress: number;
      stepIndex: number;
      viaStepIndex?: number;
    }

    // ---- 搜索初始化 ----
    let iterations = 0;
    const startPtDiff = formData.pt - formData.targetPt;
    const stack: StackNode[] = [{ ptDiff: startPtDiff, progress: formData.progress, stepIndex: 0 }];

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
      // 进度 < 100 时不能打活动曲
      if (top.progress < 100 && choice.type === '活动曲') continue;
      // 进度 ≥ 100 时必须先打活动曲（不能打普通曲）
      if (top.progress >= 100 && choice.type !== '活动曲') continue;

      // ---- 计算新状态 ----
      const newPtDiff = top.ptDiff + choice.pt;
      const newProgress = top.progress + (choice.progress ?? 0);

      // 积分不能超过目标
      if (newPtDiff > 0) continue;

      // 找到解
      if (newPtDiff === 0) {
        stack.push({
          ptDiff: newPtDiff,
          progress: newProgress,
          stepIndex: 0,
          viaStepIndex: currentStepIndex,
        });
        break;
      }

      // 继续深入搜索
      stack.push({
        ptDiff: newPtDiff,
        progress: newProgress,
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
