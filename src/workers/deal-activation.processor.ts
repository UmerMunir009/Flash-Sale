import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Job } from 'bullmq';
import { Deal, DealStatus } from '../modules/deals/entities/deal.entity';
import { Wishlist } from '../modules/wishlist/entities/wishlist.entity';
import { User } from '../modules/users/entities/user.entity';
import { QUEUES, JOBS } from '../common/constants/queue.constants';
import { RedisService } from '../common/services/redis.service';
import { EmailService } from '../common/services/email.service';
import { CACHE_KEYS } from '../common/constants/cache.constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Processor(QUEUES.DEAL_ACTIVATION)
export class DealActivationProcessor extends WorkerHost {
  private readonly logger = new Logger(DealActivationProcessor.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    @InjectQueue(QUEUES.EMAIL)
    private readonly emailQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { dealId } = job.data;
    this.logger.log(`⚡ Activating deal: ${dealId}`);

    const deal = await this.dealsRepository.findOne({
      where: { id: dealId },
      relations: ['product'],
    });

    if (!deal) {
      this.logger.warn(`Deal ${dealId} not found`);
      return;
    }

    if (deal.status !== DealStatus.PENDING) {
      this.logger.warn(`Deal ${dealId} is not pending anymore`);
      return;
    }

    deal.status = DealStatus.ACTIVE;
    await this.dealsRepository.save(deal);

    await this.redisService.set(CACHE_KEYS.DEAL(dealId), deal, 300);
    const keys = await this.redisService.keys(`${CACHE_KEYS.ACTIVE_DEALS}*`);
    await Promise.all(keys.map((key) => this.redisService.del(key)));

    this.logger.log(`Deal ${dealId} is now ACTIVE`);

    const wishlists = await this.wishlistRepository.find({
      where: { productId: deal.productId },
    });

    if (wishlists.length === 0) {
      this.logger.log(`No wishlist buyers for deal ${dealId}`);
      return;
    }

    const userIds = wishlists.map((w) => w.userId);
    const users = await this.usersRepository.findBy({
      id: In(userIds),
    });
    await Promise.all(
      users.map((user) =>
        this.emailQueue.add(
          JOBS.SEND_DEAL_NOTIFICATION,
          {
            toEmail: user.email,
            buyerName: user.name,
            productName: deal.product.name,
            discountPercentage: deal.discountPercentage,
            dealEndTime: deal.endTime,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        ),
      ),
    );
  }
}