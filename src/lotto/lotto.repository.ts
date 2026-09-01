import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LottoDraw, LottoDrawDocument } from './schemas/lotto-draw.schema.js';
import { AnyBulkWriteOperation, Model } from 'mongoose';
import { CreateLottoDto } from './dto/create-lotto.dto.js';

@Injectable()
export class LottoRepository {
  private readonly logger = new Logger(LottoRepository.name);

  constructor(
    @InjectModel(LottoDraw.name)
    private readonly lottoModel: Model<LottoDrawDocument>,
  ) {}

  /**
   * Bulk upsert an array of lotto draws using MongoDB bulkWrite
   */
  async bulkUpsert(
    draws: CreateLottoDto[],
  ): Promise<{ upserted: number; modified: number }> {
    if (!draws || draws.length === 0) {
      return { upserted: 0, modified: 0 };
    }

    const operations: AnyBulkWriteOperation<LottoDraw>[] = draws.map(
      (draw) => ({
        updateOne: {
          filter: {
            gameName: draw.gameName,
            drawDate: draw.drawDate,
          },
          update: {
            $set: {
              numbers: draw.numbers,
              jackpot: draw.jackpot,
              winners: draw.winners,
            },
            $setOnInsert: {
              gameName: draw.gameName,
              drawDate: draw.drawDate,
            },
          },
          upsert: true,
        },
      }),
    );

    const result = await this.lottoModel.bulkWrite(operations, {
      ordered: false,
    });

    this.logger.log(
      `Bulk write complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`,
    );

    return {
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    };
  }

  /**
   * Retrieve the most recent draw for each major game
   */
  async getLatestDraws(): Promise<LottoDraw[]> {
    return this.lottoModel.aggregate([
      { $sort: { drawDate: -1 } },
      {
        $group: {
          _id: '$gameName',
          latestDraw: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latestDraw' } },
      { $sort: { gameName: 1 } },
    ]);
  }

  /**
   * Find draws by game and optional date range
   */
  async findByGame(
    gameName: string,
    from?: Date,
    to?: Date,
  ): Promise<LottoDraw[]> {
    const filter: Record<string, any> = { gameName: new RegExp(gameName, 'i') };

    if (from || to) {
      filter.drawDate = {};
      if (from) filter.drawDate.$gte = from;
      if (to) filter.drawDate.$lte = to;
    }

    return this.lottoModel.find(filter).sort({ drawDate: -1 }).exec();
  }

  /**
   * Find draws by a specific date
   */
  async findByDate(date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    return this.lottoModel
      .find({
        drawDate: {
          $gte: start,
          $lt: end,
        },
      })
      .sort({ drawDate: 1 })
      .exec();
  }
}
