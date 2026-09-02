import { Injectable } from '@nestjs/common';
import { StatsRepository } from './stats.repository.js';

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
}
