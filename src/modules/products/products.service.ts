import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductPurchase } from './entities/product-purchase.entity';
import { UserRole } from '../users/entities/user.entity';


@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductPurchase)
    private readonly productPurchasesRepository: Repository<ProductPurchase>,
    private readonly dataSource: DataSource,
  ) { }

  async create(createProductDto: CreateProductDto, sellerId: string): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      sellerId,
    });
    return this.productsRepository.save(product);
  }

  async findAll(paginationDto: PaginationDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { limit, skip, page } = paginationDto;

    const [data, total] = await this.productsRepository.findAndCount({
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

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, sellerId: string): Promise<Product> {
    const product = await this.findOne(id);

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: string, sellerId: string): Promise<{ message: string }> {
    const product = await this.findOne(id);

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productsRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }


  async buyProduct(
    productId: string,
    quantity: number,
    userId: string,
    userRole: UserRole,
  ): Promise<ProductPurchase> {
    if (userRole === UserRole.SELLER) {
      throw new ForbiddenException('Sellers cannot buy products');
    }

    const product = await this.findOne(productId);
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Not enough stock. Available: ${product.stock}`,
      );
    }
    const totalPrice = product.price * quantity;

    const purchase = await this.dataSource.transaction(async (manager) => {
      product.stock -= quantity;
      await manager.save(product);

      const newPurchase = manager.create(ProductPurchase, {
        userId,
        productId,
        quantity,
        totalPrice,
      });
      return manager.save(newPurchase);
    });

    return purchase;
  }
}