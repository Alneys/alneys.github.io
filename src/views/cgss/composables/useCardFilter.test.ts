import { ref, nextTick } from 'vue';

import { describe, it, expect } from 'vitest';

import nameFilterData from '../data/cgss_name_filter.json';
import { useCardFilter } from './useCardFilter';

describe('useCardFilter', () => {
  // ==================== splitNameFilter 测试 ====================

  describe('splitNameFilter', () => {
    describe('分隔符处理', () => {
      it('应按空格分割名字', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '奥山沙織 櫻井桃華 関裕美';
        await nextTick();

        expect(splitNameFilter.value).toEqual(['奥山沙織', '櫻井桃華', '関裕美']);
      });

      it('应按半角逗号分割名字', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '奥山沙織,櫻井桃華,関裕美';
        await nextTick();

        expect(splitNameFilter.value).toEqual(['奥山沙織', '櫻井桃華', '関裕美']);
      });

      it('应按全角顿号分割名字', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '奥山沙織、櫻井桃華、関裕美';
        await nextTick();

        expect(splitNameFilter.value).toEqual(['奥山沙織', '櫻井桃華', '関裕美']);
      });

      it('应按换行符分割名字', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '奥山沙織\n櫻井桃華\n関裕美';
        await nextTick();

        expect(splitNameFilter.value).toEqual(['奥山沙織', '櫻井桃華', '関裕美']);
      });

      it('应处理混合分隔符', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '奥山沙織 櫻井桃華、関裕美,大沼くるみ\n松原早耶';
        await nextTick();

        expect(splitNameFilter.value).toEqual([
          '奥山沙織',
          '櫻井桃華',
          '関裕美',
          '大沼くるみ',
          '松原早耶',
        ]);
      });
    });

    describe('空值和边界处理', () => {
      it('空字符串应返回空数组', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '';
        await nextTick();

        expect(splitNameFilter.value).toEqual([]);
      });

      it('只有分隔符的字符串应返回空数组', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '   \n\n、、、,,,   ';
        await nextTick();

        expect(splitNameFilter.value).toEqual([]);
      });

      it('应过滤空字符串', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '奥山沙織  櫻井桃華  ';
        await nextTick();

        expect(splitNameFilter.value).toEqual(['奥山沙織', '櫻井桃華']);
      });

      it('应去除名字前后的空白', async () => {
        const { inputNameFilter, splitNameFilter } = useCardFilter();
        inputNameFilter.value = '  奥山沙織  櫻井桃華  ';
        await nextTick();

        expect(splitNameFilter.value).toEqual(['奥山沙織', '櫻井桃華']);
      });
    });

    describe('默认值', () => {
      it('应使用 JSON 数据的第一个预设作为默认值', () => {
        const { inputNameFilter } = useCardFilter();

        expect(inputNameFilter.value).toBe(nameFilterData[0]!.nameFilter);
      });
    });
  });

  // ==================== isNameMatched 测试 ====================

  describe('isNameMatched', () => {
    describe('空值情况', () => {
      it('空名字应返回 true', () => {
        const { isNameMatched } = useCardFilter();
        expect(isNameMatched('')).toBe(true);
      });

      it('undefined 名字应返回 true', () => {
        const { isNameMatched } = useCardFilter();
        expect(isNameMatched(undefined)).toBe(true);
      });
    });

    describe('空过滤列表', () => {
      it('过滤列表为空时应返回 true', async () => {
        const { inputNameFilter, splitNameFilter, isNameMatched } = useCardFilter();
        inputNameFilter.value = '';
        await nextTick();

        expect(splitNameFilter.value).toEqual([]);
        expect(isNameMatched('奥山沙織')).toBe(true);
        expect(isNameMatched('櫻井桃華')).toBe(true);
      });
    });

    describe('精确匹配', () => {
      it('应精确匹配名字（不是包含匹配）', async () => {
        const { inputNameFilter, isNameMatched } = useCardFilter();
        inputNameFilter.value = '奥山沙織';
        await nextTick();

        // 精确匹配应返回 true
        expect(isNameMatched('奥山沙織')).toBe(true);
        // 包含但不精确匹配应返回 false
        expect(isNameMatched('奥山沙織子')).toBe(false);
        expect(isNameMatched('奥山')).toBe(false);
      });

      it('应匹配多个名字中的任意一个', async () => {
        const { inputNameFilter, isNameMatched } = useCardFilter();
        inputNameFilter.value = '奥山沙織 櫻井桃華 関裕美';
        await nextTick();

        expect(isNameMatched('奥山沙織')).toBe(true);
        expect(isNameMatched('櫻井桃華')).toBe(true);
        expect(isNameMatched('関裕美')).toBe(true);
        expect(isNameMatched('大沼くるみ')).toBe(false);
      });
    });

    describe('实际 JSON 数据测试', () => {
      it('应匹配 JSON 数据中存在的名字', () => {
        // 使用真实 JSON 数据（默认是第一个预设）
        const { isNameMatched } = useCardFilter();

        // 第一个预设中存在的名字
        expect(isNameMatched('奥山沙織')).toBe(true);
        expect(isNameMatched('櫻井桃華')).toBe(true);
        expect(isNameMatched('関裕美')).toBe(true);
        expect(isNameMatched('大沼くるみ')).toBe(true);
        expect(isNameMatched('渋谷凛')).toBe(true);
        expect(isNameMatched('姫川友紀')).toBe(true);
      });

      it('不应匹配 JSON 数据中不存在的名字', () => {
        const { isNameMatched } = useCardFilter();

        // 第一个预设中不存在的名字
        expect(isNameMatched('中野有香')).toBe(false);
        expect(isNameMatched('本田未央')).toBe(false);
        expect(isNameMatched('水本ゆかり')).toBe(false);
      });
    });
  });

  // ==================== getNameFilterDataList 测试 ====================

  describe('getNameFilterDataList', () => {
    it('应返回完整的名字筛选数据列表', () => {
      const { getNameFilterDataList } = useCardFilter();

      const list = getNameFilterDataList();

      expect(list).toBe(nameFilterData);
      expect(list.length).toBe(3);
    });

    it('每个预设应包含 nameFilter 和 information 字段', () => {
      const { getNameFilterDataList } = useCardFilter();

      const list = getNameFilterDataList();

      list.forEach((preset) => {
        expect(preset).toHaveProperty('nameFilter');
        expect(preset).toHaveProperty('information');
        expect(typeof preset.nameFilter).toBe('string');
        expect(typeof preset.information).toBe('string');
      });
    });

    it('应包含预期的预设信息', () => {
      const { getNameFilterDataList } = useCardFilter();

      const list = getNameFilterDataList();

      expect(list[list.length - 2]!.information).toBe('LIVE Carnival 2026 Spring');
      expect(list[list.length - 1]!.information).toBe('LIVE Carnival 2025 Winter');
    });
  });

  // ==================== 外部 ref 测试 ====================

  describe('外部 ref 双向绑定', () => {
    it('应能使用外部传入的 ref', async () => {
      const externalRef = ref('奥山沙織 櫻井桃華');
      const { inputNameFilter, splitNameFilter, isNameMatched } = useCardFilter(externalRef);

      // 初始值应来自外部 ref
      expect(inputNameFilter.value).toBe('奥山沙織 櫻井桃華');

      await nextTick();
      expect(splitNameFilter.value).toEqual(['奥山沙織', '櫻井桃華']);

      // 修改外部 ref 应影响内部状态
      externalRef.value = '関裕美 大沼くるみ';
      await nextTick();

      expect(splitNameFilter.value).toEqual(['関裕美', '大沼くるみ']);
      expect(isNameMatched('関裕美')).toBe(true);
      expect(isNameMatched('奥山沙織')).toBe(false);
    });

    it('修改 inputNameFilter 应同步到外部 ref', async () => {
      const externalRef = ref('初始值');
      const { inputNameFilter, splitNameFilter } = useCardFilter(externalRef);

      inputNameFilter.value = '松原早耶 桃井あずき';
      await nextTick();

      // 外部 ref 应同步更新
      expect(externalRef.value).toBe('松原早耶 桃井あずき');
      expect(splitNameFilter.value).toEqual(['松原早耶', '桃井あずき']);
    });
  });

  // ==================== 响应式测试 ====================

  describe('响应式更新', () => {
    it('修改过滤列表后应立即更新匹配结果', async () => {
      const { inputNameFilter, isNameMatched } = useCardFilter();

      // 初始状态
      expect(isNameMatched('奥山沙織')).toBe(true);
      expect(isNameMatched('中野有香')).toBe(false);

      // 切换到第二个预设
      inputNameFilter.value = nameFilterData[1]!.nameFilter;
      await nextTick();

      // 第二个预设包含中野有香
      expect(isNameMatched('中野有香')).toBe(true);
      expect(isNameMatched('持田亜里沙')).toBe(true);
      // 第一个预设的名字不再匹配
      expect(isNameMatched('奥山沙織')).toBe(false);
    });

    it('切换到第三个预设应正确匹配', async () => {
      const { inputNameFilter, isNameMatched } = useCardFilter();

      inputNameFilter.value = nameFilterData[2]!.nameFilter;
      await nextTick();

      // 第三个预设的名字
      expect(isNameMatched('水本ゆかり')).toBe(true);
      expect(isNameMatched('椎名法子')).toBe(true);
      expect(isNameMatched('高森藍子')).toBe(true);
      // 其他预设的名字
      expect(isNameMatched('奥山沙織')).toBe(false);
      expect(isNameMatched('中野有香')).toBe(false);
    });
  });
});
