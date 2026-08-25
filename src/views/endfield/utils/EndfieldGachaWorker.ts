import {
  type GachaStrategy,
  type GachaType,
  characterSimulateByGachaType,
  simulateWeaponGachaToTarget,
  calculateWeaponTokens,
  processDataForCharacterChart,
  processDataForWeaponChart,
} from '../utils/EndfieldGachaUtils';

interface CharacterTaskPayload {
  gachaType: GachaType;
  simulationCount: number;
  initialNoSpecific6StarPulls: number;
  initialNo6StarPulls: number;
  initialNo5Or6StarPulls: number;
  targetRank: number;
  gachaStrategy: GachaStrategy;
  currentSpecific6StarCount: number;
  currentPulls: number;
  hasUsedSpecific6StarGuarantee: boolean;
}

interface WeaponTaskPayload {
  simulationCount: number;
  targetRank: number;
}

export type GachaWorkerRequest =
  | { type: 'character'; payload: CharacterTaskPayload }
  | { type: 'weapon'; payload: WeaponTaskPayload };

export interface CharacterAggregateResult {
  kind: 'character';
  pdfData: [number, number][];
  ccdfData: [number, number][];
  avgTokenData: [number, number][];
  jadePerTokenData: [number, number][];
  averagePulls: number;
  medianPulls: number;
  averageTokens: number;
}

export interface WeaponAggregateResult {
  kind: 'weapon';
  pdfData: [number, number][];
  ccdfData: [number, number][];
  averageTenPulls: number;
  medianTenPulls: number;
  averageTokens: number;
}

export interface CharacterProgressResult extends CharacterAggregateResult {
  completedSimulations: number;
  totalSimulations: number;
}

export interface WeaponProgressResult extends WeaponAggregateResult {
  completedSimulations: number;
  totalSimulations: number;
}

export type GachaWorkerResponse = CharacterProgressResult | WeaponProgressResult;

const SNAPSHOT_INTERVAL = 20000;
const FIRST_SNAPSHOT_THRESHOLD = 100000;

/**
 * 基于累计计数映射计算中位数（与 calculateMedian 规则一致，无需保留全量数组）
 * @param countMap 数值到计数次数的映射
 * @param total 累计总次数
 * @returns 中位数
 */
function calculateMedianFromCountMap(countMap: Map<number, number>, total: number): number {
  const sortedValues = Array.from(countMap.keys()).sort((a, b) => a - b);
  const isEven = total % 2 === 0;
  const lowerIndex = Math.floor((total - 1) / 2);
  const upperIndex = isEven ? lowerIndex + 1 : lowerIndex;

  let cumulative = 0;
  let lowerValue = 0;
  let upperValue = 0;

  for (const value of sortedValues) {
    const count = countMap.get(value) || 0;
    if (cumulative <= lowerIndex && cumulative + count > lowerIndex) {
      lowerValue = value;
    }
    if (cumulative <= upperIndex && cumulative + count > upperIndex) {
      upperValue = value;
      break;
    }
    cumulative += count;
  }

  return isEven ? Math.round((lowerValue + upperValue) / 2) : lowerValue;
}

function buildCharacterResult(
  countMap: Map<number, number>,
  tokenSumMap: Map<number, number>,
  totalPulls: number,
  totalTokens: number,
  completedSimulations: number,
  totalSimulations: number,
  gachaStrategy: GachaStrategy,
): CharacterProgressResult {
  const processedData = processDataForCharacterChart(countMap, tokenSumMap, gachaStrategy);

  return {
    kind: 'character',
    pdfData: processedData.pdfData,
    ccdfData: processedData.ccdfData,
    avgTokenData: processedData.avgTokenData,
    jadePerTokenData: processedData.jadePerTokenData,
    averagePulls: totalPulls / completedSimulations,
    medianPulls: calculateMedianFromCountMap(countMap, completedSimulations),
    averageTokens: totalTokens / completedSimulations,
    completedSimulations,
    totalSimulations,
  };
}

function buildWeaponResult(
  countMap: Map<number, number>,
  totalTenPulls: number,
  completedSimulations: number,
  totalSimulations: number,
): WeaponProgressResult {
  const processedData = processDataForWeaponChart(countMap);
  const averageTenPulls = totalTenPulls / completedSimulations;

  return {
    kind: 'weapon',
    pdfData: processedData.pdfData,
    ccdfData: processedData.ccdfData,
    averageTenPulls,
    medianTenPulls: calculateMedianFromCountMap(countMap, completedSimulations),
    averageTokens: averageTenPulls * 1980,
    completedSimulations,
    totalSimulations,
  };
}

function simulateCharacterAggregated(payload: CharacterTaskPayload): void {
  const countMap = new Map<number, number>();
  const tokenSumMap = new Map<number, number>();
  let totalPulls = 0;
  let totalTokens = 0;
  const simulateCharacterGacha = characterSimulateByGachaType[payload.gachaType];

  for (let i = 0; i < payload.simulationCount; i++) {
    const simulation = simulateCharacterGacha(
      payload.initialNoSpecific6StarPulls,
      payload.initialNo6StarPulls,
      payload.initialNo5Or6StarPulls,
      payload.targetRank,
      payload.gachaStrategy,
      payload.currentSpecific6StarCount,
      payload.currentPulls,
      payload.hasUsedSpecific6StarGuarantee,
    );
    const actualPulls = simulation.actualPulls;
    totalPulls += actualPulls;

    const tokenCount = calculateWeaponTokens(simulation.result);
    totalTokens += tokenCount;

    countMap.set(actualPulls, (countMap.get(actualPulls) || 0) + 1);
    tokenSumMap.set(actualPulls, (tokenSumMap.get(actualPulls) || 0) + tokenCount);

    const completedSimulations = i + 1;
    if (
      completedSimulations === payload.simulationCount ||
      (completedSimulations >= FIRST_SNAPSHOT_THRESHOLD &&
        completedSimulations % SNAPSHOT_INTERVAL === 0)
    ) {
      self.postMessage(
        buildCharacterResult(
          countMap,
          tokenSumMap,
          totalPulls,
          totalTokens,
          completedSimulations,
          payload.simulationCount,
          payload.gachaStrategy,
        ),
      );
    }
  }
}

function simulateWeaponAggregated(payload: WeaponTaskPayload): void {
  const countMap = new Map<number, number>();
  let totalTenPulls = 0;

  for (let i = 0; i < payload.simulationCount; i++) {
    const results = simulateWeaponGachaToTarget(payload.targetRank);
    const tenPullCount = Math.ceil(results.length / 10);
    totalTenPulls += tenPullCount;
    countMap.set(tenPullCount, (countMap.get(tenPullCount) || 0) + 1);

    const completedSimulations = i + 1;
    if (
      completedSimulations === payload.simulationCount ||
      (completedSimulations >= FIRST_SNAPSHOT_THRESHOLD &&
        completedSimulations % SNAPSHOT_INTERVAL === 0)
    ) {
      self.postMessage(
        buildWeaponResult(countMap, totalTenPulls, completedSimulations, payload.simulationCount),
      );
    }
  }
}

self.onmessage = (event: MessageEvent<GachaWorkerRequest>) => {
  const { type, payload } = event.data;

  if (type === 'character') {
    simulateCharacterAggregated(payload);
  } else {
    simulateWeaponAggregated(payload);
  }
};
