// EndfieldGachaUtils.ts
export type GachaStrategy = 'single' | 'batch' | 'smart';

export type GachaType = 'normal' | 'rerelease';

export interface GachaSimulationResult {
  result: string[];
  actualPulls: number;
}

/**
 * 单次角色抽卡模拟函数
 * @param no6StarPulls 连续未抽到6星次数
 * @param no5Or6StarPulls 连续未抽到5/6星次数
 * @param noSpecific6StarPulls 连续未抽到特定6星次数
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底
 * @returns 抽取的结果字符串（"6_up", "6_other", "5", "4"）
 */
export function simulateCharacterGachaNormalSingle(
  no6StarPulls: number,
  no5Or6StarPulls: number,
  noSpecific6StarPulls: number,
  hasUsedSpecific6StarGuarantee: boolean,
): string {
  let p6: number, p5: number;

  // 1. 基础概率
  p6 = 0.008;
  p5 = 0.08;

  // 2. 120次特定保底：连续119次未抽特定6星 → 本次（第120次）必定 6星
  // 只有在未使用特定6星保底的情况下才生效
  if (!hasUsedSpecific6StarGuarantee && noSpecific6StarPulls >= 119) {
    p6 = 1.0;
    p5 = 0.0;
  }
  // 3. 80次6星保底：连续79次未抽6星 → 本次（第80次）必定 6星
  else if (no6StarPulls >= 79) {
    p6 = 1.0;
    p5 = 0.0;
  }
  // 5. 65次6星概率提升：连续65次未抽6星 → 从第66次（n = 65）起，6星概率 = 0.8% + 5% * (n - 64)
  else if (no6StarPulls >= 65) {
    p6 = 0.008 + 0.05 * (no6StarPulls - 64); // 6星概率提升对应数值
  }

  // 4. 10次5星保底：连续9次未抽5/6星 → 本次（第10次）必定5星及以上
  if (no5Or6StarPulls >= 9) {
    p5 = 1;
  }

  // 执行抽取
  const rand = Math.random();

  if (rand < p6) {
    // 6星
    let isSpecific = false;
    // 120次保底：连续119次未获特定6星 → 本次（第120次）必定获得
    // 只有在未使用特定6星保底的情况下才生效
    if (!hasUsedSpecific6StarGuarantee && noSpecific6StarPulls >= 119) {
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
 * @param initialNoSpecific6StarPulls 继承的未抽取特定6星次数，默认0
 * @param initialNo6StarPulls 继承的未抽取6星次数，默认0
 * @param initialNo5Or6StarPulls 继承的未抽取5星次数，默认0
 * @param targetRank 目标突破等级，默认0
 * @param gachaStrategy 抽卡策略，默认单抽
 * @param currentSpecific6StarCount 当前已拥有的特定6星数量，默认0
 * @param currentPulls 当前已抽取次数，默认0
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底，默认false
 * @returns 返回本次模拟的所有抽取结果的对象，包含result字段，值为字符串列表，以及actualPulls字段表示实际抽取次数
 */
export function simulateCharacterGachaNormalToTarget(
  initialNoSpecific6StarPulls: number = 0,
  initialNo6StarPulls: number = 0,
  initialNo5Or6StarPulls: number = 0,
  targetRank: number = 0,
  gachaStrategy: GachaStrategy = 'single',
  currentSpecific6StarCount: number = 0,
  currentPulls: number = 0,
  hasUsedSpecific6StarGuarantee: boolean = false,
): GachaSimulationResult {
  let totalPulls = currentPulls;
  let no6StarPulls = initialNo6StarPulls;
  let no5Or6StarPulls = initialNo5Or6StarPulls;
  let noSpecific6StarPulls = initialNoSpecific6StarPulls;
  let freeGachaUsed = currentPulls >= 30; // 如果当前已抽取次数>=30，则免费十连已使用
  let specific6StarCount = currentSpecific6StarCount;
  let rankUpMaterials = Math.floor(currentPulls / 240); // 根据当前已抽取次数计算已有突破材料
  const currentSimulationResults: string[] = [];

  while (totalPulls <= 1200) {
    // 如果总抽取次数达到30次，则获得当前卡池的免费十连
    if (totalPulls >= 30 && !freeGachaUsed) {
      // 30次抽卡获取的免费十连抽使用独立的计数器，不使用、不增加主抽卡流程的保底计数器（no6StarPulls、no5Or6StarPulls、noSpecific6StarPulls）
      let freeNo5Or6StarPulls = 0;
      for (let j = 0; j < 10; j++) {
        const freeResult = simulateCharacterGachaNormalSingle(0, freeNo5Or6StarPulls, 0, false);

        currentSimulationResults.push(freeResult);

        if (freeResult === '6_up') {
          specific6StarCount++;
        } else if (freeResult === '6_other') {
          freeNo5Or6StarPulls = 0;
        } else if (freeResult === '5') {
          freeNo5Or6StarPulls = 0;
        } else {
          freeNo5Or6StarPulls++;
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
        no6StarPulls >= 60 ||
        (!hasUsedSpecific6StarGuarantee && totalPulls >= 110) ||
        totalPulls % 240 >= 230
      ) {
        nextGachaTries = 1;
      } else {
        nextGachaTries = 10;
      }
    }

    for (let i = 0; i < nextGachaTries; i++) {
      const result = simulateCharacterGachaNormalSingle(
        no6StarPulls,
        no5Or6StarPulls,
        noSpecific6StarPulls,
        hasUsedSpecific6StarGuarantee,
      );
      currentSimulationResults.push(result);
      totalPulls += 1;

      if (totalPulls > 0 && totalPulls % 240 === 0) {
        rankUpMaterials++;
      }

      if (result === '6_up') {
        specific6StarCount++;
        hasUsedSpecific6StarGuarantee = true;
        noSpecific6StarPulls = 0;
        no6StarPulls = 0;
        no5Or6StarPulls = 0;
      } else if (result === '6_other') {
        noSpecific6StarPulls++;
        no6StarPulls = 0;
        no5Or6StarPulls = 0;
      } else if (result === '5') {
        noSpecific6StarPulls++;
        no6StarPulls++;
        no5Or6StarPulls = 0;
      } else {
        noSpecific6StarPulls++;
        no6StarPulls++;
        no5Or6StarPulls++;
      }
    }
  }

  // 计算实际抽数：总长度减去当前卡池的免费十连（如果有的话）
  let actualPulls = currentSimulationResults.length;
  if (currentSimulationResults.length + currentPulls > 30 && currentPulls < 30) {
    actualPulls -= 10;
  }

  // 上方当前卡池抽取已经结束。现在如果卡池总抽取次数达到60次，则获得下个卡池的免费十连
  if (totalPulls >= 60) {
    // 下个卡池继承未抽到6星和5星的计数，但不继承未抽到特定6星的计数。此处简单处理，不考虑下个卡池意外获得当前卡池的角色（不可控）
    let nextGachaNo6StarPulls = no6StarPulls;
    let nextGachaNo5Or6StarPulls = no5Or6StarPulls;
    let nextGachaNoSpecific6StarPulls = 0;
    let nextGachaHasUsedSpecific6StarGuarantee = false;

    for (let j = 0; j < 10; j++) {
      let nextGachaResult = simulateCharacterGachaNormalSingle(
        nextGachaNo6StarPulls,
        nextGachaNo5Or6StarPulls,
        nextGachaNoSpecific6StarPulls,
        nextGachaHasUsedSpecific6StarGuarantee,
      );

      currentSimulationResults.push(nextGachaResult);

      // 更新计数器
      if (nextGachaResult === '6_up') {
        nextGachaResult = '6_other'; // 下个卡池的特定角色，简单处理
        nextGachaHasUsedSpecific6StarGuarantee = true;
        nextGachaNoSpecific6StarPulls = 0;
        nextGachaNo6StarPulls = 0;
        nextGachaNo5Or6StarPulls = 0;
      } else if (nextGachaResult === '6_other') {
        nextGachaNoSpecific6StarPulls++;
        nextGachaNo6StarPulls = 0;
        nextGachaNo5Or6StarPulls = 0;
      } else if (nextGachaResult === '5') {
        nextGachaNoSpecific6StarPulls++;
        nextGachaNo6StarPulls++;
        nextGachaNo5Or6StarPulls = 0;
      } else {
        nextGachaNoSpecific6StarPulls++;
        nextGachaNo6StarPulls++;
        nextGachaNo5Or6StarPulls++;
      }
    }
  }

  return { result: currentSimulationResults, actualPulls };
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
 * @param initialNoSpecific6StarPulls 继承的未抽取特定6星次数，默认0
 * @param initialNo6StarPulls 继承的未抽取6星次数，默认0
 * @param initialNo5Or6StarPulls 继承的未抽取5星次数，默认0
 * @param targetRank 目标突破等级，默认0
 * @param gachaStrategy 抽卡策略，默认单抽
 * @param currentSpecific6StarCount 当前已拥有的特定6星数量，默认0
 * @param currentPulls 当前已抽取次数，默认0
 * @param hasUsedSpecific6StarGuarantee 是否已使用特定6星保底，默认false
 * @returns 返回一个列表，每个元素是一次模拟的所有抽取结果的对象，包含result字段，值为字符串列表，以及actualPulls字段表示实际抽取次数
 */
export function simulateCharacterGachaNormalToTargetMultipleTimes(
  simulationCount: number = 10000,
  initialNoSpecific6StarPulls: number = 0,
  initialNo6StarPulls: number = 0,
  initialNo5Or6StarPulls: number = 0,
  targetRank: number = 0,
  gachaStrategy: GachaStrategy = 'single',
  currentSpecific6StarCount: number = 0,
  currentPulls: number = 0,
  hasUsedSpecific6StarGuarantee: boolean = false,
): GachaSimulationResult[] {
  const allSimulationResults: GachaSimulationResult[] = [];

  if (hasUsedSpecific6StarGuarantee && currentSpecific6StarCount <= 1) {
    currentSpecific6StarCount = 1;
  }

  for (let i = 0; i < simulationCount; i++) {
    const currentSimulationResult = simulateCharacterGachaNormalToTarget(
      initialNoSpecific6StarPulls,
      initialNo6StarPulls,
      initialNo5Or6StarPulls,
      targetRank,
      gachaStrategy,
      currentSpecific6StarCount,
      currentPulls,
      hasUsedSpecific6StarGuarantee,
    );
    allSimulationResults.push(currentSimulationResult);
  }

  return allSimulationResults;
}

/**
 * 单次武器抽卡模拟函数（10连）
 * @param totalTenPulls 已完成的十连轮数（用于判断特定6星武器的累计保底）
 * @param no6StarWeaponTenPulls 连续未出6星武器的十连轮数
 * @param hasObtainedSpecific6StarWeapon 是否已获得特定概率提升的6星武器
 * @returns 抽取的结果字符串数组（每个元素为"6_up", "6_other", "5", "4"）
 */
export function simulateWeaponGachaSingle(
  totalTenPulls: number,
  no6StarWeaponTenPulls: number,
  hasObtainedSpecific6StarWeapon: boolean,
): string[] {
  const results: string[] = [];
  let currentNo6StarPulls = 0;
  let currentNoSpecific6StarPulls = 0;

  const shouldGuarantee6Star = no6StarWeaponTenPulls >= 3;
  const shouldGuaranteeSpecific6Star = !hasObtainedSpecific6StarWeapon && totalTenPulls >= 7;

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
      currentNo6StarPulls = 0;
    } else {
      currentNo6StarPulls++;
    }

    if (result === '6_up') {
      currentNoSpecific6StarPulls = 0;
    } else {
      currentNoSpecific6StarPulls++;
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
  let totalTenPulls = 0;
  let no6StarWeaponTenPulls = 0;
  let specific6StarWeaponCount = 0;
  const currentSimulationResults: string[] = [];

  while (totalTenPulls <= 100) {
    if (specific6StarWeaponCount >= 1 + targetRank) {
      break;
    }

    const results = simulateWeaponGachaSingle(
      totalTenPulls,
      no6StarWeaponTenPulls,
      specific6StarWeaponCount > 0,
    );

    currentSimulationResults.push(...results);
    totalTenPulls++;

    if (totalTenPulls >= 18 && totalTenPulls % 16 === 2) {
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
      no6StarWeaponTenPulls = 0;
    } else {
      no6StarWeaponTenPulls++;
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
 * @param pullsList 抽取次数列表
 * @returns 中位数
 */
export function calculateMedian(pullsList: number[]): number {
  pullsList.sort((a, b) => a - b);
  const mid = Math.floor(pullsList.length / 2);
  return pullsList.length % 2 !== 0
    ? pullsList[mid]!
    : Math.round((pullsList[mid - 1]! + pullsList[mid]!) / 2);
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

  let uniquePulls: number[];
  if (gachaStrategy === 'batch') {
    uniquePulls = Array.from(countMap.keys()).sort((a, b) => a - b);
  } else {
    const maxPulls = Math.max(...Array.from(countMap.keys()));
    uniquePulls = Array.from({ length: maxPulls }, (_, i) => i + 1);

    for (const pulls of uniquePulls) {
      if (!countMap.has(pulls)) {
        countMap.set(pulls, 0);
        tokenSumMap.set(pulls, 0);
      }
    }
  }

  const pdfData = uniquePulls
    .filter((pulls) => countMap.has(pulls))
    .map((pulls) => [pulls, ((countMap.get(pulls) || 0) / totalSimulations) * 100]);

  let remainingCount = totalSimulations;

  const ccdfData = uniquePulls
    .filter((pulls) => countMap.has(pulls))
    .map((pulls) => {
      remainingCount -= countMap.get(pulls) || 0;
      const probability = (remainingCount / totalSimulations) * 100;
      return [pulls, probability];
    });

  const avgTokenData = uniquePulls
    .filter((pulls) => countMap.has(pulls))
    .map((pulls) => {
      const totalCount = countMap.get(pulls) || 0;
      const totalTokens = tokenSumMap.get(pulls) || 0;
      const avgTokens = totalCount > 0 ? Math.round(totalTokens / totalCount) : 0;
      return [pulls, avgTokens];
    })
    .filter(([, tokens]) => {
      return tokens && tokens > 0;
    });

  let jadePerTokenData: [number, number][] = [];

  jadePerTokenData = uniquePulls
    .filter((pulls) => countMap.has(pulls) && tokenSumMap.get(pulls)! > 0)
    .map((pulls) => {
      const totalCount = countMap.get(pulls) || 0;
      const totalTokens = tokenSumMap.get(pulls) || 0;
      const avgTokens = totalCount > 0 ? totalTokens / totalCount : 0;

      const totalJadeConsumed = pulls * 500;
      const avgJadePerToken = avgTokens > 0 ? totalJadeConsumed / avgTokens : 0;

      return [pulls, avgJadePerToken];
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
