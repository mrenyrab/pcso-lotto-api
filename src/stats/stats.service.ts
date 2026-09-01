import { Injectable } from '@nestjs/common';
import { StatsRepository } from './stats.repository.js';

@Injectable()
export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getFrequency(gameName: string, limit: number = 10, months?: number) {
    return this.statsRepository.getFrequency(gameName, limit, months);
  }
}
