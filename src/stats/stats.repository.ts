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
}
