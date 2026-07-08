import { describe, it, expect } from 'vitest';

import { useGashaFilter } from './useGashaFilter';

describe('useGashaFilter', () => {
  const { isSeasonLimitedCard } = useGashaFilter();

  describe('isSeasonLimitedCard', () => {
    it('当 cid 在列表中应返回 true', () => {
      // 101326 在列表中
      expect(isSeasonLimitedCard('101326')).toBe(true);
      // 301304 在列表中
      expect(isSeasonLimitedCard('301304')).toBe(true);
      // 301382 在列表中
      expect(isSeasonLimitedCard('301382')).toBe(true);
    });

    it('当 cid-1 在列表中应返回 true', () => {
      // 101327-1=101326 在列表中
      expect(isSeasonLimitedCard('101327')).toBe(true);
      // 301305-1=301304 在列表中
      expect(isSeasonLimitedCard('301305')).toBe(true);
      // 301383-1=301382 在列表中
      expect(isSeasonLimitedCard('301383')).toBe(true);
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
      // parseInt('0101326', 10) = 101326
      expect(isSeasonLimitedCard('0101326')).toBe(true);
    });

    it('应正确处理小数', () => {
      // parseInt('101326.5', 10) = 101326
      expect(isSeasonLimitedCard('101326.5')).toBe(true);
    });
  });
});
