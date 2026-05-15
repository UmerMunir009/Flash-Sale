import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductPurchase } from './entities/product-purchase.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductPurchase)
    private readonly productPurchasesRepository: Repository<ProductPurchase>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto, sellerId: string): Promise<Product> {
    if (createProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const product = this.productsRepository.create({
      ...createProductDto,
      sellerId,
    });
    return this.productsRepository.save(product);
  }

  async findAll(filterDto: ProductFilterDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { limit, skip, page, search, categoryId } = filterDto;

    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC')
      .take(limit)
      .skip(skip);

    if (search) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    sellerId: string,
  ): Promise<Product> {
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
      throw new BadRequestException(`Not enough stock. Available: ${product.stock}`);
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