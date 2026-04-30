import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useMltdAnniversaryCalc, createDefaultForm } from './useMltdAnniversaryCalc';
import { MLTD_ANNIVERSARY_CONSTANTS as MLTD } from '../data/MltdAnniversaryConstant';
import type { AnniversaryForm } from '../MltdTypes';

describe('calculateOptimalBoostAllocation', () => {
  describe('钻石最小化优化', () => {
    it('目标pt=594858时应找到最小钻石消耗的火分配方案', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 594858,
        pt: 0,
        plv: 1,
        boostCount: 13,
        freeTokenClaimCount: 13,
        tokens: 0,
        remainingTime: 13,
        staminaMaxBottleCount: 0,
        stamina30BottleCount: 0,
        stamina20BottleCount: 0,
        stamina10BottleCount: 0,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.optimalTotalBoostAccumulatePlays).toBe(22);
      expect(result.optimalBoostConsumePlays).toBe(108);
      expect(result.jewelNeeded).toBeLessThanOrEqual(1000);
      expect(result.ptTotalFromOperations).toBeGreaterThanOrEqual(594858);
    });

    it('目标pt=594859时应找到最小钻石消耗的火分配方案', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 594859,
        pt: 0,
        plv: 1,
        boostCount: 13,
        freeTokenClaimCount: 13,
        tokens: 0,
        remainingTime: 13,
        staminaMaxBottleCount: 0,
        stamina30BottleCount: 0,
        stamina20BottleCount: 0,
        stamina10BottleCount: 0,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.optimalTotalBoostAccumulatePlays).toBe(22);
      expect(result.optimalBoostConsumePlays).toBe(108);
      expect(result.jewelNeeded).toBeLessThanOrEqual(1000);
      expect(result.ptTotalFromOperations).toBeGreaterThanOrEqual(594859);
    });

    it('手动设置火攒22次火清108次时应满足目标594858', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 594858,
        pt: 0,
        plv: 1,
        boostCount: 13,
        freeTokenClaimCount: 13,
        tokens: 0,
        remainingTime: 13,
        staminaMaxBottleCount: 0,
        stamina30BottleCount: 0,
        stamina20BottleCount: 0,
        stamina10BottleCount: 0,
        useAutoOptimize: false,
        userTotalBoostAccumulatePlays: 22,
        userBoostConsumePlays: 108,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.totalBoostAccumulatePlays).toBe(22);
      expect(result.boostConsumePlays).toBe(108);
      expect(result.ptTotalFromOperations).toBeGreaterThanOrEqual(594858);
    });

    it('自动优化结果不应比手动设置更差', async () => {
      const formAuto = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 594858,
        pt: 0,
        plv: 1,
        boostCount: 13,
        freeTokenClaimCount: 13,
        tokens: 0,
        remainingTime: 13,
        staminaMaxBottleCount: 0,
        stamina30BottleCount: 0,
        stamina20BottleCount: 0,
        stamina10BottleCount: 0,
      });

      const formManual = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 594858,
        pt: 0,
        plv: 1,
        boostCount: 13,
        freeTokenClaimCount: 13,
        tokens: 0,
        remainingTime: 13,
        staminaMaxBottleCount: 0,
        stamina30BottleCount: 0,
        stamina20BottleCount: 0,
        stamina10BottleCount: 0,
        useAutoOptimize: false,
        userTotalBoostAccumulatePlays: 22,
        userBoostConsumePlays: 108,
      });

      const { result: autoResult } = useMltdAnniversaryCalc(formAuto);
      const { result: manualResult } = useMltdAnniversaryCalc(formManual);
      await nextTick();

      expect(autoResult.jewelNeeded).toBeLessThanOrEqual(manualResult.jewelNeeded);
      expect(autoResult.ptTotalFromOperations).toBeGreaterThanOrEqual(594858);
    });

    it('目标pt相差1时不应导致钻石消耗大幅增加', async () => {
      const form1 = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 594858,
        pt: 0,
        plv: 1,
        boostCount: 13,
        freeTokenClaimCount: 13,
        tokens: 0,
        remainingTime: 13,
      });

      const form2 = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 594859,
        pt: 0,
        plv: 1,
        boostCount: 13,
        freeTokenClaimCount: 13,
        tokens: 0,
        remainingTime: 13,
      });

      const { result: result1 } = useMltdAnniversaryCalc(form1);
      const { result: result2 } = useMltdAnniversaryCalc(form2);
      await nextTick();

      expect(result1.optimalTotalBoostAccumulatePlays).toBe(
        result2.optimalTotalBoostAccumulatePlays,
      );
      expect(result1.optimalBoostConsumePlays).toBe(result2.optimalBoostConsumePlays);
      expect(Math.abs(result1.jewelNeeded - result2.jewelNeeded)).toBeLessThanOrEqual(50);
    });
  });
});

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

      const ptFromBoostAccumulate = result.ptFromBoostAccumulate;
      const ptTotalFromOperations = result.ptTotalFromOperations;

      expect(ptFromBoostAccumulate).toBeGreaterThanOrEqual(0);
      expect(ptTotalFromOperations).toBeGreaterThanOrEqual(0);

      const expectedNeeded = 500000 - 0 - ptTotalFromOperations;
      expect(result.ptNeeded).toBe(expectedNeeded > 0 ? expectedNeeded : 0);
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

      expect(result.totalStaminaNeeded).toBeLessThan(
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

  describe('ptFromBoostAccumulate', () => {
    it('boostCount为0时返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        boostCount: 0,
        freeTokenClaimCount: 0,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.ptFromBoostAccumulate).toBe(0);
    });

    it('应正确计算火攒道具直接获得的pt', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        boostCount: 5,
        freeTokenClaimCount: 0,
        targetPt: 1000000,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.optimalTotalBoostAccumulatePlays).toBeGreaterThanOrEqual(0);
      expect(result.optimalTotalBoostAccumulatePlays).toBeLessThanOrEqual(50);
      expect(result.ptFromBoostAccumulate).toBe(
        result.optimalTotalBoostAccumulatePlays * MLTD.ptPerBoostAccumulatePlay,
      );
    });
  });

  describe('tokensFromFixedSources', () => {
    it('应正确计算固定来源道具总和', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        freeTokenClaimCount: 10,
        tokens: 1000,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      const expected =
        1000 + 10 * MLTD.dailyLoginTokens + 10 * MLTD.dailyRecommendedSongsBonusTokens;
      expect(result.tokensFromFixedSources).toBe(expected);
    });
  });

  describe('normalConsumePlays', () => {
    it('应正确计算清道具次数（基于总道具数）', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 0,
        pt: 100000,
        boostCount: 0,
        freeTokenClaimCount: 0,
        tokens: 7200,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.totalConsumePlays).toBe(Math.floor(7200 / MLTD.tokensPerConsumePlay));
      expect(result.normalConsumePlays).toBe(Math.floor(7200 / MLTD.tokensPerConsumePlay));
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

  describe('totalStaminaNeeded', () => {
    it('ptNeeded为0时返回0', async () => {
      const form = ref<AnniversaryForm>({
        ...createDefaultForm(),
        targetPt: 1000,
        pt: 10000,
        freeTokenClaimCount: 1,
      });

      const { result } = useMltdAnniversaryCalc(form);
      await nextTick();

      expect(result.totalStaminaNeeded).toBe(0);
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

      expect(result.totalStaminaNeeded).toBeGreaterThan(0);
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

      expect(result).toBe(MLTD.eventTotalDays);
      expect(form.value.remainingTime).toBe(MLTD.eventTotalDays);
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

  describe('空字符串处理 (v-model.number 清空输入框)', () => {
    describe('边缘情况 - 空字符串与 0 结果一致性', () => {
      const createBaseForm = (): AnniversaryForm => ({
        ...createDefaultForm(),
        targetPt: 100000,
        pt: 50000,
        tokens: 1000,
        boostCount: 5,
        freeTokenClaimCount: 5,
        plv: 100,
        remainingTime: 5,
        staminaMaxBottleCount: 10,
        stamina30BottleCount: 5,
        stamina20BottleCount: 3,
        stamina10BottleCount: 2,
        tokenAccumulateTime: 6.5,
        tokenConsumeTime: 3,
      });

      describe('道具相关', () => {
        it('freeTokenClaimCount 为空字符串时道具相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            freeTokenClaimCount: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            freeTokenClaimCount: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.tokensFromLogin).toBe(rZero.tokensFromLogin);
          expect(rEmpty.tokensFromRecommendedBonus).toBe(rZero.tokensFromRecommendedBonus);
          expect(rEmpty.tokensFromFixedSources).toBe(rZero.tokensFromFixedSources);
          expect(rEmpty.tokensAvailableBeforeBoostAllocation).toBe(
            rZero.tokensAvailableBeforeBoostAllocation,
          );
          expect(rEmpty.tokensFromBoostAccumulate).toBe(rZero.tokensFromBoostAccumulate);
          expect(rEmpty.tokensConsumedByBoost).toBe(rZero.tokensConsumedByBoost);
          expect(rEmpty.totalTokensAllSources).toBe(rZero.totalTokensAllSources);
          expect(rEmpty.finalTokensRemaining).toBe(rZero.finalTokensRemaining);
        });

        it('tokens 为空字符串时道具相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            tokens: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            tokens: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.tokensFromRemaining).toBe(rZero.tokensFromRemaining);
          expect(rEmpty.tokensFromFixedSources).toBe(rZero.tokensFromFixedSources);
          expect(rEmpty.tokensAvailableBeforeBoostAllocation).toBe(
            rZero.tokensAvailableBeforeBoostAllocation,
          );
          expect(rEmpty.totalTokensAllSources).toBe(rZero.totalTokensAllSources);
          expect(rEmpty.finalTokensRemaining).toBe(rZero.finalTokensRemaining);
        });
      });

      describe('PT相关', () => {
        it('targetPt 为空字符串时PT相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            targetPt: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            targetPt: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.ptStillNeeded).toBe(rZero.ptStillNeeded);
          expect(rEmpty.ptNeeded).toBe(rZero.ptNeeded);
          expect(rEmpty.ptExceeded).toBe(rZero.ptExceeded);
          expect(rEmpty.ptTotalFromOperations).toBe(rZero.ptTotalFromOperations);
        });

        it('pt 为空字符串时PT相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            pt: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            pt: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.ptStillNeeded).toBe(rZero.ptStillNeeded);
          expect(rEmpty.ptNeeded).toBe(rZero.ptNeeded);
          expect(rEmpty.ptExceeded).toBe(rZero.ptExceeded);
          expect(rEmpty.ptTotalFromOperations).toBe(rZero.ptTotalFromOperations);
        });
      });

      describe('体力相关', () => {
        it('plv 为空字符串时体力相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            plv: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            plv: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.currentMaxStamina).toBe(rZero.currentMaxStamina);
          expect(rEmpty.staminaFromBottles).toBe(rZero.staminaFromBottles);
          expect(rEmpty.staminaFromDaily).toBe(rZero.staminaFromDaily);
          expect(rEmpty.extraStaminaNeeded).toBe(rZero.extraStaminaNeeded);
          expect(rEmpty.fullStaminaRecoveriesNeeded).toBe(rZero.fullStaminaRecoveriesNeeded);
          expect(rEmpty.jewelNeeded).toBe(rZero.jewelNeeded);
        });

        it('remainingTime 为空字符串时体力相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            remainingTime: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            remainingTime: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.staminaRecovered).toBe(rZero.staminaRecovered);
          expect(rEmpty.extraStaminaNeeded).toBe(rZero.extraStaminaNeeded);
          expect(rEmpty.fullStaminaRecoveriesNeeded).toBe(rZero.fullStaminaRecoveriesNeeded);
          expect(rEmpty.jewelNeeded).toBe(rZero.jewelNeeded);
        });

        it('体力瓶字段为空字符串时体力相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            staminaMaxBottleCount: '' as unknown as number,
            stamina30BottleCount: '' as unknown as number,
            stamina20BottleCount: '' as unknown as number,
            stamina10BottleCount: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            staminaMaxBottleCount: 0,
            stamina30BottleCount: 0,
            stamina20BottleCount: 0,
            stamina10BottleCount: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.staminaFromBottles).toBe(rZero.staminaFromBottles);
          expect(rEmpty.extraStaminaNeeded).toBe(rZero.extraStaminaNeeded);
          expect(rEmpty.fullStaminaRecoveriesNeeded).toBe(rZero.fullStaminaRecoveriesNeeded);
          expect(rEmpty.jewelNeeded).toBe(rZero.jewelNeeded);
        });

        it('部分体力瓶为空字符串时混合计算应与对照组相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            plv: 100,
            staminaMaxBottleCount: 2,
            stamina30BottleCount: '' as unknown as number,
            stamina20BottleCount: '' as unknown as number,
            stamina10BottleCount: 5,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            plv: 100,
            staminaMaxBottleCount: 2,
            stamina30BottleCount: 0,
            stamina20BottleCount: 0,
            stamina10BottleCount: 5,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.currentMaxStamina).toBe(rZero.currentMaxStamina);
          expect(rEmpty.staminaFromBottles).toBe(rZero.staminaFromBottles);
          expect(rEmpty.extraStaminaNeeded).toBe(rZero.extraStaminaNeeded);
          expect(rEmpty.fullStaminaRecoveriesNeeded).toBe(rZero.fullStaminaRecoveriesNeeded);
          expect(rEmpty.jewelNeeded).toBe(rZero.jewelNeeded);
        });
      });

      describe('次数相关', () => {
        it('boostCount 为空字符串时次数相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            boostCount: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            boostCount: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.totalBoostPlaysAvailable).toBe(rZero.totalBoostPlaysAvailable);
          expect(rEmpty.optimalTotalBoostAccumulatePlays).toBe(
            rZero.optimalTotalBoostAccumulatePlays,
          );
          expect(rEmpty.optimalBoostConsumePlays).toBe(rZero.optimalBoostConsumePlays);
          expect(rEmpty.optimalUnusedBoostPlays).toBe(rZero.optimalUnusedBoostPlays);
          expect(rEmpty.totalBoostAccumulatePlays).toBe(rZero.totalBoostAccumulatePlays);
          expect(rEmpty.boostConsumePlays).toBe(rZero.boostConsumePlays);
          expect(rEmpty.ptFromBoostAccumulate).toBe(rZero.ptFromBoostAccumulate);
          expect(rEmpty.ptFromBoostConsume).toBe(rZero.ptFromBoostConsume);
          expect(rEmpty.tokensFromBoostAccumulate).toBe(rZero.tokensFromBoostAccumulate);
          expect(rEmpty.tokensConsumedByBoost).toBe(rZero.tokensConsumedByBoost);
          expect(rEmpty.staminaForBoostAccumulate).toBe(rZero.staminaForBoostAccumulate);
          expect(rEmpty.boostPlays).toBe(rZero.boostPlays);
        });
      });

      describe('时间相关', () => {
        it('tokenAccumulateTime 为空字符串时时间相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            tokenAccumulateTime: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            tokenAccumulateTime: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.boostTimeSpent).toBe(rZero.boostTimeSpent);
          expect(rEmpty.normalAccumulateTimeSpent).toBe(rZero.normalAccumulateTimeSpent);
          expect(rEmpty.totalTokenAccumulateTimeSpent).toBe(rZero.totalTokenAccumulateTimeSpent);
          expect(rEmpty.totalTimeSpent).toBe(rZero.totalTimeSpent);
        });

        it('tokenConsumeTime 为空字符串时时间相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            tokenConsumeTime: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            tokenConsumeTime: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.boostConsumeTimeSpent).toBe(rZero.boostConsumeTimeSpent);
          expect(rEmpty.normalConsumeTimeSpent).toBe(rZero.normalConsumeTimeSpent);
          expect(rEmpty.totalConsumeTimeSpent).toBe(rZero.totalConsumeTimeSpent);
          expect(rEmpty.totalTimeSpent).toBe(rZero.totalTimeSpent);
        });
      });

      describe('钻石相关', () => {
        it('影响钻石的多个字段为空字符串时钻石相关属性应与 0 相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            plv: '' as unknown as number,
            remainingTime: '' as unknown as number,
            staminaMaxBottleCount: '' as unknown as number,
            stamina30BottleCount: '' as unknown as number,
            stamina20BottleCount: '' as unknown as number,
            stamina10BottleCount: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            plv: 0,
            remainingTime: 0,
            staminaMaxBottleCount: 0,
            stamina30BottleCount: 0,
            stamina20BottleCount: 0,
            stamina10BottleCount: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.jewelNeeded).toBe(rZero.jewelNeeded);
          expect(rEmpty.fullStaminaRecoveriesNeeded).toBe(rZero.fullStaminaRecoveriesNeeded);
        });
      });

      describe('布尔/状态', () => {
        it('布尔属性应返回正确的布尔值', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            targetPt: '' as unknown as number,
            pt: '' as unknown as number,
            boostCount: '' as unknown as number,
            freeTokenClaimCount: '' as unknown as number,
            tokens: '' as unknown as number,
            plv: '' as unknown as number,
            remainingTime: '' as unknown as number,
          });

          const { result } = useMltdAnniversaryCalc(formEmpty);
          await nextTick();

          expect(typeof result.useAutoOptimize).toBe('boolean');
          expect(typeof result.isBoostConsumeTokensInsufficient).toBe('boolean');
        });
      });

      describe('复合对象', () => {
        it('optimalBoostAllocation 子属性应与对照组相同', async () => {
          const formEmpty = ref<AnniversaryForm>({
            ...createBaseForm(),
            targetPt: '' as unknown as number,
            pt: '' as unknown as number,
            boostCount: '' as unknown as number,
            freeTokenClaimCount: '' as unknown as number,
            tokens: '' as unknown as number,
          });
          const formZero = ref<AnniversaryForm>({
            ...createBaseForm(),
            targetPt: 0,
            pt: 0,
            boostCount: 0,
            freeTokenClaimCount: 0,
            tokens: 0,
          });

          const { result: rEmpty } = useMltdAnniversaryCalc(formEmpty);
          const { result: rZero } = useMltdAnniversaryCalc(formZero);
          await nextTick();

          expect(rEmpty.optimalBoostAllocation.totalBoostAccumulate).toBe(
            rZero.optimalBoostAllocation.totalBoostAccumulate,
          );
          expect(rEmpty.optimalBoostAllocation.boostConsume).toBe(
            rZero.optimalBoostAllocation.boostConsume,
          );
          expect(rEmpty.optimalBoostAllocation.unusedBoostPlays).toBe(
            rZero.optimalBoostAllocation.unusedBoostPlays,
          );
        });
      });
    });
  });
});
