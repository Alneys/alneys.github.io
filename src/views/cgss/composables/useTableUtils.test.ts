import { describe, it, expect } from 'vitest';

import type { TableDataRow, CgssCardSkillTableItem } from '../CgssUnitViewerTypes';
import {
  sortTableTw,
  sortResonanceSpecialize,
  sortDominantAttribute,
  sortDominantAttribute2,
  createCardDataItem,
  sortCardsByParam,
} from './useTableUtils';

// ==================== 辅助函数：创建测试数据 ====================

/** 创建 TableDataRow 的工厂函数 */
const createRow = (props: Partial<TableDataRow>): TableDataRow => {
  return {
    tw: '7',
    row: 0,
    ...props,
  } as TableDataRow;
};

/** 创建卡片数据 */
const createCard = (props: Partial<CgssCardSkillTableItem>): CgssCardSkillTableItem => {
  return {
    cid: '100001',
    name: '测试卡片',
    title: '测试标题',
    attribute: 'cute',
    rarity: 'ssr',
    specialize: 'vocal',
    link: 'https://example.com',
    stats: {
      vocal: 10000,
      visual: 8000,
      dance: 9000,
    },
    skill: {
      name: '测试技能',
      description: '技能描述',
      type: 'skill_type',
      params: {
        m_proc: 100,
        m_dur: 7,
        tw: 7,
      },
    },
    leaderSkill: {
      name: '队长技能',
      description: '队长技能描述',
    },
    ...props,
  } as CgssCardSkillTableItem;
};

// ==================== sortTableTw 测试 ====================

describe('sortTableTw', () => {
  describe('基本排序', () => {
    it('应按 tw 数值升序排序', () => {
      const rowA = createRow({ tw: '9', row: 1 });
      const rowB = createRow({ tw: '7', row: 2 });

      expect(sortTableTw(rowA, rowB)).toBeGreaterThan(0); // 9 > 7
      expect(sortTableTw(rowB, rowA)).toBeLessThan(0); // 7 < 9
    });

    it('tw 相同时应按 row 排序', () => {
      const rowA = createRow({ tw: '7', row: 2 });
      const rowB = createRow({ tw: '7', row: 1 });

      expect(sortTableTw(rowA, rowB)).toBeGreaterThan(0); // row 2 > row 1
      expect(sortTableTw(rowB, rowA)).toBeLessThan(0); // row 1 < row 2
    });
  });

  describe('边界情况', () => {
    it('应处理 undefined tw 值（视为 0）', () => {
      const rowA = createRow({ tw: undefined, row: 1 });
      const rowB = createRow({ tw: '7', row: 2 });

      expect(sortTableTw(rowA, rowB)).toBeLessThan(0); // 0 < 7
    });

    it('两个 undefined tw 值应按 row 排序', () => {
      const rowA = createRow({ tw: undefined, row: 2 });
      const rowB = createRow({ tw: undefined, row: 1 });

      expect(sortTableTw(rowA, rowB)).toBeGreaterThan(0); // row 2 > row 1
    });

    it('应处理空字符串 tw 值', () => {
      const rowA = createRow({ tw: '', row: 1 });
      const rowB = createRow({ tw: '7', row: 2 });

      expect(sortTableTw(rowA, rowB)).toBeLessThan(0); // 0 < 7
    });
  });

  describe('多行排序验证', () => {
    it('应正确排序多行数据', () => {
      const rows = [
        createRow({ tw: '11', row: 1 }),
        createRow({ tw: '7', row: 2 }),
        createRow({ tw: '9', row: 3 }),
        createRow({ tw: '7', row: 4 }), // tw 相同，row 不同
      ];

      const sorted = [...rows].sort(sortTableTw);

      expect(sorted[0]!.tw).toBe('7');
      expect(sorted[0]!.row).toBe(2); // row 2 < row 4
      expect(sorted[1]!.tw).toBe('7');
      expect(sorted[1]!.row).toBe(4);
      expect(sorted[2]!.tw).toBe('9');
      expect(sorted[3]!.tw).toBe('11');
    });
  });
});

