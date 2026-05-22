import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';
import { Deal } from '../deals/entities/deal.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, Product, Deal])],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}