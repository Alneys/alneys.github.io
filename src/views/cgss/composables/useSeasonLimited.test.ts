import { describe, it, expect } from 'vitest';

import { useSeasonLimited } from './useSeasonLimited';

describe('useSeasonLimited', () => {
  const { isSeasonLimitedCard } = useSeasonLimited();

  describe('isSeasonLimitedCard', () => {
    it('当 cid 在列表中应返回 true', () => {
      // 101325 在列表中
      expect(isSeasonLimitedCard('101325')).toBe(true);
      // 301303 在列表中
      expect(isSeasonLimitedCard('301303')).toBe(true);
      // 301381 在列表中
      expect(isSeasonLimitedCard('301381')).toBe(true);
    });

    it('当 cid-1 在列表中应返回 true', () => {
      // 101326-1=101325 在列表中
      expect(isSeasonLimitedCard('101326')).toBe(true);
      // 301304-1=301303 在列表中
      expect(isSeasonLimitedCard('301304')).toBe(true);
      // 301382-1=301381 在列表中
      expect(isSeasonLimitedCard('301382')).toBe(true);
    });

    it('当 cid 和 cid-1 都不在列表中应返回 false', () => {
      expect(isSeasonLimitedCard('99999')).toBe(false);
      expect(isSeasonLimitedCard('100000')).toBe(false);
      expect(isSeasonLimitedCard('0')).toBe(false);
    });

    it('应正确处理非数字字符串', () => {
      // parseInt('abc', 10) = NaN
      // NaN - 1 = NaN
      // [1,2,3].includes(NaN) = false
      expect(isSeasonLimitedCard('abc')).toBe(false);
      expect(isSeasonLimitedCard('')).toBe(false);
    });

    it('应正确处理数字字符串的前导零', () => {
      // parseInt('0101325', 10) = 101325
      expect(isSeasonLimitedCard('0101325')).toBe(true);
    });

    it('应正确处理小数', () => {
      // parseInt('101325.5', 10) = 101325
      expect(isSeasonLimitedCard('101325.5')).toBe(true);
    });
  });
});
