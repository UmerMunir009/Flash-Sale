import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Deal, DealStatus } from '../modules/deals/entities/deal.entity';

@Injectable()
export class CleanupWorker {
  private readonly logger = new Logger(CleanupWorker.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
  ) {}

  @Cron('0 0 * * *')
  async cleanupExpiredDeals(): Promise<void> {
    this.logger.log('Running cleanup worker...');

    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldDeals = await this.dealsRepository.find({
      where: {
        status: DealStatus.EXPIRED,
        updatedAt: LessThan(thirtyDaysAgo),
      },
    });

    if (oldDeals.length === 0) {
      this.logger.log('No old deals to clean up');
      return;
    }

    await this.dealsRepository.remove(oldDeals);
    this.logger.log(`Cleaned up ${oldDeals.length} expired deal(s)`);
  }
}