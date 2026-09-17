import { Injectable } from '@nestjs/common';
import { LottoRepository } from './lotto.repository.js';

@Injectable()
export class LottoService {
  constructor(private readonly lottoRepository: LottoRepository) {}

  async getDraw(date: string) {
    const draws = await this.lottoRepository.findByDate(date);

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
