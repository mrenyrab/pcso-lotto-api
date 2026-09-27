import { IsEnum, IsInt, IsNotEmpty, IsNumber } from "class-validator";
import { MONTHS } from "../../contants/months.constants.js";
import { Type } from "class-transformer";

export class BackfillMonthYearDto {
  @IsEnum(MONTHS)
  @IsNotEmpty()
  month: string;

  @Type(() => Number)
  @IsInt()
  year: number;
}