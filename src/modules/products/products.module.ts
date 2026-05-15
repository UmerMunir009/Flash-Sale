import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductPurchase } from './entities/product-purchase.entity';
import { Category } from './entities/category.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoryValidationPipe } from '../../common/pipes/category-validation.pipe';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductPurchase, Category])],
  controllers: [ProductsController],
  providers: [ProductsService, CategoryValidationPipe],
  exports: [ProductsService],
})
export class ProductsModule {}