// ==================== sortResonanceSpecialize 测试 ====================

describe('sortResonanceSpecialize', () => {
  // 预定义顺序：['vocal', 'dance', 'visual']

  describe('按预定义顺序排序', () => {
    it('应按 vocal → dance → visual 顺序排序', () => {
      const rowVocal = createRow({ tw: '7', specialize: 'vocal', row: 3 });
      const rowDance = createRow({ tw: '7', specialize: 'dance', row: 2 });
      const rowVisual = createRow({ tw: '7', specialize: 'visual', row: 1 });

      expect(sortResonanceSpecialize(rowVocal, rowDance)).toBeLessThan(0); // vocal < dance
      expect(sortResonanceSpecialize(rowVocal, rowVisual)).toBeLessThan(0); // vocal < visual
      expect(sortResonanceSpecialize(rowDance, rowVisual)).toBeLessThan(0); // dance < visual
    });

    it('相同 specialize 应按 row 排序', () => {
      const rowA = createRow({ tw: '7', specialize: 'vocal', row: 2 });
      const rowB = createRow({ tw: '7', specialize: 'vocal', row: 1 });

      expect(sortResonanceSpecialize(rowA, rowB)).toBeGreaterThan(0); // row 2 > row 1
    });
  });

  describe('处理未知值', () => {
    it('未知值应排在预定义值后面', () => {
      const rowKnown = createRow({ tw: '7', specialize: 'vocal', row: 1 });
      const rowUnknown = createRow({ tw: '7', specialize: 'unknown', row: 2 });

      expect(sortResonanceSpecialize(rowKnown, rowUnknown)).toBeLessThan(0); // vocal < unknown
      expect(sortResonanceSpecialize(rowUnknown, rowKnown)).toBeGreaterThan(0); // unknown > vocal
    });

    it('两个未知值应按字母顺序排序', () => {
      const rowA = createRow({ tw: '7', specialize: 'zebra', row: 1 });
      const rowB = createRow({ tw: '7', specialize: 'alpha', row: 2 });

      expect(sortResonanceSpecialize(rowA, rowB)).toBeGreaterThan(0); // zebra > alpha (字母序)
    });

    it('两个相同未知值应按 row 排序', () => {
      const rowA = createRow({ tw: '7', specialize: 'unknown', row: 2 });
      const rowB = createRow({ tw: '7', specialize: 'unknown', row: 1 });

      expect(sortResonanceSpecialize(rowA, rowB)).toBeGreaterThan(0); // row 2 > row 1
    });
  });
});

// ==================== sortDominantAttribute 测试 ====================

