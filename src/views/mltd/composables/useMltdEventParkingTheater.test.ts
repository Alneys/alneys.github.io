import { ref, nextTick } from 'vue';

import { describe, it, expect } from 'vitest';

import type { ParkingForm, EventChoice } from '../MltdTypes';
import { useMltdEventParkingTheater } from './useMltdEventParkingTheater';

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

describe('useMltdEventParkingTheater', () => {
  describe('eventChoices', () => {
    it('theater 类型应包含活动曲、体力和打工票选项', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'theater' }));
      const { eventChoices } = useMltdEventParkingTheater(form);
      await nextTick();

      expect(eventChoices.value.length).toBeGreaterThan(0);
      const types = new Set(eventChoices.value.map((c) => c.type));
      expect(types.has('活动曲')).toBe(true);
      expect(types.has('体力')).toBe(true);
      expect(types.has('打工票')).toBe(true);
    });

    it('anniversary 类型应包含推荐曲', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'anniversary' }));
      const { eventChoices } = useMltdEventParkingTheater(form);
      await nextTick();

      const names = eventChoices.value.map((c) => c.name);
      expect(names.some((n) => n.includes('推荐曲'))).toBe(true);
    });

    it('trust 类型应正确应用 1.5 倍加成', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'trust' }));
      const { eventChoices } = useMltdEventParkingTheater(form);
      await nextTick();

      const songChoices = eventChoices.value.filter((c) => c.type === '体力');
      // MM 通常曲: ceil(85 * 1.5) = ceil(127.5) = 128
      const mm = songChoices.find((c) => c.name === 'MM 通常曲');
      expect(mm?.pt).toBe(128);
      // token = 85 (不受 1.5 倍影响)
      expect(mm?.token).toBe(85);
    });

    it('tune 类型应包含 Million Mix 等歌曲', async () => {
      const form = ref<ParkingForm>(
        createForm({ eventType: 'tune', bonus: 30, isBoostPeriod: true }),
      );
      const { eventChoices } = useMltdEventParkingTheater(form);
      await nextTick();

      expect(eventChoices.value.some((c) => c.name === 'Million Mix')).toBe(true);
      expect(eventChoices.value.some((c) => c.name === '6 Mix')).toBe(true);
    });

    it('tune 活动曲积分应正确应用 bonus', async () => {
      const form = ref<ParkingForm>(
        createForm({ eventType: 'tune', bonus: 30, isBoostPeriod: true }),
      );
      const { eventChoices } = useMltdEventParkingTheater(form);
      await nextTick();

      const eventLive = eventChoices.value.find(
        (c) => c.type === '活动曲' && c.multiplier === '1倍',
      );
      // ceil(490 * 1 * (100 + 30) / 100) = ceil(490 * 1.3) = ceil(637) = 637
      expect(eventLive?.pt).toBe(637);
      expect(eventLive?.token).toBe(-140);
    });

    it('isBoostPeriod=false 时 theater 无 2倍/4倍 活动曲', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'theater', isBoostPeriod: false }));
      const { eventChoices } = useMltdEventParkingTheater(form);
      await nextTick();

      const eventLives = eventChoices.value.filter((c) => c.type === '活动曲');
      expect(eventLives.length).toBe(1); // 只有 1倍
      expect(eventLives[0]?.multiplier).toBe('1倍');
    });

    it('isBoostPeriod=true 时 theater 有 1倍/2倍/4倍 活动曲', async () => {
      const form = ref<ParkingForm>(createForm({ eventType: 'theater', isBoostPeriod: true }));
      const { eventChoices } = useMltdEventParkingTheater(form);
      await nextTick();

      const eventLives = eventChoices.value.filter((c) => c.type === '活动曲');
      expect(eventLives.length).toBe(3);
      const multipliers = eventLives.map((c) => c.multiplier).sort();
      expect(multipliers).toEqual(['1倍', '2倍', '4倍']);
    });
  });

  describe('execute / undo', () => {
    it('execute 应累加 pt 和 token', () => {
      const form = ref<ParkingForm>(createForm({ pt: 100, token: 50 }));
      const { execute } = useMltdEventParkingTheater(form);

      const choice: EventChoice = {
        name: 'test',
        type: '体力',
        multiplier: '1倍',
        pt: 85,
        token: 85,
      };
      execute(choice);

      expect(form.value.pt).toBe(185);
      expect(form.value.token).toBe(135);
    });

    it('undo 应扣减 pt 和 token', () => {
      const form = ref<ParkingForm>(createForm({ pt: 200, token: 150 }));
      const { undo } = useMltdEventParkingTheater(form);

      const choice: EventChoice = {
        name: 'test',
        type: '体力',
        multiplier: '1倍',
        pt: 85,
        token: 85,
      };
      undo(choice);

      expect(form.value.pt).toBe(115);
      expect(form.value.token).toBe(65);
    });

    it('活动曲的 undo 应正确扣减 token（负值）', () => {
      const form = ref<ParkingForm>(createForm({ pt: 634, token: 500 }));
      const { undo } = useMltdEventParkingTheater(form);

      const choice: EventChoice = {
        name: '活动曲',
        type: '活动曲',
        multiplier: '1倍',
        pt: 634,
        token: -180,
      };
      undo(choice);

      expect(form.value.pt).toBe(0);
      expect(form.value.token).toBe(680); // 500 - (-180) = 680
    });

    it('execute 当 pt/token 为 undefined 时应处理为 0', () => {
      const form = ref<ParkingForm>(createForm({ pt: undefined, token: undefined }));
      const { execute } = useMltdEventParkingTheater(form);

      const choice: EventChoice = {
        name: 'test',
        type: '体力',
        multiplier: '1倍',
        pt: 85,
        token: 85,
      };
      execute(choice);

      expect(form.value.pt).toBe(85);
      expect(form.value.token).toBe(85);
    });
  });

  describe('createSnapshot / resetToSnapshot', () => {
    it('createSnapshot 应返回正确的快照字段', () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 5000, pt: 1000, token: 200 }));
      const { createSnapshot } = useMltdEventParkingTheater(form);

      const snapshot = createSnapshot();
      expect(snapshot).toEqual({ targetPt: 5000, pt: 1000, token: 200 });
    });

    it('resetToSnapshot 应恢复 pt 和 token', () => {
      const form = ref<ParkingForm>(createForm({ pt: 9999, token: 9999 }));
      const { resetToSnapshot } = useMltdEventParkingTheater(form);

      resetToSnapshot({ targetPt: 5000, pt: 100, token: 50 });
      expect(form.value.pt).toBe(100);
      expect(form.value.token).toBe(50);
    });
  });

  describe('calc (DFS)', () => {
    it('pt >= targetPt 时应返回已达标（空结果）', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 100, pt: 200, token: 0 }));
      const { calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const result = await calc([], { targetPt: 100, pt: 200, token: 0 });
      expect(result.flag).toBe(true);
      expect(result.result).toEqual([]);
    });

    it('负数参数应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const result = await calc([], { targetPt: -1, pt: 0, token: 0 });
      expect(result.flag).toBe(false);
      expect(result.message).toBe('参数不能为负数');
    });

    it('积分差距大于 100000 应返回错误', async () => {
      const form = ref<ParkingForm>(createForm());
      const { calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const result = await calc([], { targetPt: 200000, pt: 0, token: 0 });
      expect(result.flag).toBe(false);
      expect(result.message).toContain('积分差距大于100000');
    });

    it('应找到精确匹配的解', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 85, pt: 0, token: 1000 }));
      const { eventChoices, calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const snapshot = { targetPt: 85, pt: 0, token: 1000 };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.length).toBeGreaterThan(0);
      // 应找到 MM 通常曲（pt=85，体力 1倍）
      const mm = result.result!.find((r) => r.name === 'MM 通常曲');
      expect(mm).toBeDefined();
      expect(mm!.value).toBe(1);
    });

    it('目标不可达时应返回不存在方案', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 1, pt: 0, token: 1000 }));
      const { eventChoices, calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const snapshot = { targetPt: 1, pt: 0, token: 1000 };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(false);
      expect(result.message).toBe('不存在控分方案');
    });

    it('token 为 0 时无法使用活动曲，但仍可用体力选项', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 149, pt: 0, token: 0 }));
      const { eventChoices, calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const snapshot = { targetPt: 149, pt: 0, token: 0 };
      const result = await calc(eventChoices.value, snapshot);

      // 无法用活动曲（token=0 < 180），但可用 MM 85 + 6M 64 = 149
      expect(result.flag).toBe(true);
      expect(result.result).toBeDefined();
      const totalPt = result.result!.reduce(
        (sum, r) =>
          sum +
          r.value *
            (eventChoices.value.find((c) => c.name === r.name && c.multiplier === r.multiplier)
              ?.pt ?? 0),
        0,
      );
      expect(totalPt).toBe(149);
    });

    it('活动曲（token < 0）应在排序中优先于普通曲', async () => {
      const form = ref<ParkingForm>(createForm({ targetPt: 719, pt: 0, token: 1000 }));
      const { eventChoices, calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const snapshot = { targetPt: 719, pt: 0, token: 1000 };
      const result = await calc(eventChoices.value, snapshot);

      expect(result.flag).toBe(true);
    });

    it('trust 活动应正确包含 1倍/2倍/4倍 活动曲', async () => {
      const form = ref<ParkingForm>(
        createForm({ eventType: 'trust', targetPt: 3708, pt: 0, token: 1000, isBoostPeriod: true }),
      );
      const { eventChoices, calc } = useMltdEventParkingTheater(form);
      await nextTick();

      const eventLives = eventChoices.value.filter((c) => c.type === '活动曲');
      expect(eventLives.some((c) => c.multiplier === '4倍')).toBe(true);

      const snapshot = { targetPt: 3708, pt: 0, token: 1000 };
      const result = await calc(eventChoices.value, snapshot);
      expect(result.flag).toBe(true);
    });
  });
});
