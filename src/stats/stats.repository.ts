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

  /**
   * Computes historical Odd vs. Even pattern distribution and percentages
   */
  async getOddEvenDistribution(gameName: string, from?: Date, to?: Date) {
    const matchFilter: Record<string, any> = {
      // Game name filter (e.g. 6/58, Ultra Lotto)
      gameName: new RegExp(gameName, 'i'),

      // Strictly enforce array length of EXACTLY 6
      'numbers.5': { $exists: true }, // Must have a 6th element (index 5)
      'numbers.6': { $exists: false }, // Must NOT have a 7th element (index 6)
    };

    // If date bounds are provided, add them to the filter
    if (from || to) {
      matchFilter.drawDate = {};
      if (from) matchFilter.drawDate.$gte = from;
      if (to) matchFilter.drawDate.$lte = to;
    }

    const results = await this.lottoModel.aggregate([
      // 1. Filter by the specific lotto game (case-insensitive)
      {
        $match: matchFilter,
      },

      // 2. Count odd numbers in each draw using $mod and $size
      {
        $project: {
          oddCount: {
            $size: {
              $filter: {
                input: '$numbers',
                as: 'num',
                cond: { $eq: [{ $mod: ['$$num', 2] }, 1] },
              },
            },
          },
          totalNumbers: { $size: '$numbers' },
        },
      },

      // 3. Compute evenCount as (totalNumbers - oddCount)
      {
        $project: {
          oddCount: 1,
          evenCount: { $subtract: ['$totalNumbers', '$oddCount'] },
        },
      },

      // 4. Group by the parity pair pattern [odd, even] and count occurrences
      {
        $group: {
          _id: {
            odd: '$oddCount',
            even: '$evenCount',
          },
          drawCount: { $sum: 1 },
        },
      },

      // 5. Group all results into a single array to calculate overall total draws
      {
        $group: {
          _id: null,
          totalDraws: { $sum: '$drawCount' },
          patterns: {
            $push: {
              pattern: {
                $concat: [
                  { $toString: '$_id.odd' },
                  ' Odd / ',
                  { $toString: '$_id.even' },
                  ' Even',
                ],
              },
              odd: '$_id.odd',
              even: '$_id.even',
              count: '$drawCount',
            },
          },
        },
      },

      // 6. Unwind patterns back to document level to calculate percentages
      { $unwind: '$patterns' },

      // 7. Project final presentation fields and rounded percentage
      {
        $project: {
          _id: 0,
          pattern: '$patterns.pattern',
          odd: '$patterns.odd',
          even: '$patterns.even',
          count: '$patterns.count',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$patterns.count', '$totalDraws'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },

      // 8. Sort by highest frequency first
      { $sort: { count: -1 } },
    ]);

    const totalDraws = results.reduce((sum, item) => sum + item.count, 0);

    return {
      gameName,
      totalDrawsAnalyzed: totalDraws,
      distribution: results,
    };
  }

  /**
   * Computes the most frequently co-occurring 2-number pairs
   */
  async getNumberPairs(
    gameName: string,
    limit: number = 15,
    from?: Date,
    to?: Date,
  ) {
    const matchFilter: Record<string, any> = {
      gameName: new RegExp(gameName, 'i'),
      'numbers.5': { $exists: true },
      'numbers.6': { $exists: false },
    };

    if (from || to) {
      matchFilter.drawDate = {};
      if (from) matchFilter.drawDate.$gte = from;
      if (to) matchFilter.drawDate.$lte = to;
    }
    const results = await this.lottoModel.aggregate([
      // 1. Strict filter: match target game and enforce exactly 6 balls
      {
        $match: matchFilter,
      },

      // 2. Sort the 6 numbers ascending so pairs are canonical: [a, b] where a < b
      {
        $project: {
          sortedNumbers: { $sortArray: { input: '$numbers', sortBy: 1 } },
        },
      },

      // 3. Generate all 15 unique pairs using nested loops over indices
      {
        $project: {
          pairs: {
            $reduce: {
              input: { $range: [0, 5] }, // i from 0 to 4
              initialValue: [],
              in: {
                $concatArrays: [
                  '$$value',
                  {
                    $map: {
                      input: { $range: [{ $add: ['$$this', 1] }, 6] }, // j from i + 1 to 5
                      as: 'j',
                      in: [
                        { $arrayElemAt: ['$sortedNumbers', '$$this'] },
                        { $arrayElemAt: ['$sortedNumbers', '$$j'] },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      // 4. Flatten the 15 pairs per draw into individual rows
      { $unwind: '$pairs' },

      // 5. Group by the pair and sum frequency
      {
        $group: {
          _id: '$pairs',
          count: { $sum: 1 },
        },
      },

      // 6. Project formatted output
      {
        $project: {
          _id: 0,
          pair: '$_id',
          formatted: {
            $concat: [
              { $toString: { $arrayElemAt: ['$_id', 0] } },
              ' - ',
              { $toString: { $arrayElemAt: ['$_id', 1] } },
            ],
          },
          count: 1,
        },
      },

      // 7. Sort by highest frequency, then ascending ball values
      { $sort: { count: -1, pair: 1 } },
      { $limit: limit },
    ]);

    const totalDraws = await this.lottoModel.countDocuments({
      gameName: new RegExp(gameName, 'i'),
      'numbers.5': { $exists: true },
      'numbers.6': { $exists: false },
    });

    return {
      gameName,
      totalDrawsAnalyzed: totalDraws,
      topPairs: results,
    };
  }

  /**
   * Computes Sum of Numbers distribution grouped into 30-point buckets
   */
  async getSumDistribution(gameName: string, from?: Date, to?: Date) {
    const matchFilter: Record<string, any> = {
      gameName: new RegExp(gameName, 'i'),
      'numbers.5': { $exists: true },
      'numbers.6': { $exists: false },
    };

    if (from || to) {
      matchFilter.drawDate = {};
      if (from) matchFilter.drawDate.$gte = from;
      if (to) matchFilter.drawDate.$lte = to;
    }

    const results = await this.lottoModel.aggregate([
      // 1. Filter target 6-ball draws
      { $match: matchFilter },

      // 2. Sum the array of numbers
      {
        $project: {
          drawDate: 1,
          totalSum: { $sum: '$numbers' },
        },
      },

      // 3. Classify into range buckets
      {
        $project: {
          totalSum: 1,
          bucket: {
            $switch: {
              branches: [
                { case: { $lt: ['$totalSum', 70] }, then: '< 70' },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 70] },
                      { $lt: ['$totalSum', 100] },
                    ],
                  },
                  then: '70 - 99',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 100] },
                      { $lt: ['$totalSum', 130] },
                    ],
                  },
                  then: '100 - 129',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 130] },
                      { $lt: ['$totalSum', 160] },
                    ],
                  },
                  then: '130 - 159',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 160] },
                      { $lt: ['$totalSum', 190] },
                    ],
                  },
                  then: '160 - 189',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 190] },
                      { $lt: ['$totalSum', 220] },
                    ],
                  },
                  then: '190 - 219',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 220] },
                      { $lt: ['$totalSum', 250] },
                    ],
                  },
                  then: '220 - 249',
                },
              ],
              default: '250+',
            },
          },
          sortOrder: {
            $switch: {
              branches: [
                { case: { $lt: ['$totalSum', 70] }, then: 1 },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 70] },
                      { $lt: ['$totalSum', 100] },
                    ],
                  },
                  then: 2,
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 100] },
                      { $lt: ['$totalSum', 130] },
                    ],
                  },
                  then: 3,
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 130] },
                      { $lt: ['$totalSum', 160] },
                    ],
                  },
                  then: 4,
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 160] },
                      { $lt: ['$totalSum', 190] },
                    ],
                  },
                  then: 5,
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 190] },
                      { $lt: ['$totalSum', 220] },
                    ],
                  },
                  then: 6,
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSum', 220] },
                      { $lt: ['$totalSum', 250] },
                    ],
                  },
                  then: 7,
                },
              ],
              default: 8,
            },
          },
        },
      },

      // 4. Group by bucket
      {
        $group: {
          _id: '$bucket',
          sortOrder: { $first: '$sortOrder' },
          count: { $sum: 1 },
          minSum: { $min: '$totalSum' },
          maxSum: { $max: '$totalSum' },
          avgSum: { $avg: '$totalSum' },
        },
      },

      // 5. Gather total count across all buckets to derive percentages
      {
        $group: {
          _id: null,
          totalDraws: { $sum: '$count' },
          buckets: {
            $push: {
              range: '$_id',
              sortOrder: '$sortOrder',
              count: '$count',
              minSum: '$minSum',
              maxSum: '$maxSum',
              avgSum: { $round: ['$avgSum', 1] },
            },
          },
        },
      },
      { $unwind: '$buckets' },

      // 6. Format presentation object with percentage
      {
        $project: {
          _id: 0,
          range: '$buckets.range',
          sortOrder: '$buckets.sortOrder',
          count: '$buckets.count',
          minSum: '$buckets.minSum',
          maxSum: '$buckets.maxSum',
          avgSum: '$buckets.avgSum',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$buckets.count', '$totalDraws'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },

      // 7. Order ranges logically from low to high
      { $sort: { sortOrder: 1 } },
    ]);

    const totalDraws = results.reduce((acc, curr) => acc + curr.count, 0);

    return {
      gameName,
      totalDrawsAnalyzed: totalDraws,
      distribution: results.map(({ sortOrder, ...item }) => item),
    };
  }

  /**
   * Finds the numbers most frequently drawn alongside a target ball
   */
  async getBallCompanions(
    gameName: string,
    targetBall: number,
    limit: number = 10,
    from?: Date,
    to?: Date,
  ) {
    const matchFilter: Record<string, any> = {
      gameName: new RegExp(gameName, 'i'),
      'numbers.5': { $exists: true },
      'numbers.6': { $exists: false },
      numbers: targetBall, // Multikey match: only draws containing targetBall
    };

    if (from || to) {
      matchFilter.drawDate = {};
      if (from) matchFilter.drawDate.$gte = from;
      if (to) matchFilter.drawDate.$lte = to;
    }

    const results = await this.lottoModel.aggregate([
      // 1. Filter draws containing target ball
      { $match: matchFilter },

      // 2. Remove targetBall from the array so it doesn't count itself
      {
        $project: {
          drawDate: 1,
          companions: {
            $filter: {
              input: '$numbers',
              as: 'num',
              cond: { $ne: ['$$num', targetBall] },
            },
          },
        },
      },

      // 3. Unwind companion numbers into individual rows
      { $unwind: '$companions' },

      // 4. Group by companion ball and count occurrences
      {
        $group: {
          _id: '$companions',
          count: { $sum: 1 },
        },
      },

      // 5. Group together to get the total draws where targetBall appeared
      {
        $group: {
          _id: null,
          companions: {
            $push: {
              number: '$_id',
              count: '$count',
            },
          },
        },
      },
      { $unwind: '$companions' },

      // 6. Sort companions by highest frequency
      { $sort: { 'companions.count': -1, 'companions.number': 1 } },
      { $limit: limit },

      // 7. Shape the output
      {
        $project: {
          _id: 0,
          number: '$companions.number',
          count: '$companions.count',
        },
      },
    ]);

    // Count how many total draws contained the target ball
    const targetBallAppearances =
      await this.lottoModel.countDocuments(matchFilter);

    // Calculate appearance percentage alongside target ball
    const companionsWithPercentage = results.map((item) => ({
      ...item,
      coOccurrenceRate:
        targetBallAppearances > 0
          ? parseFloat(((item.count / targetBallAppearances) * 100).toFixed(2))
          : 0,
    }));

    return {
      gameName,
      targetBall,
      targetBallTotalDraws: targetBallAppearances,
      topCompanions: companionsWithPercentage,
    };
  }
}
