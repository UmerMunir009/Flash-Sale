import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Deal } from './entities/deal.entity';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { ProductsModule } from '../products/products.module';
import { QUEUES } from '../../common/constants/queue.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal]),
    ProductsModule,
    BullModule.registerQueue(
      { name: QUEUES.DEAL_ACTIVATION },
      { name: QUEUES.DEAL_EXPIRY },
    ),
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}