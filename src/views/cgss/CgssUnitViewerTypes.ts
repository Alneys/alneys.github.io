/**
 * CgssUnitViewer 类型定义与常量配置
 */

// ==================== 类型定义 ====================

/** 卡片技能数据 */
export interface CgssCardSkillTableItem {
  cid: string;
  name: string;
  title: string;
  attribute: string;
  rarity: string;
  specialize: string;
  link: string;
  stats: {
    vocal: number;
    visual: number;
    dance: number;
  };
  skill: {
    name: string;
    description: string;
    type: string;
    params: {
      m_proc: number;
      m_dur: number;
      tw: number;
    };
  };
  leaderSkill: {
    name: string;
    description: string;
    params?: {
      target_attribute: string;
      target_param: string;
      target_attribute_2: string;
      target_param_2: string;
    };
  };
}

/** 卡片数据（包含亮度状态） */
export interface CardData {
  card: CgssCardSkillTableItem;
  isBrightness: boolean;
}

/** 表格行数据 */
export interface TableDataRow {
  tw: string;
  specialize?: string;
  target_attribute_2?: string;
  target_attribute?: string;
  target_param_2?: string;
  target_param?: string;
  row: number;
  [key: string]: CardData[] | string | number | undefined;
}

/** 列头配置 */
export interface ColumnHeader {
  prop: string;
  labelCn: string;
  labelEn: string;
  skill: string;
  minWidth?: number;
  minWidthSmallScreen?: number;
  extraColumn?: boolean;
  attribute?: string;
  param?: string;
  tw?: string;
}

/** 点击图标操作类型 */
export type ClickIconAction = 'None' | 'ToggleCardStatus' | 'ViewCardInfo';

// ==================== 常量配置 ====================

// ---------- 共鸣表 (Resonance) 配置 ----------

/** 共鸣表行头 - 属性 */
export const tableResonanceRowHeaderAttribute: string[] = ['cute', 'cool', 'passion'];

/** 共鸣表行头 - 特化 */
export const tableResonanceRowHeaderSpecialize: string[] = ['vocal', 'dance', 'visual'];

/** 共鸣表行头 - 间隔 */
export const tableResonanceRowHeaderTw: string[] = ['7', '9', '11'];

/** 共鸣表列头配置 */
export const tableResonanceColumnHeader: ColumnHeader[] = [
  {
    prop: 'magic',
    labelCn: '魔法',
    labelEn: 'magic',
    skill: 'magic',
    minWidth: 200,
    extraColumn: true,
  },
  { prop: 'motif', labelCn: '共鸣', labelEn: 'resonance motif', skill: 'motif', minWidth: 150 },
  { prop: 'synergy', labelCn: '大偏', labelEn: 'synergy', skill: 'synergy', minWidth: 150 },
  { prop: 'symphony', labelCn: '交响', labelEn: 'symphony', skill: 'symphony', minWidth: 100 },
  { prop: 'spike', labelCn: '尖峰', labelEn: 'spike', skill: 'spike', minWidth: 100 },
  { prop: 'refrain', labelCn: '副歌', labelEn: 'refrain', skill: 'refrain', minWidth: 150 },
  {
    prop: 'coordinate',
    labelCn: '协调',
    labelEn: 'coordinate',
    skill: 'focus_flat',
    minWidth: 200,
    extraColumn: true,
  },
  {
    prop: 'sparkle',
    labelCn: '闪耀',
    labelEn: 'sparkle',
    skill: 'sparkle',
    minWidth: 150,
    extraColumn: true,
  },
  {
    prop: 'combo',
    labelCn: '连击',
    labelEn: 'combo',
    skill: 'cboost',
    minWidth: 150,
    extraColumn: true,
  },
];

// ---------- 双色表 (Dominant) 配置 ----------

/** 双色表行头 - 属性 */
export const tableDominantRowHeaderAttribute = tableResonanceRowHeaderAttribute;

/** 双色表行头 - 特化 */
export const tableDominantRowHeaderSpecialize = tableResonanceRowHeaderSpecialize;

/** 双色表行头 - 属性特化配对 */
export const tableDominantRowHeaderAttributeSpecializePairs: {
  target_param_2: string;
  target_param: string;
}[] = [
  { target_param_2: 'vocal', target_param: 'visual' },
  { target_param_2: 'dance', target_param: 'vocal' },
  { target_param_2: 'visual', target_param: 'dance' },
];

/** 双色表行头 - 间隔 */
export const tableDominantRowHeaderTw: string[] = ['6', '9', '11', '13'];

/** 双色表列头配置 */
export const tableDominantColumnHeader: ColumnHeader[] = [
  {
    prop: 'dominant',
    labelCn: '双色',
    labelEn: 'dominant',
    skill: 'dominant',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    minWidth: 64,
    extraColumn: false,
  },
  {
    prop: 'alternate',
    labelCn: '变换',
    labelEn: 'alternate',
    skill: 'alternate',
    attribute: 'target_attribute',
    param: 'target_param',
    minWidth: 108,
    minWidthSmallScreen: 108,
  },
  {
    prop: 'mutual',
    labelCn: '交互',
    labelEn: 'mutual',
    skill: 'mutual',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    minWidth: 152,
    minWidthSmallScreen: 108,
  },
  {
    prop: 'overload_4',
    labelCn: '过载 4s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '4',
  },
  {
    prop: 'overdrive_4',
    labelCn: '超载 4s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '4',
  },
  {
    prop: 'overload_6',
    labelCn: '过载 6s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '6',
  },
  {
    prop: 'overdrive_6',
    labelCn: '超载 6s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '6',
  },
  {
    prop: 'overload_7',
    labelCn: '过载 7s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '7',
  },
  {
    prop: 'overdrive_7',
    labelCn: '超载 7s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '7',
  },
  {
    prop: 'overload_9',
    labelCn: '过载 9s',
    labelEn: 'overload',
    skill: 'overload',
    attribute: 'target_attribute',
    param: 'target_param',
    tw: '9',
  },
  {
    prop: 'overdrive_9',
    labelCn: '超载 9s',
    labelEn: 'overdrive',
    skill: 'overdrive',
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    tw: '9',
  },
  {
    prop: 'act',
    labelCn: '演技',
    labelEn: 'act',
    skill: 'psb_',
    attribute: 'target_attribute',
    param: 'target_param',
    minWidth: 116,
    minWidthSmallScreen: 116,
    extraColumn: true,
  },
  {
    prop: 'combo',
    labelCn: '连击',
    labelEn: 'combo',
    skill: 'cboost',
    minWidth: 80,
    attribute: 'target_attribute_2',
    param: 'target_param_2',
    extraColumn: true,
  },
];

// ---------- 阈值常量 ----------

/** Dominant 表参数阈值 - 全部  */
export const DOMINANT_PARAM_THRESHOLD_ADD = 0;
/** Dominant 表参数阈值 - 特化  */
export const DOMINANT_PARAM_THRESHOLD_SPECIALIZE = 5000;
