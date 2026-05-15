import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateDealDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}