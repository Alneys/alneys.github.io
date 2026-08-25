// EndfieldGachaUtils.ts
export type GachaStrategy = 'single' | 'batch' | 'smart';

export type GachaType = 'normal' | 'rerelease';

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
export function simulateCharacterGachaNormalSingle(
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
  // 5. 65次6星概率提升：连续65次未抽6星 → 从第66次（n = 65）起，6星概率 = 0.8% + 5% * (n - 64)
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
export function simulateCharacterGachaNormalToTarget(
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
  let freeGachaUsed = currentDrawCount >= 30; // 如果当前已抽取次数>=30，则免费十连已使用
  let specific6StarCount = currentSpecific6StarCount;
  let rankUpMaterials = Math.floor(currentDrawCount / 240); // 根据当前已抽取次数计算已有突破材料
  const currentSimulationResults: string[] = [];

  while (drawCount <= 1200) {
    // 如果总抽取次数达到30次，则获得当前卡池的免费十连
    if (drawCount >= 30 && !freeGachaUsed) {
      // 30次抽卡获取的免费十连抽使用独立的计数器，不使用、不增加主抽卡流程的保底计数器（no6StarCount、no5Or6StarCount、noSpecific6StarCount）
      let freeNo5Or6StarCount = 0;
      for (let j = 0; j < 10; j++) {
        const freeResult = simulateCharacterGachaNormalSingle(0, freeNo5Or6StarCount, 0, false);

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
      // 跳过后续的保底计数器更新逻辑，确保免费十连不增加主抽卡流程的保底计数
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
      const result = simulateCharacterGachaNormalSingle(
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

  // 计算实际抽数：总长度减去当前卡池的免费十连（如果有的话）
  let actualDraws = currentSimulationResults.length;
  if (currentSimulationResults.length + currentDrawCount > 30 && currentDrawCount < 30) {
    actualDraws -= 10;
  }

  // 上方当前卡池抽取已经结束。现在如果总抽取次数达到60次，则获得下个卡池的免费十连
  if (drawCount >= 60) {
    // 下个卡池继承未抽到6星和5星的计数，但不继承未抽到特定6星的计数。此处简单处理，不考虑下个卡池意外获得当前卡池的角色（不可控）
    let freeNo6StarCount = no6StarCount;
    let freeNo5Or6StarCount = no5Or6StarCount;

    for (let j = 0; j < 10; j++) {
      let freeResult = simulateCharacterGachaNormalSingle(
        freeNo6StarCount,
        freeNo5Or6StarCount,
        0,
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

export const characterSimulateByGachaType: Record<
  GachaType,
  typeof simulateCharacterGachaNormalToTarget
> = {
  normal: simulateCharacterGachaNormalToTarget,
  rerelease: simulateCharacterGachaNormalToTarget,
};

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
export function simulateCharacterGachaNormalToTargetMultipleTimes(
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
    const currentSimulationResult = simulateCharacterGachaNormalToTarget(
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

/**
 * 单次武器抽卡模拟函数（10连）
 * @param totalDrawCount 总抽取次数（用于计算累计抽取次数）
 * @param no6StarWeaponCount 连续未抽到6星武器的次数
 * @param hasObtainedSpecific6StarWeapon 是否已获得特定概率提升的6星武器
 * @returns 抽取的结果字符串数组（每个元素为"6_up", "6_other", "5", "4"）
 */
export function simulateWeaponGachaSingle(
  totalDrawCount: number,
  no6StarWeaponCount: number,
  hasObtainedSpecific6StarWeapon: boolean,
): string[] {
  const results: string[] = [];
  let currentNo6StarCount = 0;
  let currentNoSpecific6StarCount = 0;

  const shouldGuarantee6Star = no6StarWeaponCount >= 3;
  const shouldGuaranteeSpecific6Star = !hasObtainedSpecific6StarWeapon && totalDrawCount >= 7;

  for (let i = 0; i < 10; i++) {
    let p6 = 0.04;
    let p5 = 0.15;

    if (i === 9) {
      let has5OrAbove = false;
      let has6Star = false;
      let hasSpecific6Star = false;

      for (let j = 0; j < 9; j++) {
        const r = results[j];
        if (r === '5' || r === '6_up' || r === '6_other') {
          has5OrAbove = true;
        }
        if (r === '6_up' || r === '6_other') {
          has6Star = true;
        }
        if (r === '6_up') {
          hasSpecific6Star = true;
        }
      }

      if (!has5OrAbove) {
        p5 = 1.0;
      }

      if (shouldGuarantee6Star && !has6Star) {
        p6 = 1.0;
        p5 = 0.0;
      }

      if (shouldGuaranteeSpecific6Star && !hasSpecific6Star) {
        p6 = 1.0;
        p5 = 0.0;
      }
    }

    const rand = Math.random();
    let result: string;

    if (rand < p6) {
      let isSpecific = false;

      if (shouldGuaranteeSpecific6Star && i === 9) {
        let hasSpecific6Star = false;
        for (let j = 0; j < 9; j++) {
          if (results[j] === '6_up') {
            hasSpecific6Star = true;
            break;
          }
        }
        if (!hasSpecific6Star) {
          isSpecific = true;
        } else {
          isSpecific = Math.random() < 0.25;
        }
      } else {
        isSpecific = Math.random() < 0.25;
      }

      result = isSpecific ? '6_up' : '6_other';
    } else if (rand < p6 + p5) {
      result = '5';
    } else {
      result = '4';
    }

    results.push(result);

    if (result === '6_up' || result === '6_other') {
      currentNo6StarCount = 0;
    } else {
      currentNo6StarCount++;
    }

    if (result === '6_up') {
      currentNoSpecific6StarCount = 0;
    } else {
      currentNoSpecific6StarCount++;
    }
  }

  return results;
}

/**
 * 模拟一次完整的武器抽卡过程，直到达到目标突破等级
 * @param targetRank 目标突破等级，默认0
 * @returns 返回本次模拟的所有抽取结果的字符串列表
 */
export function simulateWeaponGachaToTarget(targetRank: number = 0): string[] {
  let totalDrawCount = 0;
  let no6StarWeaponCount = 0;
  let specific6StarWeaponCount = 0;
  const currentSimulationResults: string[] = [];

  while (totalDrawCount <= 100) {
    if (specific6StarWeaponCount >= 1 + targetRank) {
      break;
    }

    const results = simulateWeaponGachaSingle(
      totalDrawCount,
      no6StarWeaponCount,
      specific6StarWeaponCount > 0,
    );

    currentSimulationResults.push(...results);
    totalDrawCount++;

    if (totalDrawCount >= 18 && totalDrawCount % 16 === 2) {
      specific6StarWeaponCount++;
    }

    let has6Star = false;
    let hasSpecific6Star = false;

    for (const result of results) {
      if (result === '6_up' || result === '6_other') {
        has6Star = true;
        if (result === '6_up') {
          hasSpecific6Star = true;
          specific6StarWeaponCount++;
        }
      }
    }

    if (has6Star) {
      no6StarWeaponCount = 0;
    } else {
      no6StarWeaponCount++;
    }
  }

  return currentSimulationResults;
}

/**
 * 模拟多次武器抽卡过程
 * @param simulationCount 模拟次数，默认10000
 * @param targetRank 目标突破等级，默认0
 * @returns 返回一个列表，每个元素是一次模拟的所有抽取结果的字符串列表
 */
export function simulateWeaponGachaToTargetMultipleTimes(
  simulationCount: number = 10000,
  targetRank: number = 0,
): string[][] {
  const allSimulationResults: string[][] = [];

  for (let i = 0; i < simulationCount; i++) {
    const currentSimulationResult = simulateWeaponGachaToTarget(targetRank);
    allSimulationResults.push(currentSimulationResult);
  }

  return allSimulationResults;
}

/**
 * 根据抽取结果列表计算可获得的配额数量
 * @param results 抽取结果列表
 * @returns 返回配额总数
 */
export function calculateWeaponTokens(results: string[]): number {
  let tokenCount = 0;

  for (const result of results) {
    switch (result) {
      case '6_up':
      case '6_other':
        tokenCount += 2000;
        break;
      case '5':
        tokenCount += 200;
        break;
      case '4':
        tokenCount += 20;
        break;
    }
  }

  return tokenCount;
}

/**
 * 计算中位数（会原地排序传入的数组）
 * @param drawsList 抽取次数列表
 * @returns 中位数
 */
export function calculateMedian(drawsList: number[]): number {
  drawsList.sort((a, b) => a - b);
  const mid = Math.floor(drawsList.length / 2);
  return drawsList.length % 2 !== 0
    ? drawsList[mid]!
    : Math.round((drawsList[mid - 1]! + drawsList[mid]!) / 2);
}

/**
 * 将聚合数据转换为ECharts可用的格式（角色）
 * @param countMap 抽取次数到模拟次数的映射
 * @param tokenSumMap 抽取次数到配额总和的映射
 * @param gachaStrategy 抽卡策略
 * @returns 包含概率密度、互补累计分布和平均配额的数据对象
 */
export function processDataForCharacterChart(
  countMap: Map<number, number>,
  tokenSumMap: Map<number, number>,
  gachaStrategy: GachaStrategy,
): any {
  const totalSimulations = Array.from(countMap.values()).reduce((sum, count) => sum + count, 0);

  let uniqueDraws: number[];
  if (gachaStrategy === 'batch') {
    uniqueDraws = Array.from(countMap.keys()).sort((a, b) => a - b);
  } else {
    const maxDraws = Math.max(...Array.from(countMap.keys()));
    uniqueDraws = Array.from({ length: maxDraws }, (_, i) => i + 1);

    for (const draws of uniqueDraws) {
      if (!countMap.has(draws)) {
        countMap.set(draws, 0);
        tokenSumMap.set(draws, 0);
      }
    }
  }

  const pdfData = uniqueDraws
    .filter((draws) => countMap.has(draws))
    .map((draws) => [draws, ((countMap.get(draws) || 0) / totalSimulations) * 100]);

  let remainingCount = totalSimulations;

  const ccdfData = uniqueDraws
    .filter((draws) => countMap.has(draws))
    .map((draws) => {
      remainingCount -= countMap.get(draws) || 0;
      const probability = (remainingCount / totalSimulations) * 100;
      return [draws, probability];
    });

  const avgTokenData = uniqueDraws
    .filter((draws) => countMap.has(draws))
    .map((draws) => {
      const totalCount = countMap.get(draws) || 0;
      const totalTokens = tokenSumMap.get(draws) || 0;
      const avgTokens = totalCount > 0 ? Math.round(totalTokens / totalCount) : 0;
      return [draws, avgTokens];
    })
    .filter(([, tokens]) => {
      return tokens && tokens > 0;
    });

  let jadePerTokenData: [number, number][] = [];

  jadePerTokenData = uniqueDraws
    .filter((draws) => countMap.has(draws) && tokenSumMap.get(draws)! > 0)
    .map((draws) => {
      const totalCount = countMap.get(draws) || 0;
      const totalTokens = tokenSumMap.get(draws) || 0;
      const avgTokens = totalCount > 0 ? totalTokens / totalCount : 0;

      const totalJadeConsumed = draws * 500;
      const avgJadePerToken = avgTokens > 0 ? totalJadeConsumed / avgTokens : 0;

      return [draws, avgJadePerToken];
    });

  return {
    pdfData,
    ccdfData,
    avgTokenData,
    jadePerTokenData,
  };
}

/**
 * 将聚合数据转换为ECharts可用的格式（武器）
 * @param countMap 十连次数到模拟次数的映射
 * @returns 包含概率密度、互补累计分布的数据对象
 */
export function processDataForWeaponChart(countMap: Map<number, number>): any {
  const totalSimulations = Array.from(countMap.values()).reduce((sum, count) => sum + count, 0);

  const uniqueTenPulls = Array.from(countMap.keys()).sort((a, b) => a - b);

  const pdfData = uniqueTenPulls.map((tenPulls) => [
    tenPulls,
    ((countMap.get(tenPulls) || 0) / totalSimulations) * 100,
  ]);

  let remainingCount = totalSimulations;

  const ccdfData = uniqueTenPulls.map((tenPulls) => {
    remainingCount -= countMap.get(tenPulls) || 0;
    const probability = (remainingCount / totalSimulations) * 100;
    return [tenPulls, probability];
  });

  return {
    pdfData,
    ccdfData,
  };
}
