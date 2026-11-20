import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CronTokenGuard } from './cron-token.guard.js';
import { ScraperController } from './scraper.controller.js';
import { ScraperService } from './scraper.service.js';

describe('ScraperController trigger authentication', () => {
  let app: INestApplication<App>;
  const scraperService = {
    handleDailyScrape: vi.fn(),
    runBackfillDayMonthYear: vi.fn(),
    runBackfillMonthYear: vi.fn(),
    backfillYear: vi.fn(),
  };
  const originalToken = process.env.CRON_TRIGGER_TOKEN;

  beforeEach(async () => {
    process.env.CRON_TRIGGER_TOKEN = 'test-secret-token';
    vi.clearAllMocks();

    const moduleFixture = await Test.createTestingModule({
      controllers: [ScraperController],
      providers: [
        CronTokenGuard,
        { provide: ScraperService, useValue: scraperService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    if (originalToken === undefined) {
      delete process.env.CRON_TRIGGER_TOKEN;
    } else {
      process.env.CRON_TRIGGER_TOKEN = originalToken;
    }
  });

  it('rejects requests without a bearer token', async () => {
    await request(app.getHttpServer()).post('/scraper/run').expect(401);
    expect(scraperService.handleDailyScrape).not.toHaveBeenCalled();
  });

  it('rejects an incorrect bearer token', async () => {
    await request(app.getHttpServer())
      .post('/scraper/run')
      .set('Authorization', 'Bearer wrong-token')
      .expect(401);
    expect(scraperService.handleDailyScrape).not.toHaveBeenCalled();
  });

  it('fails explicitly when the server token is not configured', async () => {
    delete process.env.CRON_TRIGGER_TOKEN;
    await request(app.getHttpServer())
      .post('/scraper/run')
      .set('Authorization', 'Bearer test-secret-token')
      .expect(500);
    expect(scraperService.handleDailyScrape).not.toHaveBeenCalled();
    process.env.CRON_TRIGGER_TOKEN = 'test-secret-token';
  });

  it('runs the sync with the configured bearer token', async () => {
    await request(app.getHttpServer())
      .post('/scraper/run')
      .set('Authorization', 'Bearer test-secret-token')
      .expect(201);
    expect(scraperService.handleDailyScrape).toHaveBeenCalledOnce();
  });
});
