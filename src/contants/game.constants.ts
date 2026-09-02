interface GameConfig {
  totalBalls: number;
  pickCount: number;
  minSum: number;
  maxSum: number;
  validOddCounts: number[];
}

export const GAME_CONFIGS: Record<string, GameConfig> = {
  '6/58': {
    totalBalls: 58,
    pickCount: 6,
    minSum: 130,
    maxSum: 220,
    validOddCounts: [2, 3, 4],
  },
  '6/55': {
    totalBalls: 55,
    pickCount: 6,
    minSum: 120,
    maxSum: 210,
    validOddCounts: [2, 3, 4],
  },
  '6/49': {
    totalBalls: 49,
    pickCount: 6,
    minSum: 110,
    maxSum: 190,
    validOddCounts: [2, 3, 4],
  },
  '6/45': {
    totalBalls: 45,
    pickCount: 6,
    minSum: 100,
    maxSum: 180,
    validOddCounts: [2, 3, 4],
  },
  '6/42': {
    totalBalls: 42,
    pickCount: 6,
    minSum: 90,
    maxSum: 170,
    validOddCounts: [2, 3, 4],
  },
};
