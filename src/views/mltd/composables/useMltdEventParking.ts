/**
 * 活动控分计算器组合式函数
 * 提供表单预处理、计算逻辑和状态管理
 */

import { ref, type Ref } from 'vue';
import { MLTD_PARKING_CONSTANTS } from '../MltdConstant';
import type { ParkingForm, ParkingResult, ParkingResultItem } from '../MltdTypes';

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
  const eventTheaterChoices = MLTD_PARKING_CONSTANTS.eventTheaterChoices;

  const calculatedFlag = ref(false);
  const parkingResult = ref<ParkingResult>();

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
  };

  /**
   * 提交计算
   */
  const handleSubmit = async () => {
    preprocessingForm();
    if (form.value.eventType === 'theater' || form.value.eventType === 'anniversary') {
      parkingResult.value = await calcParkingTheater(
        {
          targetPt: form.value.targetPt ?? 0,
          pt: form.value.pt ?? 0,
          token: form.value.token ?? 0,
        },
        form.value.eventType === 'anniversary',
      );
    }
    calculatedFlag.value = true;
  };

  /**
   * Theater / Anniversary 活动控分计算算法
   * @param formData - 表单数据（已预处理）
   * @param isAnniversary - 是否为周年活动
   * @returns 计算结果
   */
  async function calcParkingTheater(
    formData: { targetPt: number; pt: number; token: number },
    isAnniversary = false,
  ): Promise<ParkingResult> {
    if (formData.pt >= formData.targetPt) {
      return { flag: false, message: '当前pt已达到或超过目标pt' };
    }
    if (formData.targetPt - formData.pt > 10000) {
      return { flag: false, message: 'pt差距大于10000，请缩小后重试' };
    }

    // 过滤可用的选择项
    const choices = eventTheaterChoices.filter(
      (each) => isAnniversary || !each.anniversaryOnly,
    );

    // 栈节点结构
    interface StackNode {
      ptDiff: number; // pt 差距（负数表示还需要多少）
      token: number;
      stepIndex: number; // 下一个要尝试的步骤索引
      viaStepIndex?: number; // 到达此状态所用的步骤索引
    }

    let iterations = 0;
    const stack: StackNode[] = [
      { ptDiff: formData.pt - formData.targetPt, token: formData.token, stepIndex: 0 },
    ];

    while (stack.length) {
      // 防阻塞：每 100000 次迭代让出执行权
      iterations++;
      if (iterations % 100000 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }

      const top = stack[stack.length - 1]!;

      // 所有步骤都尝试过了，回溯
      if (top.stepIndex >= choices.length) {
        stack.pop();
        continue;
      }

      // 获取当前要尝试的步骤
      const currentStepIndex = top.stepIndex;
      top.stepIndex++; // 下次尝试下一个步骤

      const choice = choices[currentStepIndex]!;

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
          const choice = choices[Number(key)]!;
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
    eventTheaterChoices,
    preprocessingForm,
    handleClear,
    handleSubmit,
  };
}
