import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLottoDto {
  @IsString()
  @IsNotEmpty()
  gameName: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  numbers: number[];

  @Type(() => Date)
  @IsDate()
  drawDate: Date;

  @IsNumber()
  @Min(0)
  jackpot: number;

  @IsNumber()
  @Min(0)
  winners: number;
}
