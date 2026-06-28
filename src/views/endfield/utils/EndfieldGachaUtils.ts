// EndfieldGachaUtils.ts
export type GachaStrategy = 'single' | 'batch' | 'smart';

export interface GachaSimulationResult {
  result: string[];
  actualDraws: number;
}

/**
 * 单次角色抽卡模拟函数
 * @param no6StarCount 连续未抽到6星次数
 * @param no5Or6StarCount 连续未抽到5/6星次数
 * @param noSpecific6StarCount 连续未抽到特定6星次数
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底
 * @returns 抽取的结果字符串（"6_up", "6_other", "5", "4"）
 */
export function simulateCharacterGachaSingle(
  no6StarCount: number,
  no5Or6StarCount: number,
  noSpecific6StarCount: number,
  hasUsedSpecific6StarGuarantee: boolean,
): string {
  let p6: number, p5: number;

  // 1. 基础概率
  p6 = 0.008;
  p5 = 0.08;

  // 2. 120次特定保底：连续119次未抽特定6星 → 本次（第120次）必定 6星
  // 只有在未使用特定6星保底的情况下才生效
  if (!hasUsedSpecific6StarGuarantee && noSpecific6StarCount >= 119) {
    p6 = 1.0;
    p5 = 0.0;
  }
  // 3. 80次6星保底：连续79次未抽6星 → 本次（第80次）必定 6星
  else if (no6StarCount >= 79) {
    p6 = 1.0;
    p5 = 0.0;
  }
  // 5. 65次6星概率提升：连续65次未抽6星 → 从第66次起，6星概率 = 0.8% + 5% * (n - 64)
  else if (no6StarCount >= 65) {
    p6 = 0.008 + 0.05 * (no6StarCount - 64); // 6星概率提升对应数值
  }

  // 4. 10次5星保底：连续9次未抽5/6星 → 本次（第10次）必定5星及以上
  if (no5Or6StarCount >= 9) {
    p5 = 1;
  }

  // 执行抽取
  const rand = Math.random();

  if (rand < p6) {
    // 6星
    let isSpecific = false;
    // 120次保底：连续119次未获特定6星 → 本次（第120次）必定获得
    // 只有在未使用特定6星保底的情况下才生效
    if (!hasUsedSpecific6StarGuarantee && noSpecific6StarCount >= 119) {
      isSpecific = true;
    } else {
      isSpecific = Math.random() < 0.5; // 50%概率为特定6星
    }

    return isSpecific ? '6_up' : '6_other'; // 特定6星 / 其他6星
  } else if (rand < p6 + p5) {
    return '5'; // 5星
  } else {
    return '4'; // 4星
  }
}

/**
 * 模拟一次完整的角色抽卡过程，直到获得特定6星
 * @param initialNoSpecific6StarCount 继承的未抽取特定6星次数，默认0
 * @param initialNo6StarCount 继承的未抽取6星次数，默认0
 * @param initialNo5Or6StarCount 继承的未抽取5星次数，默认0
 * @param targetRank 目标突破等级，默认0
 * @param gachaStrategy 抽卡策略，默认单抽
 * @param currentSpecific6StarCount 当前已拥有的特定6星数量，默认0
 * @param currentDrawCount 当前已抽取次数，默认0
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底，默认false
 * @returns 返回本次模拟的所有抽取结果的对象，包含result字段，值为字符串列表，以及actualDraws字段表示实际抽取次数
 */
