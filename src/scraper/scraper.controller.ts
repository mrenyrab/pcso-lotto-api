import { BadRequestException, Controller, Post, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service.js';
import { BackfillQueryDto } from './dto/backfill-query.dto.js';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('backfill')
  async runBackfill(@Query() params: BackfillQueryDto) {
    if (params.day !== undefined) {
      if (params.month === undefined && params.year === undefined) {
        throw new BadRequestException(
          'Month and year are required when day is provided.',
        );
      }

      if (params.month === undefined) {
        throw new BadRequestException('Day requires both month and year.');
      }

      if (params.year === undefined) {
        throw new BadRequestException(
          'Year is required when day and month are provided.',
        );
      }

      return this.scraperService.runBackfillDayMonthYear(
        params.day,
        params.month,
        params.year,
      );
    }

    if (params.month !== undefined) {
      if (params.year === undefined) {
        throw new BadRequestException('Year is required when month is provided.');
      }

      return this.scraperService.runBackfillMonthYear(
        params.month,
        params.year,
      );
    }

    if (params.year === undefined) {
      throw new BadRequestException('Year is required.');
    }

    return this.scraperService.backfillYear(params.year);
  }

  @Post('run')
  async triggerDailySync() {
    await this.scraperService.handleDailyScrape();
    return { message: 'Sync triggered successfully.' };
  }
}
