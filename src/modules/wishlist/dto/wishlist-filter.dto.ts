import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class WishlistFilterDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  dealsOnly?: boolean;
}