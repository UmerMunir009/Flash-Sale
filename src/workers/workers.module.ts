import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from '../modules/deals/entities/deal.entity';
import { Wishlist } from '../modules/wishlist/entities/wishlist.entity';
import { User } from '../modules/users/entities/user.entity';
import { CleanupWorker } from './cleanup.worker';
import { DealActivationProcessor } from './deal-activation.processor';
import { DealExpiryProcessor } from './deal-expiry.processor';
import { QUEUES } from '../common/constants/queue.constants';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Deal, Wishlist, User]), 
    BullModule.registerQueue(
      { name: QUEUES.DEAL_ACTIVATION },
      { name: QUEUES.DEAL_EXPIRY },
      { name: QUEUES.EMAIL },
    ),
  ],
  providers: [
    CleanupWorker,
    DealActivationProcessor,
    DealExpiryProcessor,
     EmailProcessor, 
  ],
})
export class WorkersModule {}