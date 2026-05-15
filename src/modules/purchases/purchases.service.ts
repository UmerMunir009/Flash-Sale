import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { Deal, DealStatus } from '../deals/entities/deal.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchasesRepository: Repository<Purchase>,
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    private readonly dataSource: DataSource,
  ) {}

  async purchaseDeal(dealId: string, userId: string,userRole: string): Promise<Purchase> {
    if (userRole === UserRole.SELLER) {
      throw new ForbiddenException('Sellers cannot purchase deals');
    }

    const deal = await this.dealsRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.status !== DealStatus.ACTIVE) {
      throw new BadRequestException('This deal is not active');
    }

    const existing = await this.purchasesRepository.findOne({
      where: { userId, dealId },
    });
    if (existing) {
      throw new ConflictException('You have already purchased this deal');
    }

    // transaction — both must succeed together
    const purchase = await this.dataSource.transaction(async (manager) => {
      deal.purchaseCount += 1;
      await manager.save(deal);

      const newPurchase = manager.create(Purchase, { userId, dealId });
      return manager.save(newPurchase);
    });

    return purchase;
  }

  async findMyPurchases(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<{
    data: Purchase[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { limit, skip, page } = paginationDto;

    const [data, total] = await this.purchasesRepository.findAndCount({
      where: { userId },
      relations: ['deal', 'deal.product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}