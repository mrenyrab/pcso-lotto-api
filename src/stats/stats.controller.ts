import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { isValidLottoGame } from '../contants/game.constants.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('frequency/:game')
  async getFrequency(
    @Param('game') game: string,
    @Query() query: StatsQueryDto,
  ) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.`,
      );
    }

    return this.statsService.getFrequency(
      game,
      query.limit ?? 10,
      query.months,
    );
  }

  @Get('overdue/:game')
  async getOverdueNumbers(
    @Param('game') game: string,
    @Query() query: StatsQueryDto,
  ) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.`,
      );
    }

    return this.statsService.getOverdueNumbers(game, query.limit ?? 10);
  }

  @Get('odd-even/:game')
  async getOddEven(@Param('game') game: string, @Query() query: StatsQueryDto) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.`,
      );
    }

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    return this.statsService.getOddEvenDistribution(game, fromDate, toDate);
  }

  @Get('pairs/:game')
  async getPairs(@Param('game') game: string, @Query() query: StatsQueryDto) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.`,
      );
    }

    return this.statsService.getNumberPairs(
      game,
      query.limit ?? 15,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  @Get('sum-distribution/:game')
  async getSumDistribution(
    @Param('game') game: string,
    @Query() query: StatsQueryDto,
  ) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.`,
      );
    }

    return this.statsService.getSumDistribution(
      game,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  @Get('companions/:game/:ball')
  async getCompanions(
    @Param('game') game: string,
    @Param('ball') ball: string,
    @Query() query: StatsQueryDto,
  ) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.`,
      );
    }

    return this.statsService.getBallCompanions(
      game,
      parseInt(ball, 10),
      query.limit ?? 10,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  @Get('generate/:game')
  async generateNumbers(
    @Param('game') game: string,
    @Query() query: StatsQueryDto,
  ) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.`,
      );
    }

    const totalPicks = query.limit ?? 3;

    if (query.type === 'random') {
      return {
        game,
        combinations: Array.from({ length: totalPicks }, () =>
          this.statsService.generateQuickPick(game),
        ),
      };
    }

    return this.statsService.generateSmartPicks(game, totalPicks);
  }
}