describe('sortDominantAttribute', () => {
  // 排序顺序：target_attribute → target_param → target_attribute_2 → row
  // target_attribute 顺序：['cute', 'cool', 'passion']
  // target_param 顺序：['vocal', 'dance', 'visual']

  describe('按 target_attribute 排序', () => {
    it('应按 cute → cool → passion 顺序排序', () => {
      const rowCute = createRow({ tw: '7', target_attribute: 'cute', row: 1 });
      const rowCool = createRow({ tw: '7', target_attribute: 'cool', row: 2 });
      const rowPassion = createRow({ tw: '7', target_attribute: 'passion', row: 3 });

      expect(sortDominantAttribute(rowCute, rowCool)).toBeLessThan(0);
      expect(sortDominantAttribute(rowCute, rowPassion)).toBeLessThan(0);
      expect(sortDominantAttribute(rowCool, rowPassion)).toBeLessThan(0);
    });
  });

  describe('多字段排序', () => {
    it('target_attribute 相同时应按 target_param 排序', () => {
      const rowVocal = createRow({
        tw: '7',
        target_attribute: 'cute',
        target_param: 'vocal',
        row: 1,
      });
      const rowDance = createRow({
        tw: '7',
        target_attribute: 'cute',
        target_param: 'dance',
        row: 2,
      });

      expect(sortDominantAttribute(rowVocal, rowDance)).toBeLessThan(0); // vocal < dance
    });

    it('target_attribute 和 target_param 相同时应按 target_attribute_2 排序', () => {
      const rowCute = createRow({
        tw: '7',
        target_attribute: 'passion',
        target_param: 'vocal',
        target_attribute_2: 'cute',
        row: 1,
      });
      const rowCool = createRow({
        tw: '7',
        target_attribute: 'passion',
        target_param: 'vocal',
        target_attribute_2: 'cool',
        row: 2,
      });

      expect(sortDominantAttribute(rowCute, rowCool)).toBeLessThan(0);
    });

    it('所有字段相同时应按 row 排序', () => {
      const rowA = createRow({
        tw: '7',
        target_attribute: 'cute',
        target_param: 'vocal',
        target_attribute_2: 'cool',
        row: 2,
      });
      const rowB = createRow({
        tw: '7',
        target_attribute: 'cute',
        target_param: 'vocal',
        target_attribute_2: 'cool',
        row: 1,
      });

      expect(sortDominantAttribute(rowA, rowB)).toBeGreaterThan(0); // row 2 > row 1
    });
  });
});

// ==================== sortDominantAttribute2 测试 ====================

describe('sortDominantAttribute2', () => {
  // 排序顺序：target_attribute_2 → target_param_2 → target_attribute → row

  describe('按 target_attribute_2 排序', () => {
    it('应按 cute → cool → passion 顺序排序', () => {
      const rowCute = createRow({ tw: '7', target_attribute_2: 'cute', row: 1 });
      const rowCool = createRow({ tw: '7', target_attribute_2: 'cool', row: 2 });
      const rowPassion = createRow({ tw: '7', target_attribute_2: 'passion', row: 3 });

      expect(sortDominantAttribute2(rowCute, rowCool)).toBeLessThan(0);
      expect(sortDominantAttribute2(rowCute, rowPassion)).toBeLessThan(0);
      expect(sortDominantAttribute2(rowCool, rowPassion)).toBeLessThan(0);
    });
  });

  describe('多字段排序', () => {
    it('target_attribute_2 相同时应按 target_param_2 排序', () => {
      const rowVocal = createRow({
        tw: '7',
        target_attribute_2: 'cute',
        target_param_2: 'vocal',
        row: 1,
      });
      const rowDance = createRow({
        tw: '7',
        target_attribute_2: 'cute',
        target_param_2: 'dance',
        row: 2,
      });

      expect(sortDominantAttribute2(rowVocal, rowDance)).toBeLessThan(0);
    });

    it('target_attribute_2 和 target_param_2 相同时应按 target_attribute 排序', () => {
      const rowCute = createRow({
        tw: '7',
        target_attribute_2: 'cute',
        target_param_2: 'vocal',
        target_attribute: 'cute',
        row: 1,
      });
      const rowCool = createRow({
        tw: '7',
        target_attribute_2: 'cute',
        target_param_2: 'vocal',
        target_attribute: 'cool',
        row: 2,
      });

      expect(sortDominantAttribute2(rowCute, rowCool)).toBeLessThan(0);
    });
  });
});

// ==================== createCardDataItem 测试 ====================

describe('createCardDataItem', () => {
  it('应正确创建卡片数据对象', () => {
    const card = createCard({
      cid: '100001',
      name: 'test',
      title: '测试卡片',
    });

    const result = createCardDataItem(card);

    expect(result).toHaveProperty('card');
    expect(result.card).toBe(card);
    expect(result.card.cid).toBe('100001');
    expect(result.card.name).toBe('test');
  });

  it('应保留完整的卡片数据', () => {
    const card = createCard({
      stats: {
        vocal: 15000,
        visual: 12000,
        dance: 13000,
      },
    });

    const result = createCardDataItem(card);

    expect(result.card.stats.vocal).toBe(15000);
    expect(result.card.stats.visual).toBe(12000);
    expect(result.card.stats.dance).toBe(13000);
  });
});

