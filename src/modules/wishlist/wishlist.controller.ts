import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';
import { BuyerGuard } from '../../common/guards/buyer.guard';
import { WishlistFilterDto } from './dto/wishlist-filter.dto';


@Controller('wishlist')
@UseGuards(BuyerGuard)  
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  async addToWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.wishlistService.addToWishlist(
      productId,
      user.id,
    );
    return {
      success: true,
      message: 'Product added to wishlist',
      data: result,
    };
  }

  @Delete(':productId')
  async removeFromWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.wishlistService.removeFromWishlist(
      productId,
      user.id,
    );
    return {
      success: true,
      message: result.message
     };
  }

  @Delete()
  async clearWishlist(
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.wishlistService.clearWishlist(
      user.id,
    );
    return {
      success: true,
      message: result.message
     };
  }

  @Get()
async getMyWishlist(
  @Query() filterDto: WishlistFilterDto,  
  @CurrentUser() user: { id: string; role: UserRole },
) {
  const result = await this.wishlistService.getMyWishlist(
    user.id,
    filterDto,
  );
  return {
    success: true,
    message: 'Wishlist fetched successfully',
    data: result,
  };
}

}