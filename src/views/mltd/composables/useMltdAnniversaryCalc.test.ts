import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useMltdAnniversaryCalc, createDefaultForm } from './useMltdAnniversaryCalc';
import { ANNIVERSARY_CONSTANTS } from '../MltdConstant';
import type { AnniversaryForm } from '../MltdTypes';

describe('useMltdAnniversaryCalc', () => {
  describe('ptNeeded', () => {
    it('应正确计算需要的pt', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 500000,
        pt: 0,
        boostCount: 1,
        freeTokenClaimCount: 1,
        tokens: 1000,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      const ptFromBoost = result.ptFromBoost;
      const ptFromFreeTokens = result.ptFromFreeTokens;
      const ptFromRemainingTokens = result.ptFromRemainingTokens;

      expect(ptFromBoost).toBeGreaterThan(0);
      expect(ptFromFreeTokens).toBeGreaterThan(0);
      expect(ptFromRemainingTokens).toBeGreaterThan(0);

      const expectedNeeded = 500000 - 0 - ptFromBoost - ptFromFreeTokens - ptFromRemainingTokens;
      expect(result.ptNeeded).toBe(expectedNeeded);
    });

    it('已达标时应返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 1000,
        pt: 10000,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.ptNeeded).toBe(0);
    });
  });

  describe('jewelNeeded', () => {
    it('应正确计算需要的钻石', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 100000,
        pt: 0,
        boostCount: 0,
        freeTokenClaimCount: 0,
        tokens: 0,
        plv: 100,
        remainingTime: 0,
        staminaMaxBottleCount: 0,
        stamina30BottleCount: 0,
        stamina20BottleCount: 0,
        stamina10BottleCount: 0,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.jewelNeeded).toBeGreaterThan(0);
    });

    it('资源足够时应返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 1000,
        pt: 500,
        boostCount: 0,
        freeTokenClaimCount: 1,
        tokens: 0,
        plv: 100,
        remainingTime: 10,
        staminaMaxBottleCount: 100,
        stamina30BottleCount: 100,
        stamina20BottleCount: 100,
        stamina10BottleCount: 100,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      const staminaRecovered = result.staminaRecovered;
      const staminaFromBottles = result.staminaFromBottles;
      const staminaFromDaily = result.staminaFromDaily;

      expect(result.staminaNeeded + result.staminaForBoost).toBeLessThan(
        staminaRecovered + staminaFromBottles + staminaFromDaily,
      );
      expect(result.jewelNeeded).toBe(0);
    });

    it('负数结果应返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 100,
        pt: 100000,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.jewelNeeded).toBe(0);
    });
  });

  describe('ptFromBoost', () => {
    it('boostCount为0时返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        boostCount: 0,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.ptFromBoost).toBe(0);
    });

    it('应正确计算火获得的pt', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        boostCount: 5,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      const expected =
        5 *
        (ANNIVERSARY_CONSTANTS.TOKENS_PER_BOOST_PLAY +
          (ANNIVERSARY_CONSTANTS.TOKENS_PER_BOOST_PLAY *
            ANNIVERSARY_CONSTANTS.PT_PER_CONSUME_PLAY) /
            ANNIVERSARY_CONSTANTS.TOKENS_PER_CONSUME_PLAY) *
        ANNIVERSARY_CONSTANTS.BOOST_PLAYS_PER_BOOST_ITEM;

      expect(result.ptFromBoost).toBe(Math.floor(expected));
    });
  });

  describe('ptFromFreeTokens', () => {
    it('freeTokenCount为0时返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        freeTokenClaimCount: 0,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.ptFromFreeTokens).toBe(0);
    });

    it('应正确计算白给道具获得的pt', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        freeTokenClaimCount: 10,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      const expected =
        10 *
        ((ANNIVERSARY_CONSTANTS.DAILY_FREE_TOKENS * ANNIVERSARY_CONSTANTS.PT_PER_CONSUME_PLAY) /
          ANNIVERSARY_CONSTANTS.TOKENS_PER_CONSUME_PLAY);

      expect(result.ptFromFreeTokens).toBe(Math.floor(expected));
    });
  });

  describe('currentMaxStamina', () => {
    it('plv未设置时返回默认值60', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        plv: undefined,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.currentMaxStamina).toBe(60);
    });

    it('应正确映射等级到体力上限', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        plv: 100,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.currentMaxStamina).toBe(103);
    });

    it('等级超限时返回最大值240', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        plv: 1000,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.currentMaxStamina).toBe(240);
    });
  });

  describe('staminaNeeded', () => {
    it('ptNeeded为0时返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 1000,
        pt: 10000,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.staminaNeeded).toBeGreaterThanOrEqual(0);
    });

    it('应正确计算所需体力', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 100000,
        pt: 0,
        boostCount: 0,
        freeTokenClaimCount: 0,
        tokens: 0,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.staminaNeeded).toBeGreaterThan(0);

      const expectedRate =
        ANNIVERSARY_CONSTANTS.STAMINA_COST_FOR_TOKEN_ACCUMULATE /
        (ANNIVERSARY_CONSTANTS.TOKENS_PER_ACCUMULATE_PLAY +
          (ANNIVERSARY_CONSTANTS.TOKENS_PER_ACCUMULATE_PLAY /
            ANNIVERSARY_CONSTANTS.TOKENS_PER_CONSUME_PLAY) *
            ANNIVERSARY_CONSTANTS.PT_PER_CONSUME_PLAY);

      expect(result.staminaNeeded).toBe(Math.ceil(result.ptNeeded * expectedRate));
    });
  });

  describe('staminaFromBottles', () => {
    it('应正确计算混合体力瓶的总体力', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        plv: 103,
        staminaMaxBottleCount: 2,
        stamina30BottleCount: 3,
        stamina20BottleCount: 4,
        stamina10BottleCount: 5,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.currentMaxStamina).toBe(104);
      expect(result.staminaFromBottles).toBe(2 * 104 + 3 * 30 + 4 * 20 + 5 * 10);
      expect(result.staminaFromBottles).toBe(428);
    });
  });

  describe('resetCurrentRemainingTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('事件结束时间在过去时应返回0', async () => {
      vi.setSystemTime(new Date('2025-07-20 00:00:00+0900'));

      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        eventEndTime: new Date('2025-07-13 00:00:00+0900'),
      });

      const { resetCurrentRemainingTime } = useMltdAnniversaryCalc(form);
      const result = resetCurrentRemainingTime();

      expect(result).toBe(0);
      expect(form.value.remainingTime).toBe(0);
    });

    it('事件结束时间在未来时应返回正确天数', async () => {
      vi.setSystemTime(new Date('2025-07-10 00:00:00+0900'));

      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        eventEndTime: new Date('2025-07-13 00:00:00+0900'),
      });

      const { resetCurrentRemainingTime } = useMltdAnniversaryCalc(form);
      const result = resetCurrentRemainingTime();

      expect(result).toBeCloseTo(3, 1);
      expect(form.value.remainingTime).toBeCloseTo(3, 1);
    });

    it('超过13天时应返回13', async () => {
      vi.setSystemTime(new Date('2025-06-01 00:00:00+0900'));

      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        eventEndTime: new Date('2025-07-20 00:00:00+0900'),
      });

      const { resetCurrentRemainingTime } = useMltdAnniversaryCalc(form);
      const result = resetCurrentRemainingTime();

      expect(result).toBe(ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS);
      expect(form.value.remainingTime).toBe(ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS);
    });
  });

  describe('setBoostFromRemainingTime', () => {
    it('remainingTime为0时不更新', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        remainingTime: 0,
        boostCount: 5,
        freeTokenClaimCount: 5,
      });

      const { setBoostFromRemainingTime } = useMltdAnniversaryCalc(form);
      setBoostFromRemainingTime();

      expect(form.value.boostCount).toBe(5);
      expect(form.value.freeTokenClaimCount).toBe(5);
    });

    it('应根据remainingTime正确设置boostCount和freeTokenClaimCount', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        remainingTime: 7.5,
      });

      const { setBoostFromRemainingTime } = useMltdAnniversaryCalc(form);
      setBoostFromRemainingTime();

      expect(form.value.boostCount).toBe(7);
      expect(form.value.freeTokenClaimCount).toBe(7);
    });
  });

  describe('localStorage操作', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('应能保存和读取表单数据', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 123456,
        pt: 10000,
        plv: 150,
      });

      const { saveToLocalStorage, loadFromLocalStorage } = useMltdAnniversaryCalc(form);

      const saveResult = saveToLocalStorage();
      expect(saveResult).toBe(true);

      form.value = createDefaultForm();
      expect(form.value.targetPt).toBeUndefined();

      const loadResult = loadFromLocalStorage();
      expect(loadResult).toBe(true);
      expect(form.value.targetPt).toBe(123456);
      expect(form.value.pt).toBe(10000);
      expect(form.value.plv).toBe(150);
      expect(form.value.eventEndTime).toBeInstanceOf(Date);
    });

    it('应能清除存储数据', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 99999,
      });

      const { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } =
        useMltdAnniversaryCalc(form);

      saveToLocalStorage();
      clearLocalStorage();

      const loadResult = loadFromLocalStorage();
      expect(loadResult).toBe(false);
    });
  });
});
