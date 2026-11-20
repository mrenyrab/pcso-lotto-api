import { Injectable } from '@nestjs/common';
import { LottoRepository } from './lotto.repository.js';
import { LOTTO_GAME_NAMES, type GameName } from '../contants/game.constants.js';

@Injectable()
export class LottoService {
  constructor(private readonly lottoRepository: LottoRepository) {}

  async getDraw(date: string) {
    const draws = await this.lottoRepository.findByDate(date);
    return this.formatDraws(draws);
  }

  async getDrawsForRange(game: GameName, from: string, to: string) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toExclusive = new Date(`${to}T00:00:00.000Z`);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    const draws = await this.lottoRepository.findByGameAndDateRange(
      LOTTO_GAME_NAMES[game],
      fromDate,
      toExclusive,
    );
    return this.formatDraws(draws);
  }

  private formatDraws(
    draws: Awaited<ReturnType<LottoRepository['findByDate']>>,
  ) {
    const pesoFormatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    });

    return draws.map((draw) => ({
      ...draw.toObject(),
      jackpotFormatted: pesoFormatter.format(draw.jackpot),
    }));
  }
}
