import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service.js';
import { ScraperController } from './scraper.controller.js';
import { LottoModule } from '../lotto/lotto.module.js';
import { CronTokenGuard } from './cron-token.guard.js';

@Module({
  imports: [LottoModule],
  providers: [ScraperService, CronTokenGuard],
  controllers: [ScraperController],
  exports: [ScraperService],
})
export class ScraperModule {}
