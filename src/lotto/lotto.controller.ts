import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LottoService } from './lotto.service.js';
import { ApiResponseDto } from '../common/api-response.dto.js';
import {
  isValidLottoGame,
  VALID_LOTTO_GAMES,
} from '../contants/game.constants.js';
import { DrawRangeQueryDto } from './dto/draw-range-query.dto.js';

@Controller('lotto')
@ApiTags('Lotto')
export class LottoController {
  constructor(private readonly lottoService: LottoService) {}

  @Get('draw-date/:date')
  @ApiOperation({ summary: 'Get lotto draws for a date' })
  @ApiParam({
    name: 'date',
    description: 'Draw date in YYYY-MM-DD format',
    example: '2026-11-19',
  })
  @ApiOkResponse({
    description: 'Draws for the requested date, including winner counts.',
    type: ApiResponseDto,
  })
  async getDraw(@Param('date') date: string) {
    return this.lottoService.getDraw(date);
  }

  @Get('draws/:game')
  @ApiOperation({ summary: 'Get lotto draws for a game and date range' })
  @ApiParam({
    name: 'game',
    enum: VALID_LOTTO_GAMES,
    description: 'URL-encode the slash in the game value, for example 6%2F58.',
  })
  @ApiQuery({
    name: 'from',
    required: true,
    type: String,
    format: 'date',
    example: '2026-11-01',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    type: String,
    format: 'date',
    example: '2026-11-19',
  })
  @ApiOkResponse({
    description: 'Matching draws in the inclusive date range, newest first.',
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Unsupported lotto game, invalid date, or reversed date range.',
  })
  async getDrawsForRange(
    @Param('game') game: string,
    @Query() query: DrawRangeQueryDto,
  ) {
    if (!isValidLottoGame(game)) {
      throw new BadRequestException(
        `Invalid game: ${game}. Supported games are: ${VALID_LOTTO_GAMES.join(', ')}.`,
      );
    }

    if (query.from > query.to) {
      throw new BadRequestException(
        'From date must be on or before the to date.',
      );
    }

    return this.lottoService.getDrawsForRange(game, query.from, query.to);
  }
}
