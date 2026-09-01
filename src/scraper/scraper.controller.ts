import { Controller, Param, Post } from '@nestjs/common';
import { ScraperService } from './scraper.service.js';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('backfill/:month/:year')
  async runBackfillMonthYear(
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.scraperService.runBackfillMonthYear(month, Number(year));
  }

  @Post('backfill-2026')
  async runBackfill() {
    return this.scraperService.backfill2026();
  }

  @Post('sync-today')
  async triggerDailySync() {
    await this.scraperService.handleDailyScrape();
    return { message: 'Sync triggered successfully.' };
  }
}
