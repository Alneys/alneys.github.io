/**
 * 周年活动计算器状态管理组合式函数
 * 统一管理表单状态、计算结果和本地存储操作
 */

import { reactive, computed, type Ref } from 'vue';
import { useMltdUtils } from './useMltdUtils';
import { ANNIVERSARY_CONSTANTS } from '../MltdConstant';
import type { AnniversaryForm, AnniversaryResult } from '../MltdTypes';

const STORAGE_KEY = 'mltd-anni';

export const createDefaultForm = (): AnniversaryForm => ({
  eventEndTime: new Date(`${new Date().getFullYear()}-07-13 00:00:00+0900`),
  targetPt: undefined,
  plv: undefined,
  maxStamina: undefined,
  pt: undefined,
  token: undefined,
  boostCount: 0,
  freeTokenCount: 0,
  staminaMaxCount: 0,
  stamina30Count: 0,
  stamina20Count: 0,
  stamina10Count: 0,
  gainTokenTime: 6.5,
  burnTokenTime: 3,
  remainingTime: 0,
});

export function useMltdAnniversaryCalc(form: Ref<AnniversaryForm>) {
  const result = reactive({
    ptFromBoost: computed(
      () =>
        Math.floor(
          (form.value.boostCount ?? 0) *
            (ANNIVERSARY_CONSTANTS.TOKENS_PER_BOOST_PLAY +
              (ANNIVERSARY_CONSTANTS.TOKENS_PER_BOOST_PLAY *
                ANNIVERSARY_CONSTANTS.PT_PER_BURN_PLAY) /
                ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY) *
            ANNIVERSARY_CONSTANTS.BOOST_PLAYS_PER_FIRE,
        ) || 0,
    ),
    ptFromFreeToken: computed(
      () =>
        Math.floor(
          (form.value.freeTokenCount ?? 0) *
            ((ANNIVERSARY_CONSTANTS.DAILY_FREE_TOKENS * ANNIVERSARY_CONSTANTS.PT_PER_BURN_PLAY) /
              ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY),
        ) || 0,
    ),
    ptFromRemainingToken: computed(
      () => Math.floor((form.value.token ?? 0) * ANNIVERSARY_CONSTANTS.TOKEN_TO_PT_RATIO) || 0,
    ),

    currentMaxStamina: computed(() => {
      if (!form.value.plv) return 60;
      const { levelToMaxStamina } = useMltdUtils();
      return levelToMaxStamina(form.value.plv) || 60;
    }),
    staminaForBoost: computed(
      () => (form.value.boostCount ?? 0) * ANNIVERSARY_CONSTANTS.STAMINA_COST_PER_BOOST || 0,
    ),
    staminaRecover: computed(
      () =>
        Math.floor(
          (form.value.remainingTime ?? 0) * ANNIVERSARY_CONSTANTS.STAMINA_RECOVER_PER_DAY,
        ) || 0,
    ),
    staminaFromBottles: computed(
      (): number =>
        (form.value.staminaMaxCount ?? 0) * result.currentMaxStamina +
        (form.value.stamina30Count ?? 0) * 30 +
        (form.value.stamina20Count ?? 0) * 20 +
        (form.value.stamina10Count ?? 0) * 10,
    ),
    staminaFromDaily: computed(
      (): number =>
        (ANNIVERSARY_CONSTANTS.DAILY_MAX_STAMINA_BONUS_COUNT * result.currentMaxStamina +
          ANNIVERSARY_CONSTANTS.DAILY_STAMINA_30_COUNT * 30) *
        (form.value.freeTokenCount ?? 0),
    ),

    ptNeeded: computed((): number => {
      const needed =
        (form.value.targetPt ?? 0) -
        (form.value.pt ?? 0) -
        (result.ptFromBoost + result.ptFromFreeToken + result.ptFromRemainingToken);
      return needed && needed > 0 ? needed : 0;
    }),
    staminaNeeded: computed((): number => {
      return Math.ceil(
        result.ptNeeded *
          (ANNIVERSARY_CONSTANTS.STAMINA_COST_GAIN_TOKEN /
            (ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY +
              (ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY /
                ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY) *
                ANNIVERSARY_CONSTANTS.PT_PER_BURN_PLAY)),
      );
    }),
    tokenNeeded: computed((): number => {
      return Math.ceil(
        (result.staminaNeeded / ANNIVERSARY_CONSTANTS.STAMINA_COST_GAIN_TOKEN) *
          ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY,
      );
    }),

    jewelNeeded: computed((): number => {
      const res = Math.ceil(
        ((result.staminaNeeded +
          result.staminaForBoost -
          result.staminaRecover -
          result.staminaFromBottles -
          result.staminaFromDaily) /
          result.currentMaxStamina) *
          ANNIVERSARY_CONSTANTS.JEWEL_PER_FULL_STAMINA,
      );
      return res > 0 ? res : 0;
    }),
    boostPlays: computed(
      (): number => (form.value.boostCount ?? 0) * ANNIVERSARY_CONSTANTS.BOOST_PLAYS_PER_FIRE || 0,
    ),
    gainTokenPlays: computed(
      (): number =>
        Math.ceil(result.staminaNeeded / ANNIVERSARY_CONSTANTS.STAMINA_COST_GAIN_TOKEN) || 0,
    ),
    burnTokenPlays: computed(
      (): number =>
        Math.ceil(
          ((form.value.token ?? 0) +
            (form.value.boostCount ?? 0) *
              ANNIVERSARY_CONSTANTS.TOKENS_PER_GAIN_PLAY *
              2 *
              ANNIVERSARY_CONSTANTS.BOOST_PLAYS_PER_FIRE +
            (form.value.freeTokenCount ?? 0) * ANNIVERSARY_CONSTANTS.DAILY_FREE_TOKENS +
            result.tokenNeeded) /
            ANNIVERSARY_CONSTANTS.TOKENS_PER_BURN_PLAY,
        ) || 0,
    ),
    boostTimeSpend: computed((): number => result.boostPlays * (form.value.gainTokenTime ?? 0)),
    gainTokenTimeSpend: computed(
      (): number => result.gainTokenPlays * (form.value.gainTokenTime ?? 0),
    ),
    burnTokenTimeSpend: computed(
      (): number => result.burnTokenPlays * (form.value.burnTokenTime ?? 0),
    ),
    totalTimeSpend: computed(
      (): number => result.boostTimeSpend + result.gainTokenTimeSpend + result.burnTokenTimeSpend,
    ),
  });

  const resetCurrentRemainingTime = (): number => {
    const remainingTime = Number(
      ((form.value.eventEndTime.getTime() - new Date().getTime()) / (1000 * 3600 * 24)).toFixed(3),
    );
    form.value.remainingTime = remainingTime;
    form.value.remainingTime = form.value.remainingTime > 0 ? form.value.remainingTime : 0;
    form.value.remainingTime =
      form.value.remainingTime > ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS
        ? ANNIVERSARY_CONSTANTS.EVENT_TOTAL_DAYS
        : form.value.remainingTime;
    return form.value.remainingTime;
  };

  const setBoostFromRemainingTime = () => {
    if (form.value.remainingTime && form.value.remainingTime > 0) {
      form.value.boostCount = Math.floor(form.value.remainingTime);
      form.value.freeTokenCount = form.value.boostCount;
    }
  };

  const saveToLocalStorage = (): boolean => {
    try {
      const data = {
        ...form.value,
        eventEndTime: form.value.eventEndTime.toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('保存失败:', error);
      return false;
    }
  };

  const loadFromLocalStorage = (): boolean => {
    try {
      const formFromLocal = localStorage.getItem(STORAGE_KEY);
      if (!formFromLocal) {
        return false;
      }
      const parsed = JSON.parse(formFromLocal);
      form.value = {
        ...parsed,
        eventEndTime: new Date(parsed.eventEndTime),
      };
      return true;
    } catch (error) {
      console.error('读取失败:', error);
      return false;
    }
  };

  const clearLocalStorage = (): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清除失败:', error);
      return false;
    }
  };

  const getExportData = (): string => {
    return JSON.stringify({
      ...form.value,
      eventEndTime: form.value.eventEndTime.toISOString(),
    });
  };

  const importFromString = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      form.value = {
        ...parsed,
        eventEndTime: new Date(parsed.eventEndTime),
      };
      return true;
    } catch (error) {
      console.error('导入失败:', error);
      return false;
    }
  };

  return {
    result,
    resetCurrentRemainingTime,
    setBoostFromRemainingTime,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    getExportData,
    importFromString,
  };
}
