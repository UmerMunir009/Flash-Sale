import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateDealDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}