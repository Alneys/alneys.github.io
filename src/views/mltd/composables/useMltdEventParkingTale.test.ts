import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import { useMltdEventParkingTale } from './useMltdEventParkingTale';
import type { ParkingForm, EventChoice } from '../MltdTypes';

function createForm(overrides: Partial<ParkingForm> = {}): ParkingForm {
  return {
    eventType: 'tale',
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

describe('useMltdEventParkingTale', () => {
  describe('eventChoices', () => {
    it('应包含活动曲、1st/2nd/3rd 选项', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTale(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      const types = new Set(eventChoices.value.map((c) => c.type));
      expect(types.has('活动曲')).toBe(true);
      expect(types.has('1st')).toBe(true);
      expect(types.has('2nd')).toBe(true);
      expect(types.has('3rd')).toBe(true);
    });

    it('活动曲的 progress 应为 -100', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTale(form);
      await nextTick();

      const el = eventChoices.value.find((c) => c.type === '活动曲');
      expect(el?.progress).toBe(-100);
      expect(el?.pt).toBe(3000);
    });

    it('3rd 选项应有正 progress', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTale(form);
      await nextTick();

      const thirdStages = eventChoices.value.filter((c) => c.type === '3rd');
      expect(thirdStages.length).toBeGreaterThan(0);
      for (const c of thirdStages) {
        expect(c.progress).toBeGreaterThan(0);
      }
    });

    it('1st/2nd 选项的 progress 应为 0', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTale(form);
      await nextTick();

      const firstStages = eventChoices.value.filter((c) => c.type === '1st');
      const secondStages = eventChoices.value.filter((c) => c.type === '2nd');
      for (const c of [...firstStages, ...secondStages]) {
        expect(c.progress).toBe(0);
      }
    });
  });

  describe('execute / undo', () => {
    it('execute 应累加 pt 和 progress', () => {
      const form = ref<ParkingForm>(createForm({ pt: 200, progress: 50 }));
      const { execute } = useMltdEventParkingTale(form);

      const choice: EventChoice = {
        name: 'Million Mix',
        type: '3rd',
        multiplier: '1倍',
        pt: 600,
        token: 0,
        progress: 50,
      };
      execute(choice);

      expect(form.value.pt).toBe(800);
      expect(form.value.progress).toBe(100);
    });

    it('活动曲 execute 应消耗 progress', () => {
      const form = ref<ParkingForm>(createForm({ pt: 500, progress: 100 }));
      const { execute } = useMltdEventParkingTale(form);

      const choice: EventChoice = {
        name: '活动曲',
        type: '活动曲',
        multiplier: '1倍',
        pt: 3000,
        token: 0,
        progress: -100,
      };
      execute(choice);

      expect(form.value.pt).toBe(3500);
      expect(form.value.progress).toBe(0);
    });

    it('undo 应扣减 pt 和 progress', () => {
      const form = ref<ParkingForm>(createForm({ pt: 800, progress: 100 }));
      const { undo } = useMltdEventParkingTale(form);

      const choice: EventChoice = {
        name: 'Million Mix',
        type: '3rd',
        multiplier: '1倍',
        pt: 600,
        token: 0,
        progress: 50,
      };
      undo(choice);

      expect(form.value.pt).toBe(200);
      expect(form.value.progress).toBe(50);
    });

    it('活动曲 undo 应将 progress 加回（逆向消耗）', () => {
      const form = ref<ParkingForm>(createForm({ pt: 3500, progress: 0 }));
      const { undo } = useMltdEventParkingTale(form);

      const choice: EventChoice = {
        name: '活动曲',
        type: '活动曲',
        multiplier: '1倍',
        pt: 3000,
        token: 0,
        progress: -100,
      };
      undo(choice);

      expect(form.value.pt).toBe(500);
      expect(form.value.progress).toBe(100); // 0 - (-100) = 100
    });

    it('undo progress 不应低于 0', () => {
      const form = ref<ParkingForm>(createForm({ pt: 200, progress: 30 }));
      const { undo } = useMltdEventParkingTale(form);

      const choice: EventChoice = {
        name: 'Million Mix',
        type: '3rd',
        multiplier: '1倍',
        pt: 600,
        token: 0,
        progress: 50,
      };
      undo(choice);

      expect(form.value.pt).toBe(-400); // pt 可为负
      expect(form.value.progress).toBe(0); // max(0, 30-50) = 0
    });

    it('1st/2nd 选项 undo 不改变 progress（progress=0）', () => {
      const form = ref<ParkingForm>(createForm({ pt: 400, progress: 50 }));
      const { undo } = useMltdEventParkingTale(form);

      const choice: EventChoice = {
        name: 'Million Mix',
        type: '2nd',
        multiplier: '1倍',
        pt: 400,
        token: 0,
        progress: 0,
      };
      undo(choice);

      expect(form.value.pt).toBe(0);
      expect(form.value.progress).toBe(50); // unchanged
    });
  });

  describe('createSnapshot / resetToSnapshot', () => {
    it('createSnapshot 应包含 progress 字段', () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: 10000, pt: 2000, token: 500, progress: 80 }),
      );
      const { createSnapshot } = useMltdEventParkingTale(form);

      expect(createSnapshot()).toEqual({ targetPt: 10000, pt: 2000, token: 500, progress: 80 });
    });

    it('resetToSnapshot 应恢复 pt/token/progress', () => {
      const form = ref<ParkingForm>(createForm({ pt: 999, token: 999, progress: 999 }));
      const { resetToSnapshot } = useMltdEventParkingTale(form);

      resetToSnapshot({ targetPt: 10000, pt: 100, token: 50, progress: 70 });

      expect(form.value.pt).toBe(100);
      expect(form.value.token).toBe(50);
      expect(form.value.progress).toBe(70);
    });
  });

  describe('calc (DFS)', () => {
    it('负数参数应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTale(form);
      await nextTick();

      const result = await calc([], { targetPt: -1, pt: 0, token: 0, progress: 0 });
      expect(result.flag).toBe(false);
      expect(result.message).toBe('参数不能为负数');
    });

    it('pt >= targetPt 时应返回已达标', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTale(form);
      await nextTick();

      const result = await calc([], { targetPt: 100, pt: 200, token: 0, progress: 0 });
      expect(result.flag).toBe(true);
      expect(result.result).toEqual([]);
    });

    it('progress < 100 时无法使用活动曲，可用 3rd 选项', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 600, pt: 0, progress: 50 }));
      const { eventChoices, calc } = useMltdEventParkingTale(form);
      await nextTick();

      const snapshot = { targetPt: 600, pt: 0, token: 0, progress: 50 };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(true);
      const mm = result.result!.find((r) => r.name === 'Million Mix' && r.type === '3rd');
      expect(mm).toBeDefined();
      expect(mm!.value).toBe(1);
    });

    it('progress >= 100 时只能打活动曲', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 3000, pt: 0, progress: 100 }));
      const { eventChoices, calc } = useMltdEventParkingTale(form);
      await nextTick();

      const snapshot = { targetPt: 3000, pt: 0, token: 0, progress: 100 };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(true);
      expect(result.result!.length).toBe(1);
      expect(result.result![0]!.name).toBe('活动曲');
      expect(result.result![0]!.value).toBe(1);
    });

    it('progress >= 100 打活动曲后再用 3rd 凑剩余积分', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 3600, pt: 0, progress: 100 }));
      const { eventChoices, calc } = useMltdEventParkingTale(form);
      await nextTick();

      const snapshot = { targetPt: 3600, pt: 0, token: 0, progress: 100 };
      const result = await calc(eventChoices.value, snapshot);

      // 活动曲 (3000) + 3rd MM (600) = 3600
      expect(result.flag).toBe(true);
      const totalPt = result.result!.reduce(
        (sum, r) =>
          sum +
          r.value *
            (eventChoices.value.find(
              (c) => c.name === r.name && c.multiplier === r.multiplier && c.type === r.type,
            )?.pt ?? 0),
        0,
      );
      expect(totalPt).toBe(3600);
    });

    it('积分差距大于 100000 应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTale(form);
      await nextTick();

      const result = await calc([], { targetPt: 200000, pt: 0, token: 0, progress: 0 });
      expect(result.flag).toBe(false);
      expect(result.message).toContain('积分差距大于100000');
    });

    it('目标不可达时应返回不存在方案', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 1, pt: 0, progress: 0 }));
      const { eventChoices, calc } = useMltdEventParkingTale(form);
      await nextTick();

      const snapshot = { targetPt: 1, pt: 0, token: 0, progress: 0 };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(false);
      expect(result.message).toBe('不存在控分方案');
    });

    it('应能处理多次活动曲 + 3rd 的循环', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 6600, pt: 0, progress: 100 }));
      const { eventChoices, calc } = useMltdEventParkingTale(form);
      await nextTick();

      const snapshot = { targetPt: 6600, pt: 0, token: 0, progress: 100 };
      const result = await calc(eventChoices.value, snapshot);

      // 活动曲(3000) + 3rd MM(600) = 3600, 积累 progress=50
      // 但 progress 50 < 100，不能打活动曲
      // 再打一次 3rd MM(600): progress 50+50=100, ptDiff=-6600+3600+600=-2400
      // progress=100, 打活动曲(3000): progress=0, ptDiff=-2400+3000=600>0... over

      expect(result.flag).toBeTruthy();
      const totalPt = result.result!.reduce(
        (sum, r) =>
          sum +
          r.value *
            (eventChoices.value.find(
              (c) => c.name === r.name && c.multiplier === r.multiplier && c.type === r.type,
            )?.pt ?? 0),
        0,
      );
      expect(totalPt).toBe(6600);
    }, 10000);
  });
});
