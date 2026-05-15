import {
  PipeTransform,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../modules/products/entities/category.entity';
import { ProductFilterDto } from '../../modules/products/dto/product-filter.dto';

@Injectable()
export class CategoryValidationPipe implements PipeTransform {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async transform(value: ProductFilterDto): Promise<ProductFilterDto> {
    if (!value.categoryId) {
      return value;
    }

    const category = await this.categoryRepository.findOne({
      where: { id: value.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with id ${value.categoryId} does not exist`,
      );
    }

    return value;
  }
}