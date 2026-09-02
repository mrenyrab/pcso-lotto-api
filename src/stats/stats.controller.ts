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

  @Get('overdue/:game')
  async getOverdueNumbers(
    @Param('game') game: string,
    @Query('limit') limit?: string,
  ) {
    return this.statsService.getOverdueNumbers(
      game,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('odd-even/:game')
  async getOddEven(
    @Param('game') game: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.statsService.getOddEvenDistribution(game, fromDate, toDate);
  }

  @Get('pairs/:game')
  async getPairs(
    @Param('game') game: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statsService.getNumberPairs(
      game,
      limit ? parseInt(limit, 10) : 15,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('sum-distribution/:game')
  async getSumDistribution(
    @Param('game') game: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statsService.getSumDistribution(
      game,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('companions/:game/:ball')
  async getCompanions(
    @Param('game') game: string,
    @Param('ball') ball: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statsService.getBallCompanions(
      game,
      parseInt(ball, 10),
      limit ? parseInt(limit, 10) : 10,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
