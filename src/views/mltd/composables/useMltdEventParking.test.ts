import { describe, it, expect, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useMltdEventParking, createDefaultParkingForm } from './useMltdEventParking';
import type { ParkingForm } from '../MltdTypes';

function createForm(overrides: Partial<ParkingForm> = {}): ParkingForm {
  return {
    eventType: 'theater',
    targetPt: 0,
    pt: 0,
    token: 0,
    enableExtraChoices: true,
    bonus: 30,
    isBoostPeriod: true,
    itemProgress: 0,
    eventLiveProgress: 0,
    progress: 0,
    ...overrides,
  };
}

describe('useMltdEventParking', () => {
  describe('createDefaultParkingForm', () => {
    it('应返回正确的默认值', () => {
      const defaults = createDefaultParkingForm();

      expect(defaults.eventType).toBe('theater');
      expect(defaults.targetPt).toBeUndefined();
      expect(defaults.pt).toBeUndefined();
      expect(defaults.token).toBeUndefined();
      expect(defaults.enableExtraChoices).toBe(true);
      expect(defaults.bonus).toBe(30);
      expect(defaults.isBoostPeriod).toBe(true);
      expect(defaults.itemProgress).toBe(0);
      expect(defaults.eventLiveProgress).toBe(0);
      expect(defaults.progress).toBe(0);
    });
  });

  describe('preprocessingForm', () => {
    it('应将 undefined 字段转换为 0', () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: undefined, pt: undefined, token: undefined }),
      );
      const { preprocessingForm } = useMltdEventParking(form);

      preprocessingForm();

      expect(form.value.targetPt).toBe(0);
      expect(form.value.pt).toBe(0);
      expect(form.value.token).toBe(0);
    });

    it('应保留已有数值', () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 5000, pt: 1000, token: 200 }));
      const { preprocessingForm } = useMltdEventParking(form);

      preprocessingForm();

      expect(form.value.targetPt).toBe(5000);
      expect(form.value.pt).toBe(1000);
      expect(form.value.token).toBe(200);
    });
  });

  describe('handleClear', () => {
    it('应重置所有计算状态', () => {
      const form = ref<ParkingForm>(createForm());
      const { handleClear, calculatedFlag, formSnapshot, parkingResultSnapshot, executedCounts } =
        useMltdEventParking(form);

      calculatedFlag.value = true;
      formSnapshot.value = { targetPt: 100, pt: 50, token: 10 };
      parkingResultSnapshot.value = [{ name: 'test', multiplier: '1倍', value: 1 }];
      executedCounts.value = { 'test-1倍': 2 };

      handleClear();

      expect(calculatedFlag.value).toBe(false);
      expect(formSnapshot.value).toBeUndefined();
      expect(parkingResultSnapshot.value).toEqual([]);
      expect(executedCounts.value).toEqual({});
    });
  });

  describe('eventChoices 路由', () => {
    it('theater 类型应返回 Theater 选项', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'theater' }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      expect(eventChoices.value.some((c) => c.name === 'MM 通常曲')).toBe(true);
    });

    it('tour 类型应返回 Tour 选项', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'tour' }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      expect(eventChoices.value.some((c) => c.name === 'Million Mix')).toBe(true);
    });

    it('tale 类型应返回 Tale 选项', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'tale' }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      const types = new Set(eventChoices.value.map((c) => c.type));
      expect(types.has('3rd')).toBe(true);
    });

    it('treasure 类型应返回 Treasure 选项', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'treasure' }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      expect(eventChoices.value.some((c) => c.name.includes('[组曲]'))).toBe(true);
    });

    it('tune 类型应路由到 Theater 组合式', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'tune' }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      expect(eventChoices.value.some((c) => c.name === 'Million Mix')).toBe(true);
    });

    it('anniversary 类型应路由到 Theater 组合式', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'anniversary' }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      expect(eventChoices.value.some((c) => c.name.includes('推荐曲'))).toBe(true);
    });

    it('trust 类型应路由到 Theater 组合式', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'trust' }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      expect(eventChoices.value.some((c) => c.type === '活动曲')).toBe(true);
    });
  });

  describe('eventChoices 过滤 (enableExtraChoices)', () => {
    it('enableExtraChoices=true 时应包含 extra 选项', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'theater', enableExtraChoices: true }));
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      const extraChoices = eventChoices.value.filter((c) => c.extra === true);
      expect(extraChoices.length).toBeGreaterThan(0);
    });

    it('enableExtraChoices=false 时应过滤掉 extra 选项', async () => {
      const form = ref<ParkingForm>(
        createForm({ eventType: 'theater', enableExtraChoices: false }),
      );
      const { eventChoices } = useMltdEventParking(form);
      await nextTick();

      const extraChoices = eventChoices.value.filter((c) => c.extra === true);
      expect(extraChoices.length).toBe(0);
    });
  });

  describe('handleSubmit', () => {
    it('theater 计算成功时应设置计算结果', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 85, pt: 0, token: 1000 }));
      const {
        handleSubmit,
        calculatedFlag,
        parkingResult,
        formSnapshot,
        parkingResultSnapshot,
        executedCounts,
      } = useMltdEventParking(form);

      await handleSubmit();

      expect(calculatedFlag.value).toBe(true);
      expect(parkingResult.value?.flag).toBe(true);
      expect(parkingResult.value?.result).toBeDefined();
      expect(parkingResult.value!.result!.length).toBeGreaterThan(0);
      expect(formSnapshot.value).toBeDefined();
      expect(parkingResultSnapshot.value.length).toBeGreaterThan(0);
      expect(executedCounts.value).toEqual({});
    });

    it('theater 计算成功后应执行 preprocessingForm', async () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: 85, pt: undefined, token: undefined, enableExtraChoices: false }),
      );
      const { handleSubmit } = useMltdEventParking(form);

      await handleSubmit();

      expect(form.value.targetPt).toBe(85);
      expect(form.value.pt).toBe(0);
      expect(form.value.token).toBe(0);
    });

    it('theater 失败时应设置错误信息', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 1, pt: 0, token: 0 }));
      const { handleSubmit, calculatedFlag, parkingResult } = useMltdEventParking(form);

      await handleSubmit();

      expect(calculatedFlag.value).toBe(true);
      expect(parkingResult.value?.flag).toBe(false);
      expect(parkingResult.value?.message).toBeDefined();
    });

    it('tour 计算成功时应设置结果', async () => {
      const form = ref<ParkingForm>(
        createForm({ eventType: 'tour', targetPt: 140, pt: 0, token: 10, eventLiveProgress: 0 }),
      );
      const { handleSubmit, calculatedFlag, parkingResult } = useMltdEventParking(form);

      await handleSubmit();

      expect(calculatedFlag.value).toBe(true);
      expect(parkingResult.value?.flag).toBe(true);
    });

    it('tale 计算成功时应设置结果', async () => {
      const form = ref<ParkingForm>(
        createForm({ eventType: 'tale', targetPt: 600, pt: 0, progress: 50 }),
      );
      const { handleSubmit, calculatedFlag, parkingResult } = useMltdEventParking(form);

      await handleSubmit();

      expect(calculatedFlag.value).toBe(true);
      expect(parkingResult.value?.flag).toBe(true);
    });

    it('treasure 计算成功时应设置结果', async () => {
      const form = ref<ParkingForm>(
        createForm({ eventType: 'treasure', targetPt: 794, pt: 0, bonus: 1.7 }),
      );
      const { handleSubmit, calculatedFlag, parkingResult } = useMltdEventParking(form);

      await handleSubmit();

      expect(calculatedFlag.value).toBe(true);
      expect(parkingResult.value?.flag).toBe(true);
    });
  });

  describe('executeOperation / undoOperation', () => {
    it('executeOperation 应委托到子组合式修改表单 pt', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 149, pt: 0, token: 1000 }));

      const hook = useMltdEventParking(form);
      await hook.handleSubmit();

      const beforePt = form.value.pt ?? 0;

      const result = hook.parkingResult.value?.result;
      if (result && result.length > 0) {
        const firstItem = result[0]!;
        hook.executeOperation(firstItem);

        expect(form.value.pt).toBeGreaterThan(beforePt);
        const key =
          `${firstItem.name}-${firstItem.multiplier}` +
          (firstItem.type ? `-${firstItem.type}` : '');
        expect(hook.executedCounts.value[key]).toBe(1);
      }
    });

    it('undoOperation 应减少执行次数并还原 pt', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 149, pt: 0, token: 1000 }));

      const hook = useMltdEventParking(form);
      await hook.handleSubmit();

      const result = hook.parkingResult.value?.result;
      if (result && result.length > 0) {
        const firstItem = result[0]!;
        const beforePt = form.value.pt ?? 0;

        hook.executeOperation(firstItem);
        const afterExecutePt = form.value.pt ?? 0;
        expect(afterExecutePt).toBeGreaterThan(beforePt);

        hook.undoOperation(firstItem);
        expect(form.value.pt).toBe(beforePt);

        const key =
          `${firstItem.name}-${firstItem.multiplier}` +
          (firstItem.type ? `-${firstItem.type}` : '');
        expect(hook.executedCounts.value[key]).toBe(0);
      }
    });
  });

  describe('getRemainingCount / getInitialCount', () => {
    it('getInitialCount 应返回方案项的初始次数', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 85, pt: 0, token: 1000 }));
      const hook = useMltdEventParking(form);
      await hook.handleSubmit();

      const result = hook.parkingResult.value?.result;
      if (result && result.length > 0) {
        const item = result[0]!;
        expect(hook.getInitialCount(item)).toBe(item.value);
      }
    });

    it('getRemainingCount 应等于 initial - executed', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 85, pt: 0, token: 1000 }));
      const hook = useMltdEventParking(form);
      await hook.handleSubmit();

      const result = hook.parkingResult.value?.result;
      if (result && result.length > 0) {
        const item = result[0]!;
        const initialCount = hook.getInitialCount(item);

        hook.executeOperation(item);
        expect(hook.getRemainingCount(item)).toBe(initialCount - 1);

        hook.undoOperation(item);
        expect(hook.getRemainingCount(item)).toBe(initialCount);
      }
    });
  });

  describe('resetToInitial', () => {
    it('应恢复表单数据并清空执行记录', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 149, pt: 0, token: 1000 }));
      const hook = useMltdEventParking(form);
      await hook.handleSubmit();

      const result = hook.parkingResult.value?.result;
      if (result && result.length > 0) {
        const firstItem = result[0]!;
        hook.executeOperation(firstItem);

        expect(hook.executedCounts.value).not.toEqual({});

        hook.resetToInitial();

        expect(hook.executedCounts.value).toEqual({});
        expect(form.value.pt).toBe(0);
      }
    });
  });
});