// ==================== sortCardsByParam 测试 ====================

describe('sortCardsByParam', () => {
  const createCardData = (vocal: number, visual: number, dance: number, name: string) => {
    return createCardDataItem(
      createCard({
        name,
        stats: { vocal, visual, dance },
      }),
    );
  };

  describe('基本排序', () => {
    it('应按 vocal 从大到小排序', () => {
      const cards = [
        createCardData(10000, 8000, 9000, 'card1'),
        createCardData(15000, 8000, 9000, 'card2'),
        createCardData(12000, 8000, 9000, 'card3'),
      ];

      const sorted = sortCardsByParam([...cards], 'vocal');

      expect(sorted[0]!.card.name).toBe('card2'); // 15000
      expect(sorted[1]!.card.name).toBe('card3'); // 12000
      expect(sorted[2]!.card.name).toBe('card1'); // 10000
    });

    it('应按 visual 从大到小排序', () => {
      const cards = [
        createCardData(10000, 8000, 9000, 'card1'),
        createCardData(10000, 15000, 9000, 'card2'),
        createCardData(10000, 12000, 9000, 'card3'),
      ];

      const sorted = sortCardsByParam([...cards], 'visual');

      expect(sorted[0]!.card.name).toBe('card2'); // 15000
      expect(sorted[1]!.card.name).toBe('card3'); // 12000
      expect(sorted[2]!.card.name).toBe('card1'); // 8000
    });

    it('应按 dance 从大到小排序', () => {
      const cards = [
        createCardData(10000, 8000, 9000, 'card1'),
        createCardData(10000, 8000, 15000, 'card2'),
        createCardData(10000, 8000, 12000, 'card3'),
      ];

      const sorted = sortCardsByParam([...cards], 'dance');

      expect(sorted[0]!.card.name).toBe('card2'); // 15000
      expect(sorted[1]!.card.name).toBe('card3'); // 12000
      expect(sorted[2]!.card.name).toBe('card1'); // 9000
    });
  });

  describe('边界情况', () => {
    it('targetParam 为 undefined 时应返回原数组', () => {
      const cards = [
        createCardData(10000, 8000, 9000, 'card1'),
        createCardData(15000, 8000, 9000, 'card2'),
      ];

      const sorted = sortCardsByParam([...cards], undefined);

      // 应该不排序，保持原顺序
      expect(sorted[0]!.card.name).toBe('card1');
      expect(sorted[1]!.card.name).toBe('card2');
    });

    it('空数组应返回空数组', () => {
      const sorted = sortCardsByParam([], 'vocal');
      expect(sorted).toEqual([]);
    });

    it('单个元素数组应返回原数组', () => {
      const cards = [createCardData(10000, 8000, 9000, 'card1')];
      const sorted = sortCardsByParam([...cards], 'vocal');

      expect(sorted).toHaveLength(1);
      expect(sorted[0]!.card.name).toBe('card1');
    });
  });

  describe('数值相等情况', () => {
    it('参数值相同时应保持原顺序（稳定排序）', () => {
      const cards = [
        createCardData(10000, 8000, 9000, 'card1'),
        createCardData(10000, 8000, 9000, 'card2'),
        createCardData(10000, 8000, 9000, 'card3'),
      ];

      const sorted = sortCardsByParam([...cards], 'vocal');

      // 稳定排序应保持原顺序
      expect(sorted[0]!.card.name).toBe('card1');
      expect(sorted[1]!.card.name).toBe('card2');
      expect(sorted[2]!.card.name).toBe('card3');
    });
  });
});
