import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from './stats.service.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('frequency/:game')
  async getFrequency(
    @Param('game') game: string,
    @Query('limit') limit?: string,
    @Query('months') months?: string,
  ) {
    return this.statsService.getFrequency(
      game,
      limit ? parseInt(limit, 10) : 10,
      months ? parseInt(months, 10) : undefined,
    );
  }
}
