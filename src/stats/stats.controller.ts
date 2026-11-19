import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { StatsService } from './stats.service.js';
import {
  isValidLottoGame,
  VALID_LOTTO_GAMES,
} from '../contants/game.constants.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';
import { ApiResponseDto } from '../common/api-response.dto.js';

@Controller('stats')
@ApiTags('Statistics')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('frequency/:game')
  @ApiOperation({ summary: 'Get hot and cold number frequencies' })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    default: 10,
  })
  @ApiQuery({ name: 'months', required: false, type: Number, minimum: 1 })
  @ApiOkResponse({ type: ApiResponseDto })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game or invalid query.',
  })
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
  @ApiOperation({ summary: 'Get the most overdue numbers' })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    default: 10,
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game or invalid query.',
  })
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
  @ApiOperation({ summary: 'Get historical odd/even draw distribution' })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiOkResponse({ type: ApiResponseDto })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game or invalid query.',
  })
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
  @ApiOperation({
    summary: 'Get the most frequently co-occurring number pairs',
  })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    default: 15,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiOkResponse({ type: ApiResponseDto })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game or invalid query.',
  })
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
  @ApiOperation({ summary: 'Get draw sum distribution' })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiOkResponse({ type: ApiResponseDto })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game or invalid query.',
  })
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
  @ApiOperation({
    summary: 'Get numbers most often drawn with a target number',
  })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiParam({ name: 'ball', type: Number, description: 'Target number.' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    default: 10,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiOkResponse({ type: ApiResponseDto })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game or invalid query.',
  })
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
  @ApiOperation({ summary: 'Generate number combinations' })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    default: 3,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['smart', 'random'],
    default: 'smart',
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game or invalid query.',
  })
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
