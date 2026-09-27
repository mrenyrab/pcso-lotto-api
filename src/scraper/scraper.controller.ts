import { Controller, Param, Post } from '@nestjs/common';
import { ScraperService } from './scraper.service.js';
import { BackfillMonthYearDto } from './dto/backfill-month-year.dto.js';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('backfill/:month/:year')
  async runBackfillMonthYear(@Param() params: BackfillMonthYearDto) {
    return this.scraperService.runBackfillMonthYear(params.month, params.year);
  }

  @Post('backfill-2026')
  async runBackfill() {
    return this.scraperService.backfill2026();
  }

  @Post('run')
  async triggerDailySync() {
    await this.scraperService.handleDailyScrape();
    return { message: 'Sync triggered successfully.' };
  }
}
