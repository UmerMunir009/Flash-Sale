import { IsInt, Min } from 'class-validator';

export class BuyProductDto {
  @IsInt()
  @Min(1)
  quantity: number;
}