import { type Ref } from 'vue';

import CgssMemorialGasha from '../data/cgss_memorial_gasha.json';

/**
 * 回忆卡池相关功能
 * 判断卡片是否为指定届数的回忆卡池角色
 */
export function useMemorialGasha(selectedEdition: Ref<string | null>) {
  /**
   * 判断是否为回忆卡池角色
   */
  const isMemorialGashaCard = (cid: string): boolean => {
    const key = selectedEdition.value;
    if (!key) return false;
    const edition = (CgssMemorialGasha as Record<string, { cids: string[] }>)[key];
    if (!edition) return false;
    return edition.cids.includes(cid);
  };

  return {
    isMemorialGashaCard,
  };
}
