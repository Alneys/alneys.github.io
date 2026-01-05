
// 定义CGSS卡牌数据的类型
interface CgssCardSkillTableItem {
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
      [key: string]: any;
    };
  };
  leaderSkill: {
    name: string;
    description: string;
    params: {
      [key: string]: any;
    };
  };
}

// 导入JSON数据
import cgssCardSkillTableFinal from './cgss_extracted_card_skill_table_final.json';

// 导出类型定义
export type { CgssCardSkillTableItem };
