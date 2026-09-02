import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  LottoDraw,
  LottoDrawDocument,
} from '../lotto/schemas/lotto-draw.schema.js';
import { Model } from 'mongoose';

@Injectable()
export class StatsRepository {
  constructor(
    @InjectModel(LottoDraw.name)
    private readonly lottoModel: Model<LottoDrawDocument>,
  ) {}

  async getFrequency(gameName: string, limit: number = 10, months?: number) {
    let dateFrom: Date | undefined;

    // Add date filter if months specified
    if (months) {
      dateFrom = new Date();
      dateFrom.setMonth(dateFrom.getMonth() - months);
    }

    const matchCriteria: any = {
      gameName: new RegExp(gameName, 'i'),
      ...(dateFrom && { drawDate: { $gte: dateFrom } }),
    };

    const matchStage = { $match: matchCriteria };

    // Hot Numbers (Most Frequent)
    const hotNumbers = await this.lottoModel.aggregate([
      matchStage,
      { $unwind: '$numbers' },
      {
        $group: {
          _id: '$numbers',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          number: '$_id',
          count: 1,
        },
      },
    ]);

    // Cold Numbers (Least Frequent)
    const coldNumbers = await this.lottoModel.aggregate([
      matchStage,
      { $unwind: '$numbers' },
      {
        $group: {
          _id: '$numbers',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: 1, _id: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          number: '$_id',
          count: 1,
        },
      },
    ]);

    const totalDraws = await this.lottoModel.countDocuments(matchCriteria);

    return {
      gameName,
      totalDrawsAnalyzed: totalDraws,
      hotNumbers,
      coldNumbers,
    };
  }

  /**
   * Finds the most overdue numbers and calculates days/draws passed
   */
  async getOverdueNumbers(gameName: string, limit: number = 10) {
    const latestDraw = await this.lottoModel
      .findOne({ gameName: new RegExp(gameName, 'i') })
      .sort({ drawDate: -1 })
      .exec();

    if (!latestDraw) {
      return { gameName, overdueNumbers: [] };
    }

    const results = await this.lottoModel.aggregate([
      // 1. Filter by specific lotto game
      { $match: { gameName: new RegExp(gameName, 'i') } },

      // 2. Sort newest draws first
      { $sort: { drawDate: -1 } },

      // 3. Flatten the numbers array
      { $unwind: '$numbers' },

      // 4. Group by number — $first picks the most recent drawDate
      {
        $group: {
          _id: '$numbers',
          lastSeenDate: { $first: '$drawDate' },
          totalAppearances: { $sum: 1 },
        },
      },

      // 5. Calculate days since last appearance relative to the latest draw
      {
        $project: {
          _id: 0,
          number: '$_id',
          lastSeenDate: 1,
          totalAppearances: 1,
          daysOverdue: {
            $round: [
              {
                $divide: [
                  { $subtract: [latestDraw.drawDate, '$lastSeenDate'] },
                  1000 * 60 * 60 * 24, // Convert milliseconds to days
                ],
              },
              0,
            ],
          },
        },
      },

      // 6. Oldest lastSeenDate first (most overdue)
      { $sort: { daysOverdue: -1, number: 1 } },
      { $limit: limit },
    ]);

    return {
      gameName,
      referenceDrawDate: latestDraw.drawDate,
      overdueNumbers: results,
    };
  }
}
