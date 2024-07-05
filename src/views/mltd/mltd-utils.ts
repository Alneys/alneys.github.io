import { levelToMaxStaminaTable } from './mltd-data';

export function levelToMaxStamina(level: number): number {
  return levelToMaxStaminaTable[level] ?? levelToMaxStaminaTable[0];

  // if (level >= 700) {
  //   return 240;
  // }
  // if (level >= 0 && level <= 59) {
  //   return 60 + Math.floor(level / 2);
  // }
  // if (level >= 60 && level <= 149) {
  //   return 70 + Math.floor(level / 3);
  // }
  // if (level >= 60 && level <= 149) {
  //   return 70 + Math.floor(level / 3);
  // }
  // if (level >= 150 && level <= 425) {
  //   return 83 + Math.floor((level - 2) / 4);
  // }
  // if (level >= 426 && level <= 585) {
  //   return 104 + Math.floor((level - 1) / 5);
  // }
  // if (level >= 586 && level <= 699) {
  //   return 124 + Math.floor((level - 4) / 6);
  // }
  // return 60;
}
