/**
 * 活动控分计算器组合式函数（入口）
 *
 * 按活动类型将具体逻辑拆分到 4 个子组合式：
 * - useMltdEventParkingTheater  — theater / anniversary / trust / tune
 * - useMltdEventParkingTour     — tour
 * - useMltdEventParkingTale     — tale
 * - useMltdEventParkingTreasure — treasure
 *
 * 本入口负责：
 * - 实例化所有子组合式
 * - 根据 eventType 路由到对应的子组合式
 * - 管理共享状态（计算结果、执行计数等）
 * - 提供与原有完全相同的公开 API
 */

import { ref, computed, type Ref } from 'vue';
import type { ParkingForm, ParkingResult, ParkingResultItem } from '../MltdTypes';
import type { EventChoice } from '../MltdTypes';
import { useMltdEventParkingTheater } from './useMltdEventParkingTheater';
import { useMltdEventParkingTour } from './useMltdEventParkingTour';
import { useMltdEventParkingTale } from './useMltdEventParkingTale';
import { useMltdEventParkingTreasure } from './useMltdEventParkingTreasure';

/**
 * 表单数据快照联合类型
 * 不同活动类型保存不同的字段子集
 */
type ParkingSnapshot =
  | { targetPt: number; pt: number; token: number }
  | {
      targetPt: number;
      pt: number;
      token: number;
      itemProgress: number;
      eventLiveProgress: number;
      isBoostPeriod: boolean;
    }
  | { targetPt: number; pt: number; token: number; progress: number }
  | {
      targetPt: number;
      pt: number;
      token: number;
      bonus: number;
      isBoostPeriod: boolean;
    };

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
  eventLiveProgress: 0,
  // Tale 专属字段默认值
  progress: 0,
});

/**
 * 活动控分计算器组合式函数
 * @param form - 表单数据引用
 * @returns 计算结果和操作方法
 */
