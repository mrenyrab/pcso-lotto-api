import { Injectable } from '@nestjs/common';
import { LottoRepository } from './lotto.repository.js';

@Injectable()
export class LottoService {
  constructor(private readonly lottoRepository: LottoRepository) {}

  async getDraw(date: string) {
    return await this.lottoRepository.findByDate(date);
  }
}
