import { type Ref } from 'vue';

import CgssMemorialGasha from '../data/cgss_memorial_gasha.json';
import CgssSeasonLimitedGasha from '../data/cgss_season_limited_gasha.json';

const seasonLimitedCids = CgssSeasonLimitedGasha.season_limited.cids.map(Number);

/**
 * 卡池过滤相关功能
 * - 回忆卡池：判断卡片是否为指定届数的回忆卡池角色
 * - 季节限定卡池：判断卡片是否为月初复刻卡池角色
 */
export function useGashaFilter(selectedEdition?: Ref<string | null>) {
  /**
   * 判断是否为回忆卡池角色
   */
  const isMemorialGashaCard = (cid: string): boolean => {
    const key = selectedEdition?.value;
    if (!key) return false;

    if (key === 'all') {
      return Object.values(CgssMemorialGasha as Record<string, { cids: string[] }>).some(
        (edition) => edition.cids.includes(cid),
      );
    }

    const edition = (CgssMemorialGasha as Record<string, { cids: string[] }>)[key];
    if (!edition) return false;
    return edition.cids.includes(cid);
  };

  /**
   * 判断是否为月初卡池角色
   * 检查 cid 或 cid-1 是否在列表中
   */
  const isSeasonLimitedCard = (cid: string): boolean => {
    const cidNum = parseInt(cid, 10);
    return seasonLimitedCids.includes(cidNum) || seasonLimitedCids.includes(cidNum - 1);
  };

  return {
    isMemorialGashaCard,
    isSeasonLimitedCard,
  };
}
