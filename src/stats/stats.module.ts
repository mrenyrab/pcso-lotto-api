import { Module } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { StatsController } from './stats.controller.js';
import { StatsRepository } from './stats.repository.js';
import { LottoModule } from '../lotto/lotto.module.js';

@Module({
  imports: [LottoModule],
  providers: [StatsService, StatsRepository],
  controllers: [StatsController],
})
export class StatsModule {}
