import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { LottoController } from './lotto.controller.js';
import { LottoService } from './lotto.service.js';

describe('LottoController range results', () => {
  let app: INestApplication<App>;
  const lottoService = {
    getDraw: vi.fn(),
    getDrawsForRange: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    lottoService.getDrawsForRange.mockResolvedValue([]);

    const moduleFixture = await Test.createTestingModule({
      controllers: [LottoController],
      providers: [{ provide: LottoService, useValue: lottoService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('passes the game and inclusive date range to the service', async () => {
    await request(app.getHttpServer())
      .get('/lotto/draws/6%2F58')
      .query({ from: '2026-11-18', to: '2026-11-19' })
      .expect(200);

    expect(lottoService.getDrawsForRange).toHaveBeenCalledWith(
      '6/58',
      '2026-11-18',
      '2026-11-19',
    );
  });

  it('rejects reversed date ranges', async () => {
    await request(app.getHttpServer())
      .get('/lotto/draws/6%2F58')
      .query({ from: '2026-11-20', to: '2026-11-19' })
      .expect(400);

    expect(lottoService.getDrawsForRange).not.toHaveBeenCalled();
  });

  it('rejects invalid calendar dates', async () => {
    await request(app.getHttpServer())
      .get('/lotto/draws/6%2F58')
      .query({ from: '2026-02-31', to: '2026-03-01' })
      .expect(400);

    expect(lottoService.getDrawsForRange).not.toHaveBeenCalled();
  });
});
