import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LottoModule } from './lotto/lotto.module.js';
import { ScraperModule } from './scraper/scraper.module.js';
import { StatsModule } from './stats/stats.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    LottoModule,
    ScraperModule,
    StatsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
