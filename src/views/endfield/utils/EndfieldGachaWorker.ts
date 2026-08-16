import {
  type GachaStrategy,
  simulateCharacterGachaToTarget,
  simulateWeaponGachaToTarget,
  calculateWeaponTokens,
  processDataForCharacterChart,
  processDataForWeaponChart,
  calculateMedian,
} from '../utils/EndfieldGachaUtils';

interface CharacterTaskPayload {
  simulationCount: number;
  initialNoSpecific6StarCount: number;
  initialNo6StarCount: number;
  initialNo5Or6StarCount: number;
  targetRank: number;
  gachaStrategy: GachaStrategy;
  currentSpecific6StarCount: number;
  currentDrawCount: number;
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
  averageDraws: number;
  medianDraws: number;
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

function simulateCharacterAggregated(payload: CharacterTaskPayload): CharacterAggregateResult {
  const countMap = new Map<number, number>();
  const tokenSumMap = new Map<number, number>();
  const drawsList: number[] = Array.from({ length: payload.simulationCount });
  let totalDraws = 0;
  let totalTokens = 0;

  for (let i = 0; i < payload.simulationCount; i++) {
    const simulation = simulateCharacterGachaToTarget(
      payload.initialNoSpecific6StarCount,
      payload.initialNo6StarCount,
      payload.initialNo5Or6StarCount,
      payload.targetRank,
      payload.gachaStrategy,
      payload.currentSpecific6StarCount,
      payload.currentDrawCount,
      payload.hasUsedSpecific6StarGuarantee,
    );
    const actualDraws = simulation.actualDraws;
    drawsList[i] = actualDraws;
    totalDraws += actualDraws;

    const tokenCount = calculateWeaponTokens(simulation.result);
    totalTokens += tokenCount;

    countMap.set(actualDraws, (countMap.get(actualDraws) || 0) + 1);
    tokenSumMap.set(actualDraws, (tokenSumMap.get(actualDraws) || 0) + tokenCount);
  }

  const processedData = processDataForCharacterChart(countMap, tokenSumMap, payload.gachaStrategy);

  return {
    kind: 'character',
    pdfData: processedData.pdfData,
    ccdfData: processedData.ccdfData,
    avgTokenData: processedData.avgTokenData,
    jadePerTokenData: processedData.jadePerTokenData,
    averageDraws: totalDraws / payload.simulationCount,
    medianDraws: calculateMedian(drawsList),
    averageTokens: totalTokens / payload.simulationCount,
  };
}

function simulateWeaponAggregated(payload: WeaponTaskPayload): WeaponAggregateResult {
  const countMap = new Map<number, number>();
  const tenPullList: number[] = Array.from({ length: payload.simulationCount });
  let totalTenPulls = 0;

  for (let i = 0; i < payload.simulationCount; i++) {
    const results = simulateWeaponGachaToTarget(payload.targetRank);
    const tenPullCount = Math.ceil(results.length / 10);
    tenPullList[i] = tenPullCount;
    totalTenPulls += tenPullCount;
    countMap.set(tenPullCount, (countMap.get(tenPullCount) || 0) + 1);
  }

  const processedData = processDataForWeaponChart(countMap);
  const averageTenPulls = totalTenPulls / payload.simulationCount;

  return {
    kind: 'weapon',
    pdfData: processedData.pdfData,
    ccdfData: processedData.ccdfData,
    averageTenPulls,
    medianTenPulls: calculateMedian(tenPullList),
    averageTokens: averageTenPulls * 1980,
  };
}

self.onmessage = (event: MessageEvent<GachaWorkerRequest>) => {
  const { type, payload } = event.data;

  if (type === 'character') {
    self.postMessage(simulateCharacterAggregated(payload));
  } else {
    self.postMessage(simulateWeaponAggregated(payload));
  }
};
