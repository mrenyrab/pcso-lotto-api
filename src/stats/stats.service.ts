import { BadRequestException, Injectable } from '@nestjs/common';
import { StatsRepository } from './stats.repository.js';
import { GAME_CONFIGS } from '../contants/game.constants.js';

@Injectable()
export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getFrequency(gameName: string, limit: number = 10, months?: number) {
    return this.statsRepository.getFrequency(gameName, limit, months);
  }

  async getOverdueNumbers(gameName: string, limit: number = 10) {
    return this.statsRepository.getOverdueNumbers(gameName, limit);
  }

  async getOddEvenDistribution(gameName: string, from?: Date, to?: Date) {
    return this.statsRepository.getOddEvenDistribution(gameName, from, to);
  }

  async getNumberPairs(
    gameName: string,
    limit: number = 15,
    from?: Date,
    to?: Date,
  ) {
    return this.statsRepository.getNumberPairs(gameName, limit, from, to);
  }

  async getSumDistribution(gameName: string, from?: Date, to?: Date) {
    return this.statsRepository.getSumDistribution(gameName, from, to);
  }

  async getBallCompanions(
    gameName: string,
    targetBall: number,
    limit: number = 10,
    from?: Date,
    to?: Date,
  ) {
    return this.statsRepository.getBallCompanions(
      gameName,
      targetBall,
      limit,
      from,
      to,
    );
  }

  /**
   * Generates a basic uniform random Quick Pick
   */
  generateQuickPick(gameKey: string): number[] {
    const config = GAME_CONFIGS[gameKey];
    if (!config) {
      throw new BadRequestException(
        `Unsupported game: ${gameKey}. Use 6/58, 6/55, 6/49, 6/45, or 6/42.`,
      );
    }

    const pool = Array.from({ length: config.totalBalls }, (_, i) => i + 1);
    const result: number[] = [];

    while (result.length < config.pickCount) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }

    return result.sort((a, b) => a - b);
  }

  /**
   * Generates combinations filtered by Parity, Sum Range, and Hot/Cold balance
   */
  async generateSmartPicks(gameKey: string, count: number = 3) {
    const config = GAME_CONFIGS[gameKey];
    if (!config) {
      throw new BadRequestException(
        `Unsupported game: ${gameKey}. Use 6/58, 6/55, 6/49, 6/45, or 6/42.`,
      );
    }

    // Reuse existing getFrequency method
    const freqData = await this.getFrequency(gameKey, 15);
    const hotSet = new Set(freqData.hotNumbers.map((h: any) => h.number));

    const generatedCombinations: Array<{
      numbers: number[];
      sum: number;
      parity: string;
      hotCount: number;
    }> = [];

    let attempts = 0;
    const maxAttempts = 5000;

    while (generatedCombinations.length < count && attempts < maxAttempts) {
      attempts++;
      const pick = this.generateQuickPick(gameKey);

      // 1. Sum Range Constraint (Bell curve sweet spot)
      const sum = pick.reduce((acc, val) => acc + val, 0);
      if (sum < config.minSum || sum > config.maxSum) continue;

      // 2. Parity Constraint (Strictly 2/4, 3/3, or 4/2)
      const oddCount = pick.filter((n) => n % 2 !== 0).length;
      if (!config.validOddCounts.includes(oddCount)) continue;

      // 3. Balance Hot/Cold (Between 1 and 4 hot numbers)
      const hotCount = pick.filter((n) => hotSet.has(n)).length;
      if (hotCount < 1 || hotCount > 4) continue;

      // Prevent duplicate tickets in current batch
      const key = pick.join('-');
      if (generatedCombinations.some((c) => c.numbers.join('-') === key))
        continue;

      generatedCombinations.push({
        numbers: pick,
        sum,
        parity: `${oddCount} Odd / ${config.pickCount - oddCount} Even`,
        hotCount,
      });
    }

    return {
      game: gameKey,
      requested: count,
      combinations: generatedCombinations,
    };
  }
}
