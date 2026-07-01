import { ref, nextTick } from 'vue';

import { describe, it, expect } from 'vitest';

import type { ParkingForm, EventChoice } from '../utils/MltdTypes';
import { useMltdEventParkingTreasure } from './useMltdEventParkingTreasure';

function createForm(overrides: Partial<ParkingForm> = {}): ParkingForm {
  return {
    eventType: 'treasure',
    targetPt: 0,
    pt: 0,
    token: 0,
    enableExtraChoices: true,
    bonus: 1.7,
    isBoostPeriod: true,
    itemProgress: 0,
    eventLiveProgress: 0,
    progress: 0,
    ...overrides,
  };
}

describe('useMltdEventParkingTreasure', () => {
  describe('eventChoices', () => {
    it('应包含 组曲 和 单首 选项', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTreasure(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      expect(eventChoices.value.some((c) => c.name.includes('[组曲]'))).toBe(true);
      expect(eventChoices.value.some((c) => c.name.includes('[单首]'))).toBe(true);
    });

    it('选项的 token 应始终为 0', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTreasure(form);
      await nextTick();

      for (const c of eventChoices.value) {
        expect(c.token).toBe(0);
      }
    });

    it('isBoostPeriod=false 时不应包含最高打工票倍率', async () => {
      const form = ref<ParkingForm>(createForm({ isBoostPeriod: false }));
      const { eventChoices } = useMltdEventParkingTreasure(form);
      await nextTick();

      // 最高打工票倍率为 2.8，isBoostPeriod=false 时应跳过
      for (const c of eventChoices.value.filter((c) => c.type === '打工票')) {
        const mag = parseFloat(c.multiplier.replace('倍', ''));
        expect(mag).toBeLessThan(2.8);
      }
    });

    it('bonus=1.0 时积分应为基础值', async () => {
      const form = ref<ParkingForm>(createForm({ bonus: 1.0 }));
      const { eventChoices } = useMltdEventParkingTreasure(form);
      await nextTick();

      // 2 Mix [单首] 体力: ceil(71 * 1.0) = 71
      const choice = eventChoices.value.find((c) => c.name === '2 Mix [单首]' && c.type === '体力');
      expect(choice?.pt).toBe(71);
    });
  });

  describe('execute / undo', () => {
    it('execute 应累加 pt（无 token 变化）', () => {
      const form = ref<ParkingForm>(createForm({ pt: 500 }));
      const { execute } = useMltdEventParkingTreasure(form);

      const choice: EventChoice = {
        name: 'Million Mix [单首]',
        type: '体力',
        multiplier: '1倍',
        pt: 794,
        token: 0,
      };
      execute(choice);

      expect(form.value.pt).toBe(1294);
    });

    it('undo 应扣减 pt', () => {
      const form = ref<ParkingForm>(createForm({ pt: 1000 }));
      const { undo } = useMltdEventParkingTreasure(form);

      const choice: EventChoice = {
        name: 'Million Mix [单首]',
        type: '体力',
        multiplier: '1倍',
        pt: 794,
        token: 0,
      };
      undo(choice);

      expect(form.value.pt).toBe(206);
    });
  });

  describe('createSnapshot / resetToSnapshot', () => {
    it('createSnapshot 应包含 bonus 和 isBoostPeriod 字段', () => {
      const form = ref<ParkingForm>(
        createForm({
          targetPt: 50000,
          pt: 1000,
          token: 0,
          bonus: 1.5,
          isBoostPeriod: false,
        }),
      );
      const { createSnapshot } = useMltdEventParkingTreasure(form);

      expect(createSnapshot()).toEqual({
        targetPt: 50000,
        pt: 1000,
        token: 0,
        bonus: 1.5,
        isBoostPeriod: false,
      });
    });

    it('resetToSnapshot 应恢复所有字段', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 999, token: 999, bonus: 2.0, isBoostPeriod: true }),
      );
      const { resetToSnapshot } = useMltdEventParkingTreasure(form);

      resetToSnapshot({ targetPt: 50000, pt: 500, token: 0, bonus: 1.5, isBoostPeriod: false });

      expect(form.value.pt).toBe(500);
      expect(form.value.token).toBe(0);
      expect(form.value.bonus).toBe(1.5);
      expect(form.value.isBoostPeriod).toBe(false);
    });
  });

  describe('calc (DFS)', () => {
    it('负数参数应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTreasure(form);
      await nextTick();

      const result = await calc([], {
        targetPt: -1,
        pt: 0,
        token: 0,
        bonus: 1.7,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(false);
      expect(result.message).toBe('参数不能为负数');
    });

    it('bonus < 1.0 应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTreasure(form);
      await nextTick();

      const result = await calc([], {
        targetPt: 1000,
        pt: 0,
        token: 0,
        bonus: 0.5,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(false);
      expect(result.message).toContain('获得pt加成倍率必须在 1.0 ~ 1.7 之间');
    });

    it('bonus > 1.7 应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTreasure(form);
      await nextTick();

      const result = await calc([], {
        targetPt: 1000,
        pt: 0,
        token: 0,
        bonus: 2.0,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(false);
      expect(result.message).toContain('获得pt加成倍率必须在 1.0 ~ 1.7 之间');
    });

    it('pt >= targetPt 时应返回已达标', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTreasure(form);
      await nextTick();

      const result = await calc([], {
        targetPt: 100,
        pt: 200,
        token: 0,
        bonus: 1.7,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(true);
      expect(result.result).toEqual([]);
    });

    it('应找到精确匹配的解（单首体力）', async () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: 794, pt: 0, bonus: 1.7, isBoostPeriod: true }),
      );
      const { eventChoices, calc } = useMltdEventParkingTreasure(form);
      await nextTick();

      const snapshot = { targetPt: 794, pt: 0, token: 0, bonus: 1.7, isBoostPeriod: true };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.length).toBeGreaterThan(0);
      const mm = result.result!.find((r) => r.name === 'Million Mix [单首]');
      expect(mm).toBeDefined();
      expect(mm!.value).toBe(1);
    });

    it('积分差距大于 100000 应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTreasure(form);
      await nextTick();

      const result = await calc([], {
        targetPt: 200000,
        pt: 0,
        token: 0,
        bonus: 1.7,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(false);
      expect(result.message).toContain('积分差距大于100000');
    });

    it('目标不可达时应返回不存在方案', async () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: 1, pt: 0, bonus: 1.7, isBoostPeriod: true }),
      );
      const { eventChoices, calc } = useMltdEventParkingTreasure(form);
      await nextTick();

      const snapshot = { targetPt: 1, pt: 0, token: 0, bonus: 1.7, isBoostPeriod: true };
      const result = await calc(eventChoices.value, snapshot);

      // 最小选项 pt 为 71（2 Mix [单首] 体力 bonus=1.0）
      // bonus=1.7 时最小为 ceil(71*1.7) = 121，无法精确匹配 1
      expect(result.flag).toBe(false);
      expect(result.message).toBe('不存在控分方案');
    });
  });
});
