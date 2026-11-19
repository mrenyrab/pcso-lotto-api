import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MONTHS } from '../../contants/months.constants.js';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BackfillQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    minimum: 1,
    description: 'Year to backfill; required by the endpoint.',
    example: 2026,
  })
  year: number;

  @IsOptional()
  @IsEnum(MONTHS)
  @ApiPropertyOptional({
    enum: Object.values(MONTHS),
    description: 'Month to backfill. Requires year.',
    example: 'january',
  })
  month?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 31,
    description: 'Day to backfill. Requires both month and year.',
    example: 19,
  })
  day?: number;
}