export function simulateCharacterGachaToTarget(
  initialNoSpecific6StarCount: number = 0,
  initialNo6StarCount: number = 0,
  initialNo5Or6StarCount: number = 0,
  targetRank: number = 0,
  gachaStrategy: GachaStrategy = 'single',
  currentSpecific6StarCount: number = 0,
  currentDrawCount: number = 0,
  hasUsedSpecific6StarGuarantee: boolean = false,
): GachaSimulationResult {
  let drawCount = currentDrawCount;
  let no6StarCount = initialNo6StarCount;
  let no5Or6StarCount = initialNo5Or6StarCount;
  let noSpecific6StarCount = initialNoSpecific6StarCount;
  let freeGachaUsed = currentDrawCount >= 30; // 如果当前已抽取次数>=30，则免费10连已使用
  let specific6StarCount = currentSpecific6StarCount;
  let rankUpMaterials = Math.floor(currentDrawCount / 240); // 根据当前已抽取次数计算已有突破材料
  const currentSimulationResults: string[] = [];

  while (drawCount <= 1200) {
    // 如果总抽取次数达到30次，获得当前卡池的免费十连
    if (drawCount >= 30 && !freeGachaUsed) {
      // 30次抽卡获取的免费10连抽使用独立的计数器，不使用、不增加主抽卡流程的保底计数器（no6StarCount、no5Or6StarCount、noSpecific6StarCount）
      let freeNo5Or6StarCount = 0;
      for (let j = 0; j < 10; j++) {
        const freeResult = simulateCharacterGachaSingle(0, freeNo5Or6StarCount, 0, false);

        currentSimulationResults.push(freeResult);

        if (freeResult === '6_up') {
          specific6StarCount++;
        } else if (freeResult === '6_other') {
          freeNo5Or6StarCount = 0;
        } else if (freeResult === '5') {
          freeNo5Or6StarCount = 0;
        } else {
          freeNo5Or6StarCount++;
        }
      }
      freeGachaUsed = true;
      // 跳过后续的保底计数器更新逻辑，确保免费10连不增加主抽卡流程的保底计数
      continue;
    }

    // 满足目标条件时，结束模拟
    if (specific6StarCount >= 1 && specific6StarCount + rankUpMaterials >= 1 + targetRank) {
      break;
    }

    let nextGachaTries = 1;

    if (gachaStrategy === 'single') {
      nextGachaTries = 1;
    } else if (gachaStrategy === 'batch') {
      nextGachaTries = 10;
    } else if (gachaStrategy === 'smart') {
      if (
        no6StarCount >= 60 ||
        (!hasUsedSpecific6StarGuarantee && drawCount >= 110) ||
        drawCount % 240 >= 230
      ) {
        nextGachaTries = 1;
      } else {
        nextGachaTries = 10;
      }
    }

    for (let i = 0; i < nextGachaTries; i++) {
      const result = simulateCharacterGachaSingle(
        no6StarCount,
        no5Or6StarCount,
        noSpecific6StarCount,
        hasUsedSpecific6StarGuarantee,
      );
      currentSimulationResults.push(result);
      drawCount += 1;

      if (drawCount > 0 && drawCount % 240 === 0) {
        rankUpMaterials++;
      }

      if (result === '6_up') {
        specific6StarCount++;
        hasUsedSpecific6StarGuarantee = true;
        noSpecific6StarCount = 0;
        no6StarCount = 0;
        no5Or6StarCount = 0;
      } else if (result === '6_other') {
        noSpecific6StarCount++;
        no6StarCount = 0;
        no5Or6StarCount = 0;
      } else if (result === '5') {
        noSpecific6StarCount++;
        no6StarCount++;
        no5Or6StarCount = 0;
      } else {
        noSpecific6StarCount++;
        no6StarCount++;
        no5Or6StarCount++;
      }
    }
  }

  // 计算实际抽数：总长度减去免费10抽（如果有的话）
  let actualDraws = currentSimulationResults.length;
  if (currentSimulationResults.length + currentDrawCount > 30 && currentDrawCount < 30) {
    actualDraws -= 10;
  }

  // 如果总抽取次数达到60次，获得下个卡池的免费十连
  if (drawCount >= 60) {
    // 下个卡池继承未抽到6星和5星的计数，但不继承未抽到特定6星的计数，因为下个卡池的特定角色与当前的不同，此处简单处理
    let freeNo6StarCount = no6StarCount;
    let freeNo5Or6StarCount = no5Or6StarCount;

    for (let j = 0; j < 10; j++) {
      let freeResult = simulateCharacterGachaSingle(
        freeNo6StarCount,
        freeNo5Or6StarCount,
        0, // 简单处理
        hasUsedSpecific6StarGuarantee,
      );

      currentSimulationResults.push(freeResult);

      // 更新计数器，注意不更新noSpecific6StarCount
      if (freeResult === '6_up') {
        freeResult = '6_other'; // 简单处理
        specific6StarCount++;
        hasUsedSpecific6StarGuarantee = true;
        freeNo6StarCount = 0;
        freeNo5Or6StarCount = 0;
      } else if (freeResult === '6_other') {
        freeNo6StarCount = 0;
        freeNo5Or6StarCount = 0;
      } else if (freeResult === '5') {
        freeNo6StarCount++;
        freeNo5Or6StarCount = 0;
      } else {
        freeNo6StarCount++;
        freeNo5Or6StarCount++;
      }
    }
  }

  return { result: currentSimulationResults, actualDraws };
}

/**
 * 模拟多次角色抽卡过程，获得达到目标时的各种抽取情况
 * @param simulationCount 模拟次数，默认10000
 * @param initialNoSpecific6StarCount 继承的未抽取特定6星次数，默认0
 * @param initialNo6StarCount 继承的未抽取6星次数，默认0
 * @param initialNo5Or6StarCount 继承的未抽取5星次数，默认0
 * @param targetRank 目标突破等级，默认0
 * @param gachaStrategy 抽卡策略，默认单抽
 * @param currentSpecific6StarCount 当前已拥有的特定6星数量，默认0
 * @param currentDrawCount 当前已抽取次数，默认0
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底，默认false
 * @returns 返回一个列表，每个元素是一次模拟的所有抽取结果的对象，包含result字段，值为字符串列表，以及actualDraws字段表示实际抽取次数
 */
export function simulateCharacterGachaToTargetMultipleTimes(
  simulationCount: number = 10000,
  initialNoSpecific6StarCount: number = 0,
  initialNo6StarCount: number = 0,
  initialNo5Or6StarCount: number = 0,
  targetRank: number = 0,
  gachaStrategy: GachaStrategy = 'single',
  currentSpecific6StarCount: number = 0,
  currentDrawCount: number = 0,
  hasUsedSpecific6StarGuarantee: boolean = false,
): GachaSimulationResult[] {
  const allSimulationResults: GachaSimulationResult[] = [];

  if (hasUsedSpecific6StarGuarantee && currentSpecific6StarCount <= 1) {
    currentSpecific6StarCount = 1;
  }

  for (let i = 0; i < simulationCount; i++) {
    const currentSimulationResult = simulateCharacterGachaToTarget(
      initialNoSpecific6StarCount,
      initialNo6StarCount,
      initialNo5Or6StarCount,
      targetRank,
      gachaStrategy,
      currentSpecific6StarCount,
      currentDrawCount,
      hasUsedSpecific6StarGuarantee,
    );
    allSimulationResults.push(currentSimulationResult);
  }

  return allSimulationResults;
}
