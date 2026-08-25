import { describe, it, expect } from 'vitest';

import benchmark from './EndfieldGachaBenchmark.json';
import {
  simulateCharacterGachaNormalToTarget,
  simulateWeaponGachaToTarget,
  calculateWeaponTokens,
  calculateMedian,
} from './EndfieldGachaUtils';

const SIMULATION_COUNT = 100000;
const TOLERANCE = 0.05;

describe('EndfieldGachaUtils 默认数据基准', () => {
  describe('角色抽取分布模拟（默认参数）', () => {
    it.each([
      { rank: 0, label: '0', baseline: benchmark.character.rank0 },
      { rank: 5, label: '5', baseline: benchmark.character.rank5 },
    ])(
      'targetRank=$label 的平均抽取次数、中位数、平均获得配额与基准误差 < 5%',
      ({ rank, baseline }) => {
        const pullsList: number[] = [];
        let totalTokens = 0;
        for (let i = 0; i < SIMULATION_COUNT; i++) {
          const simulation = simulateCharacterGachaNormalToTarget(
            0, // initialNoSpecific6StarPulls
            0, // initialNo6StarPulls
            0, // initialNo5Or6StarPulls
            rank, // targetRank
            'single', // gachaStrategy
            0, // currentSpecific6StarCount
            0, // currentPulls
            false, // hasUsedSpecific6StarGuarantee
          );
          pullsList.push(simulation.actualPulls);
          totalTokens += calculateWeaponTokens(simulation.result);
        }

        const averagePulls = pullsList.reduce((sum, pulls) => sum + pulls, 0) / pullsList.length;

        pullsList.sort((a, b) => a - b);
        const mid = Math.floor(pullsList.length / 2);
        const medianPulls =
          pullsList.length % 2 !== 0
            ? pullsList[mid]!
            : Math.round((pullsList[mid - 1]! + pullsList[mid]!) / 2);

        const averageTokens = totalTokens / pullsList.length;

        expect(Math.abs(averagePulls - baseline.averageDraws) / baseline.averageDraws).toBeLessThan(
          TOLERANCE,
        );
        expect(Math.abs(medianPulls - baseline.medianDraws) / baseline.medianDraws).toBeLessThan(
          TOLERANCE,
        );
        expect(
          Math.abs(averageTokens - baseline.averageTokens) / baseline.averageTokens,
        ).toBeLessThan(TOLERANCE);
      },
      120000,
    );
  });

  describe('武器抽取分布模拟（默认参数）', () => {
    it.each([
      { rank: 0, label: '0', baseline: benchmark.weapon.rank0 },
      { rank: 5, label: '5', baseline: benchmark.weapon.rank5 },
    ])(
      'targetRank=$label 的平均抽取次数（十连）、中位数、平均消耗配额与基准误差 < 5%',
      ({ rank, baseline }) => {
        const tenPullList: number[] = [];
        let totalTenPulls = 0;
        for (let i = 0; i < SIMULATION_COUNT; i++) {
          const tenPullCount = Math.ceil(simulateWeaponGachaToTarget(rank).length / 10);
          tenPullList.push(tenPullCount);
          totalTenPulls += tenPullCount;
        }

        const averageTenPulls = totalTenPulls / SIMULATION_COUNT;
        const medianTenPulls = calculateMedian(tenPullList);
        const averageTokens = averageTenPulls * 1980;

        expect(
          Math.abs(averageTenPulls - baseline.averageTenPulls) / baseline.averageTenPulls,
        ).toBeLessThan(TOLERANCE);
        expect(
          Math.abs(medianTenPulls - baseline.medianTenPulls) / baseline.medianTenPulls,
        ).toBeLessThan(TOLERANCE);
        expect(
          Math.abs(averageTokens - baseline.averageTokens) / baseline.averageTokens,
        ).toBeLessThan(TOLERANCE);
      },
      120000,
    );
  });
});
