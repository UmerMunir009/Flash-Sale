import {
  Controller,
  Post,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post(':dealId')
  async purchaseDeal(
    @Param('dealId') dealId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const result = await this.purchasesService.purchaseDeal(dealId, user.id,user.role,);
    return {
      success: true,
      message: 'Deal purchased successfully',
      data: result,
    };
  }

  @Get('history')
  async findMyPurchases(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const result = await this.purchasesService.findMyPurchases(
      user.id,
      paginationDto,
    );
    return {
      success: true,
      message: 'Purchase history fetched successfully',
      data: result,
    };
  }
}