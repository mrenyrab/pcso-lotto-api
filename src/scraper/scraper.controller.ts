import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ScraperService } from './scraper.service.js';
import { BackfillQueryDto } from './dto/backfill-query.dto.js';
import { ApiResponseDto } from '../common/api-response.dto.js';
import { CronTokenGuard } from './cron-token.guard.js';

@Controller('scraper')
@ApiTags('Scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('backfill')
  @ApiOperation({ summary: 'Backfill draws by year, month, or day' })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    minimum: 1,
    example: 2026,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    enum: [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ],
  })
  @ApiQuery({
    name: 'day',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 31,
    description: 'Requires both month and year.',
  })
  @ApiCreatedResponse({
    description:
      'Backfill completed; returns counts of saved and modified draws.',
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing required date fields or invalid/future date.',
  })
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
        throw new BadRequestException(
          'Year is required when month is provided.',
        );
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
  @UseGuards(CronTokenGuard)
  @ApiBearerAuth('cron-token')
  @ApiOperation({ summary: 'Trigger a daily PCSO results synchronization' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token.',
  })
  @ApiCreatedResponse({
    description: 'Synchronization completed.',
    type: ApiResponseDto,
  })
  async triggerDailySync() {
    await this.scraperService.handleDailyScrape();
    return { message: 'Sync triggered successfully.' };
  }
}
