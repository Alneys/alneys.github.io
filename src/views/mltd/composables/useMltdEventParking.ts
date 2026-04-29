/**
 * 活动控分计算器组合式函数
 * 提供表单预处理、计算逻辑和状态管理
 */

import { ref, computed, type Ref } from 'vue';
import { MLTD_PARKING_CONSTANTS } from '../MltdConstant';
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
});

/**
 * 活动控分计算器组合式函数
 * @param form - 表单数据引用
 * @returns 计算结果和操作方法
 */
export function useMltdEventParking(form: Ref<ParkingForm>) {
  // 根据活动类型返回对应的选择项列表
  const eventTheaterChoices = computed<EventTheaterChoice[]>(() => {
    if (form.value.eventType === 'anniversary') {
      return MLTD_PARKING_CONSTANTS.eventAnniversaryChoices;
    }
    return MLTD_PARKING_CONSTANTS.eventTheaterChoices;
  });

  const calculatedFlag = ref(false);
  const parkingResult = ref<ParkingResult>();

  /** 计算时的表单数据快照 */
  const formSnapshot = ref<{ targetPt: number; pt: number; token: number }>();

  /**
   * 预处理表单数据
   * @description 将 undefined 字段转换为 0
   */
  const preprocessingForm = () => {
    Object.keys(form.value).forEach((each) => {
      const key = each as keyof ParkingForm;
      if (key !== 'eventType') {
        (form.value as unknown as Record<string, number | string>)[key] =
          Number(form.value[key]) || 0;
      }
    });
  };

  /**
   * 清除计算状态
   */
  const handleClear = () => {
    calculatedFlag.value = false;
    formSnapshot.value = undefined;
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
    if (form.value.eventType === 'theater' || form.value.eventType === 'anniversary') {
      parkingResult.value = await calcParkingTheater(formSnapshot.value);
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
   * Theater / Anniversary 活动控分计算算法
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
      return { flag: false, message: 'pt差距大于100000，请缩小后重试' };
    }

    // 使用当前活动类型对应的选择项，并按 pt 降序排序（优先尝试高收益选项）
    const choices = [...eventTheaterChoices.value].sort((a, b) => b.pt - a.pt);

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
    eventTheaterChoices,
    preprocessingForm,
    handleClear,
    handleSubmit,
  };
}
