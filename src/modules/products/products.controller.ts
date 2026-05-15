import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.productsService.findAll(paginationDto);
    return {
      success: true,
      message: 'Products fetched successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.productsService.findOne(id);
    
    return {
      success: true,
      message: 'Product fetched successfully',
      data: result,
    };
  }

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can create products');
    }
    const result = await this.productsService.create(createProductDto, user.id);
    return {
      success: true,
      message: 'Product created successfully',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can update products');
    }
    const result = await this.productsService.update(id, updateProductDto, user.id);
    return {
      success: true,
      message: 'Product updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can delete products');
    }
    const result = await this.productsService.remove(id, user.id);
    return {
      success: true,
      message: 'Product deleted successfully',
      data: result,
    };
  }
}