import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { LottoService } from './lotto.service.js';
import { ApiResponseDto } from '../common/api-response.dto.js';

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
    description: 'Draws for the requested date. The winners field is omitted.',
    type: ApiResponseDto,
  })
  async getDraw(@Param('date') date: string) {
    return this.lottoService.getDraw(date);
  }
}
