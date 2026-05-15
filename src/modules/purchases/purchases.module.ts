import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { Deal } from '../deals/entities/deal.entity';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, Deal])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}