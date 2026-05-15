import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from '../modules/deals/entities/deal.entity';
import { CleanupWorker } from './cleanup.worker';
import { DealActivationProcessor } from './deal-activation.processor';
import { DealExpiryProcessor } from './deal-expiry.processor';
import { QUEUES } from '../common/constants/queue.constants';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Deal]),
    BullModule.registerQueue(
      { name: QUEUES.DEAL_ACTIVATION },
      { name: QUEUES.DEAL_EXPIRY },
    ),
  ],
  providers: [
    CleanupWorker,         
    DealActivationProcessor, 
    DealExpiryProcessor,  
  ],
})
export class WorkersModule {}