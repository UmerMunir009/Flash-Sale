import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';
import { Deal, DealStatus } from '../deals/entities/deal.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { WishlistFilterDto } from './dto/wishlist-filter.dto';
import { RedisService } from '../../common/services/redis.service';
import { CACHE_KEYS } from '../../common/constants/cache.constants';



@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    private readonly redisService: RedisService,
  ) { }

  async addToWishlist(
    productId: string,
    userId: string,
  ): Promise<Wishlist> {

    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    const wishlist = this.wishlistRepository.create({ userId, productId });
    const saved = await this.wishlistRepository.save(wishlist);

    // invalidate this user's wishlist cache
    await this.invalidateWishlistCache(userId);

    return saved;
  }

  async removeFromWishlist(
    productId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!wishlist) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.wishlistRepository.remove(wishlist);

    await this.invalidateWishlistCache(userId);

    return { message: 'Product removed from wishlist' };
  }

   async getMyWishlist(
    userId: string,
    filterDto: WishlistFilterDto,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { limit, skip, page, dealsOnly } = filterDto;

    const cacheKey = `${CACHE_KEYS.WISHLIST(userId)}:dealsOnly=${dealsOnly || false}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      console.log(`wishlist from cache for: ${userId}`);
      return cached as any;
    }

    const [wishlists, total] = await this.wishlistRepository.findAndCount({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    const datawithDealsStatus = await Promise.all(
      wishlists.map(async (wishlist) => {
        const activeDeal = await this.dealsRepository.findOne({
          where: {
            productId: wishlist.productId,
            status: DealStatus.ACTIVE,
          },
        });

        return {
          id: wishlist.id,
          createdAt: wishlist.createdAt,
          product: wishlist.product,
          activeDeal: activeDeal
            ? {
                id: activeDeal.id,
                discountPercentage: activeDeal.discountPercentage,
                endTime: activeDeal.endTime,
                purchaseCount: activeDeal.purchaseCount,
              }
            : null,
        };
      }),
    );

    const data = dealsOnly
      ? datawithDealsStatus.filter((item) => item.activeDeal !== null)
      : datawithDealsStatus;

    const result = {
      data,
      total: dealsOnly ? data.length : total,
      page,
      limit,
      totalPages: Math.ceil((dealsOnly ? data.length : total) / limit),
    };

    await this.redisService.set(cacheKey, result, 300);
    return result;
  }

  async clearWishlist(
    userId: string,
  ): Promise<{ message: string }> {
    await this.wishlistRepository.delete({ userId });
    await this.invalidateWishlistCache(userId);
    return { message: 'Wishlist cleared' };
  }

  private async invalidateWishlistCache(userId: string): Promise<void> {
    const keys = await this.redisService.keys(
      `${CACHE_KEYS.WISHLIST(userId)}*`,
    );
    await Promise.all(keys.map((key) => this.redisService.del(key)));
    console.log(`invalidated ${keys.length} wishlist cache keys for user: ${userId}`);
  }


}