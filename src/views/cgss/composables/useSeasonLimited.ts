import CgssSeasonLimitedGasha from '../data/cgss_season_limited_gasha.json';

const seasonLimitedCids = CgssSeasonLimitedGasha.season_limited.cids.map(Number);

/**
 * 季节限定卡池相关功能
 * 判断卡片是否为月初复刻卡池角色
 */
export function useSeasonLimited() {
  /**
   * 判断是否为月初卡池角色
   * 检查 cid 或 cid-1 是否在列表中
   */
  const isSeasonLimitedCard = (cid: string): boolean => {
    const cidNum = parseInt(cid, 10);
    return seasonLimitedCids.includes(cidNum) || seasonLimitedCids.includes(cidNum - 1);
  };

  return {
    isSeasonLimitedCard,
  };
}