export function useMltdEventParking(form: Ref<ParkingForm>) {
  // ================================================================
  // 1. 实例化所有子组合式
  // ================================================================

  const theater = useMltdEventParkingTheater(form);
  const tour = useMltdEventParkingTour(form);
  const tale = useMltdEventParkingTale(form);
  const treasure = useMltdEventParkingTreasure(form);

  // ================================================================
  // 2. 根据 eventType 选择当前活跃的子组合式
  // ================================================================

  /** 当前活动类型对应的子组合式实例 */
  const active = computed(() => {
    switch (form.value.eventType) {
      case 'tour':
        return tour;
      case 'tale':
        return tale;
      case 'treasure':
        return treasure;
      default:
        // theater / anniversary / trust / tune
        return theater;
    }
  });

  // ================================================================
  // 3. 共享状态
  // ================================================================

  /** 是否已完成计算 */
  const calculatedFlag = ref(false);
  /** 控分计算结果 */
  const parkingResult = ref<ParkingResult>();
  /** 计算时的表单数据快照 */
  const formSnapshot = ref<ParkingSnapshot>();
  /** 初始方案快照（用于撤销操作的上限判断） */
  const parkingResultSnapshot = ref<ParkingResultItem[]>([]);
  /** 已执行次数记录（key: `${name}-${multiplier}`） */
  const executedCounts = ref<Record<string, number>>({});

  // ================================================================
  // 4. eventChoices（委托子组合式 + 公共过滤）
  // ================================================================

  /**
   * 根据活动类型返回对应的选择项列表，并根据开关过滤 extra 选项
   */
  const eventChoices = computed<EventChoice[]>(() => {
    let choices = active.value.eventChoices.value;

    // 当禁用更多倍率时，过滤掉 extra: true 的选项
    if (form.value.enableExtraChoices === false) {
      choices = choices.filter((c) => !c.extra);
    }

    return choices;
  });

  // ================================================================
  // 5. 共享辅助函数
  // ================================================================

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
   * 生成方案项的唯一标识 key
   */
  const getOperationKey = (item: ParkingResultItem): string => {
    const baseKey = `${item.name}-${item.multiplier}`;
    return item.type ? `${baseKey}-${item.type}` : baseKey;
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

  // ================================================================
  // 6. executeOperation / undoOperation（委托子组合式 + 计数管理）
  // ================================================================

  /**
   * 执行一次操作（模拟玩家进行游戏）
   * @param item - 方案项
   */
  const executeOperation = (item: ParkingResultItem) => {
    const key = getOperationKey(item);

    // 找到对应的 choice
    const choice = eventChoices.value.find(
      (c) =>
        c.name === item.name &&
        c.multiplier === item.multiplier &&
        (item.type === undefined || c.type === item.type),
    );
    if (!choice) return;

    // 委托给活跃子组合式执行类型相关的表单变更
    active.value.execute(choice);

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

    // 找到对应的 choice
    const choice = eventChoices.value.find(
      (c) =>
        c.name === item.name &&
        c.multiplier === item.multiplier &&
        (item.type === undefined || c.type === item.type),
    );
    if (!choice) return;

    // 委托给活跃子组合式执行类型相关的逆向变更
    active.value.undo(choice);

    // 更新执行次数
    executedCounts.value[key] = (executedCounts.value[key] ?? 0) - 1;
  };

  // ================================================================
  // 7. handleSubmit（预处理 → 快照 → 计算 → 保存结果）
  // ================================================================

  /**
   * 提交计算
   *
   * 根据活动类型创建快照并调用对应的子组合式计算函数。
   */
  const handleSubmit = async () => {
    preprocessingForm();

    const choices = eventChoices.value;

    // 按活动类型路由到对应的计算函数
    if (form.value.eventType === 'tour') {
      const snapshot = tour.createSnapshot();
      formSnapshot.value = snapshot;
      parkingResult.value = await tour.calc(choices, snapshot);
    } else if (form.value.eventType === 'tale') {
      const snapshot = tale.createSnapshot();
      formSnapshot.value = snapshot;
      parkingResult.value = await tale.calc(choices, snapshot);
    } else if (form.value.eventType === 'treasure') {
      const snapshot = treasure.createSnapshot();
      formSnapshot.value = snapshot;
      parkingResult.value = await treasure.calc(choices, snapshot);
    } else {
      // theater / anniversary / trust / tune
      const snapshot = theater.createSnapshot();
      formSnapshot.value = snapshot;
      parkingResult.value = await theater.calc(choices, snapshot);
    }

    // 保存初始方案快照并重置执行状态
    if (parkingResult.value?.flag && parkingResult.value.result) {
      parkingResultSnapshot.value = [...parkingResult.value.result];
      executedCounts.value = {};
    }
    calculatedFlag.value = true;
  };

  // ================================================================
  // 8. resetToInitial（委托子组合式恢复快照 + 清空执行记录）
  // ================================================================

  /**
   * 重置为初始状态（恢复表单数据并清空执行记录）
   */
  const resetToInitial = () => {
    if (!formSnapshot.value) return;

    // 按活动类型委托给对应的子组合式恢复快照
    if (form.value.eventType === 'tour') {
      tour.resetToSnapshot(formSnapshot.value as Parameters<typeof tour.resetToSnapshot>[0]);
    } else if (form.value.eventType === 'tale') {
      tale.resetToSnapshot(formSnapshot.value as Parameters<typeof tale.resetToSnapshot>[0]);
    } else if (form.value.eventType === 'treasure') {
      treasure.resetToSnapshot(
        formSnapshot.value as Parameters<typeof treasure.resetToSnapshot>[0],
      );
    } else {
      theater.resetToSnapshot(formSnapshot.value as Parameters<typeof theater.resetToSnapshot>[0]);
    }

    executedCounts.value = {};
  };

  // ================================================================
  // 9. 返回公开 API（与原有完全一致）
  // ================================================================

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
