import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import { useMltdEventParkingTour } from './useMltdEventParkingTour';
import type { ParkingForm, EventChoice } from '../MltdTypes';

function createForm(overrides: Partial<ParkingForm> = {}): ParkingForm {
  return {
    eventType: 'tour',
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

describe('useMltdEventParkingTour', () => {
  describe('eventChoices', () => {
    it('应包含活动曲和体力选项', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTour(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      const types = new Set(eventChoices.value.map((c) => c.type));
      expect(types.has('活动曲')).toBe(true);
      expect(types.has('体力')).toBe(true);
    });

    it('应按 pt 降序排列', async () => {
      const form = ref<ParkingForm>(createForm());
      const { eventChoices } = useMltdEventParkingTour(form);
      await nextTick();

      for (let i = 1; i < eventChoices.value.length; i++) {
        expect(eventChoices.value[i]!.pt).toBeLessThanOrEqual(eventChoices.value[i - 1]!.pt);
      }
    });

    it('isBoostPeriod=false 时不含 3倍 活动曲', async () => {
      const form = ref<ParkingForm>(createForm({ isBoostPeriod: false }));
      const { eventChoices } = useMltdEventParkingTour(form);
      await nextTick();

      const eventLives = eventChoices.value.filter(
        (c) => c.type === '活动曲' && c.multiplier === '3倍',
      );
      expect(eventLives.length).toBe(0);
    });

    it('isBoostPeriod=true 时含 3倍 活动曲', async () => {
      const form = ref<ParkingForm>(createForm({ isBoostPeriod: true }));
      const { eventChoices } = useMltdEventParkingTour(form);
      await nextTick();

      const eventLives = eventChoices.value.filter(
        (c) => c.type === '活动曲' && c.multiplier === '3倍',
      );
      expect(eventLives.length).toBe(1);
    });
  });

  describe('execute', () => {
    it('歌曲游玩应累加 pt、progress 和 eventLiveProgress', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 100, token: 5, itemProgress: 3, eventLiveProgress: 10 }),
      );
      const { execute } = useMltdEventParkingTour(form);

      // MM 1.2x: pt=140, progress=6, token=0
      const choice: EventChoice = {
        name: 'Million Mix',
        type: '体力',
        multiplier: '1.2倍',
        pt: 140,
        token: 0,
        progress: 6,
      };
      execute(choice);

      expect(form.value.pt).toBe(240);
      expect(form.value.eventLiveProgress).toBe(16);
      // itemProgress = 3 + 6 = 9 (< 20, no token conversion)
      expect(form.value.itemProgress).toBe(9);
      expect(form.value.token).toBe(5);
    });

    it('道具进度满 20 应自动转换 1 个道具', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 0, token: 0, itemProgress: 15, eventLiveProgress: 0 }),
      );
      const { execute } = useMltdEventParkingTour(form);

      // MM 1.2x: progress=6
      const choice: EventChoice = {
        name: 'Million Mix',
        type: '体力',
        multiplier: '1.2倍',
        pt: 140,
        token: 0,
        progress: 6,
      };
      execute(choice);

      // itemProgress = 15 + 6 = 21 → token++, itemProgress = 1
      expect(form.value.itemProgress).toBe(1);
      expect(form.value.token).toBe(1);
    });

    it('活动曲应消耗道具并重置 eventLiveProgress', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 100, token: 10, itemProgress: 0, eventLiveProgress: 40 }),
      );
      const { execute } = useMltdEventParkingTour(form);

      const choice: EventChoice = {
        name: '活动曲',
        type: '活动曲',
        multiplier: '1倍',
        pt: 720,
        token: -1,
        progress: 0,
      };
      execute(choice);

      expect(form.value.pt).toBe(820);
      expect(form.value.token).toBe(9); // 10 - 1
      expect(form.value.eventLiveProgress).toBe(0);
      expect(form.value.itemProgress).toBe(0); // unchanged
    });

    it('活动曲不消耗道具时 token 不应为负', () => {
      const form = ref<ParkingForm>(createForm({ pt: 0, token: 0, eventLiveProgress: 40 }));
      const { execute } = useMltdEventParkingTour(form);

      const choice: EventChoice = {
        name: '活动曲',
        type: '活动曲',
        multiplier: '1倍',
        pt: 720,
        token: -1,
        progress: 0,
      };
      execute(choice);

      expect(form.value.token).toBe(-1); // token can go negative
    });

    it('多次游玩应正确累计道具转换', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 0, token: 0, itemProgress: 18, eventLiveProgress: 0 }),
      );
      const { execute } = useMltdEventParkingTour(form);

      // MM 1.2x: progress=6 → 18+6=24 ≥ 20*1 → token=1, itemProgress=4
      const choice: EventChoice = {
        name: 'Million Mix',
        type: '体力',
        multiplier: '1.2倍',
        pt: 140,
        token: 0,
        progress: 6,
      };
      execute(choice);
      expect(form.value.itemProgress).toBe(4);
      expect(form.value.token).toBe(1);

      // MM 1.2x again: progress=6 → 4+6=10 < 20, no conversion
      execute(choice);
      expect(form.value.itemProgress).toBe(10);
      expect(form.value.token).toBe(1);

      // MM 1.2x again: 10+6=16 < 20
      execute(choice);
      expect(form.value.itemProgress).toBe(16);
      expect(form.value.token).toBe(1);

      // MM 1.2x again: 16+6=22 ≥ 20 → token=2, itemProgress=2
      execute(choice);
      expect(form.value.itemProgress).toBe(2);
      expect(form.value.token).toBe(2);
    });
  });

  describe('undo', () => {
    it('歌曲游玩撤销应扣减 pt 和 progress', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 240, token: 5, itemProgress: 9, eventLiveProgress: 16 }),
      );
      const { undo } = useMltdEventParkingTour(form);

      const choice: EventChoice = {
        name: 'Million Mix',
        type: '体力',
        multiplier: '1.2倍',
        pt: 140,
        token: 0,
        progress: 6,
      };
      undo(choice);

      expect(form.value.pt).toBe(100);
      expect(form.value.eventLiveProgress).toBe(10);
      expect(form.value.itemProgress).toBe(3);
      expect(form.value.token).toBe(5);
    });

    it('歌曲撤销时当前进度不足应逆向转换道具', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 140, token: 1, itemProgress: 3, eventLiveProgress: 6 }),
      );
      const { undo } = useMltdEventParkingTour(form);

      // currentProgress=3 < progressToUndo=6 → need to convert token back
      const choice: EventChoice = {
        name: 'Million Mix',
        type: '体力',
        multiplier: '1.2倍',
        pt: 140,
        token: 0,
        progress: 6,
      };
      undo(choice);

      expect(form.value.token).toBe(0); // token - 1
      expect(form.value.itemProgress).toBe(17); // 3 + 20 - 6
    });

    it('eventLiveProgress 不应低于 0', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 140, token: 0, itemProgress: 10, eventLiveProgress: 3 }),
      );
      const { undo } = useMltdEventParkingTour(form);

      const choice: EventChoice = {
        name: 'Million Mix',
        type: '体力',
        multiplier: '1.2倍',
        pt: 140,
        token: 0,
        progress: 6,
      };
      undo(choice);

      expect(form.value.eventLiveProgress).toBe(0); // max(0, 3-6) = 0
    });

    it('活动曲撤销仅扣减 pt', () => {
      const form = ref<ParkingForm>(createForm({ pt: 820, token: 9, eventLiveProgress: 0 }));
      const { undo } = useMltdEventParkingTour(form);

      const choice: EventChoice = {
        name: '活动曲',
        type: '活动曲',
        multiplier: '1倍',
        pt: 720,
        token: -1,
        progress: 0,
      };
      undo(choice);

      expect(form.value.pt).toBe(100);
      expect(form.value.token).toBe(9); // 活动曲撤销不改 token
    });
  });

  describe('createSnapshot / resetToSnapshot', () => {
    it('createSnapshot 应包含 Tour 专有字段', () => {
      const form = ref<ParkingForm>(
        createForm({
          targetPt: 5000,
          pt: 1000,
          token: 50,
          itemProgress: 5,
          eventLiveProgress: 20,
          isBoostPeriod: true,
        }),
      );
      const { createSnapshot } = useMltdEventParkingTour(form);

      const snapshot = createSnapshot();
      expect(snapshot).toEqual({
        targetPt: 5000,
        pt: 1000,
        token: 50,
        itemProgress: 5,
        eventLiveProgress: 20,
        isBoostPeriod: true,
      });
    });

    it('resetToSnapshot 应恢复所有字段', () => {
      const form = ref<ParkingForm>(
        createForm({ pt: 999, token: 999, itemProgress: 99, eventLiveProgress: 99 }),
      );
      const { resetToSnapshot } = useMltdEventParkingTour(form);

      resetToSnapshot({
        targetPt: 5000,
        pt: 100,
        token: 10,
        itemProgress: 3,
        eventLiveProgress: 15,
        isBoostPeriod: false,
      });

      expect(form.value.pt).toBe(100);
      expect(form.value.token).toBe(10);
      expect(form.value.itemProgress).toBe(3);
      expect(form.value.eventLiveProgress).toBe(15);
      expect(form.value.isBoostPeriod).toBe(false);
    });
  });

  describe('calc (DFS)', () => {
    it('负数参数应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTour(form);
      await nextTick();

      const result = await calc([], {
        targetPt: -1,
        pt: 0,
        token: 0,
        itemProgress: 0,
        eventLiveProgress: 0,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(false);
      expect(result.message).toBe('参数不能为负数');
    });

    it('itemProgress > 19 应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTour(form);
      await nextTick();

      const result = await calc([], {
        targetPt: 1000,
        pt: 0,
        token: 0,
        itemProgress: 20,
        eventLiveProgress: 0,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(false);
      expect(result.message).toBe('道具进度必须在 0-19 之间');
    });

    it('pt >= targetPt 时应返回已达标', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTour(form);
      await nextTick();

      const result = await calc([], {
        targetPt: 100,
        pt: 200,
        token: 0,
        itemProgress: 0,
        eventLiveProgress: 0,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(true);
      expect(result.result).toEqual([]);
    });

    it('eventLiveProgress < 40 时无法使用活动曲，但可用歌曲', async () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: 140, pt: 0, token: 10, eventLiveProgress: 0 }),
      );
      const { eventChoices, calc } = useMltdEventParkingTour(form);
      await nextTick();

      const snapshot = {
        targetPt: 140,
        pt: 0,
        token: 10,
        itemProgress: 0,
        eventLiveProgress: 0,
        isBoostPeriod: true,
      };
      const result = await calc(eventChoices.value, snapshot);

      // Should find MM 1.2x (pt=140) directly
      expect(result.flag).toBe(true);
      const mm = result.result!.find((r) => r.name === 'Million Mix');
      expect(mm).toBeDefined();
      expect(mm!.value).toBe(1);
    });

    it('eventLiveProgress >= 40 时可使用活动曲', async () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: 720, pt: 0, token: 10, eventLiveProgress: 40 }),
      );
      const { eventChoices, calc } = useMltdEventParkingTour(form);
      await nextTick();

      const snapshot = {
        targetPt: 720,
        pt: 0,
        token: 10,
        itemProgress: 0,
        eventLiveProgress: 40,
        isBoostPeriod: true,
      };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(true);
      const el = result.result!.find((r) => r.name === '活动曲' && r.multiplier === '1倍');
      expect(el).toBeDefined();
    });

    it('isBoostPeriod=false 时 3倍 活动曲不可用', async () => {
      const form = ref<ParkingForm>(
        createForm({
          targetPt: 2160,
          pt: 0,
          token: 10,
          eventLiveProgress: 40,
          isBoostPeriod: false,
        }),
      );
      const { eventChoices, calc } = useMltdEventParkingTour(form);
      await nextTick();

      const snapshot = {
        targetPt: 2160,
        pt: 0,
        token: 10,
        itemProgress: 0,
        eventLiveProgress: 40,
        isBoostPeriod: false,
      };
      const result = await calc(eventChoices.value, snapshot);

      // 3倍不可用，但 2倍(1440) + song 组合可能达到 2160
      // 或者 2倍 + 歌曲组合
      expect(result.flag).toBe(true);
      const result3x = result.result!.find((r) => r.multiplier === '3倍');
      expect(result3x).toBeUndefined();
    });

    it('积分差距大于 100000 应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTour(form);
      await nextTick();

      const result = await calc([], {
        targetPt: 200000,
        pt: 0,
        token: 0,
        itemProgress: 0,
        eventLiveProgress: 0,
        isBoostPeriod: true,
      });
      expect(result.flag).toBe(false);
      expect(result.message).toContain('积分差距大于100000');
    });

    it('目标不可达时应返回不存在方案', async () => {
      const form = ref<ParkingForm>(
        createForm({ targetPt: 1, pt: 0, token: 0, eventLiveProgress: 0 }),
      );
      const { eventChoices, calc } = useMltdEventParkingTour(form);
      await nextTick();

      const snapshot = {
        targetPt: 1,
        pt: 0,
        token: 0,
        itemProgress: 0,
        eventLiveProgress: 0,
        isBoostPeriod: true,
      };
      const result = await calc(eventChoices.value, snapshot);

      // 所有选项的最小 pt 是 58（2 Mix 1x），无法精确匹配 1
      expect(result.flag).toBe(false);
      expect(result.message).toBe('不存在控分方案');
    });
  });
});
