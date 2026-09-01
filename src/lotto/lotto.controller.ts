import { Controller, Get, Param } from '@nestjs/common';
import { LottoService } from './lotto.service.js';

@Controller('lotto')
export class LottoController {
  constructor(private readonly lottoService: LottoService) {}

  @Get('draw-date/:date')
  async getDraw(@Param('date') date: string) {
    return this.lottoService.getDraw(date);
  }
}
