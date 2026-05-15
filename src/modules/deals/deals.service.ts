import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Deal, DealStatus } from './entities/deal.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductsService } from '../products/products.service';
import { QUEUES, JOBS } from '../../common/constants/queue.constants';


@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    private readonly productsService: ProductsService,
    @InjectQueue(QUEUES.DEAL_ACTIVATION)
    private readonly activationQueue: Queue,
    @InjectQueue(QUEUES.DEAL_EXPIRY)
    private readonly expiryQueue: Queue,
  ) {}

  async create(createDealDto: CreateDealDto, sellerId: string): Promise<Deal> {
    const { productId, startTime, endTime, discountPercentage } = createDealDto;

    const product = await this.productsService.findOne(productId);
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only create deals for your own products');
    }

    // validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      throw new BadRequestException('end_time must be after start_time');
    }
    if (start < new Date()) {
      throw new BadRequestException('start_time cannot be in the past');
    }

    const deal = this.dealsRepository.create({
      productId,
      sellerId,
      discountPercentage,
      startTime: start,
      endTime: end,
      status: DealStatus.PENDING,
    });

    const savedDeal = await this.dealsRepository.save(deal);

    const activationDelay = start.getTime() - Date.now();
    const expiryDelay = end.getTime() - Date.now();

    await this.activationQueue.add(
      JOBS.ACTIVATE_DEAL,
      { dealId: savedDeal.id },
      {
        delay: activationDelay,
        attempts: 3,      
        backoff: {
          type: 'exponential',
          delay: 5000,      
        },
      },
    );

    await this.expiryQueue.add(
      JOBS.EXPIRE_DEAL,
      { dealId: savedDeal.id },
      {
        delay: expiryDelay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return savedDeal;
  }

  
  async findActiveDeals(paginationDto: PaginationDto): Promise<{
    data: Deal[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { limit, skip, page } = paginationDto;

    const [data, total] = await this.dealsRepository.findAndCount({
      where: { status: DealStatus.ACTIVE },
      relations: ['product'],
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

  async findMyDeals(sellerId: string, paginationDto: PaginationDto): Promise<{
    data: Deal[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { limit, skip, page } = paginationDto;

    const [data, total] = await this.dealsRepository.findAndCount({
      where: { sellerId },
      relations: ['product'],
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

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealsRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto, sellerId: string): Promise<Deal> {
    const deal = await this.findOne(id);

    if (deal.sellerId !== sellerId) {
      throw new ForbiddenException('You can only update your own deals');
    }

    if (deal.status !== DealStatus.PENDING) {
      throw new BadRequestException('Only pending deals can be updated');
    }

    if (updateDealDto.startTime) deal.startTime = new Date(updateDealDto.startTime);
    if (updateDealDto.endTime) deal.endTime = new Date(updateDealDto.endTime);
    if (updateDealDto.discountPercentage) deal.discountPercentage = updateDealDto.discountPercentage;

    if (deal.endTime <= deal.startTime) {
      throw new BadRequestException('end_time must be after start_time');
    }

    return this.dealsRepository.save(deal);
  }

  async remove(id: string, sellerId: string): Promise<{ message: string }> {
    const deal = await this.findOne(id);

    if (deal.sellerId !== sellerId) {
      throw new ForbiddenException('You can only delete your own deals');
    }

    if (deal.status === DealStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active deal');
    }

    await this.dealsRepository.remove(deal);
    return { message: 'Deal deleted successfully' };
  }
}