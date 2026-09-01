import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service.js';
import { ScraperController } from './scraper.controller.js';
import { LottoModule } from '../lotto/lotto.module.js';

@Module({
  imports: [LottoModule],
  providers: [ScraperService],
  controllers: [ScraperController],
  exports: [ScraperService],
})
export class ScraperModule {}
