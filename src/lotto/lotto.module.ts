import { Module } from '@nestjs/common';
import { LottoService } from './lotto.service.js';
import { LottoController } from './lotto.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { LottoDraw, LottoDrawSchema } from './schemas/lotto-draw.schema.js';
import { LottoRepository } from './lotto.repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LottoDraw.name, schema: LottoDrawSchema },
    ]),
  ],
  providers: [LottoService, LottoRepository],
  controllers: [LottoController],
  exports: [LottoService, LottoRepository, MongooseModule],
})
export class LottoModule {}
