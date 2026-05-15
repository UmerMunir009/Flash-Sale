import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { BuyProductDto } from './dto/buy-product.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SellerGuard } from '../../common/guards/seller.guard';
import { CategoryValidationPipe } from '../../common/pipes/category-validation.pipe';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  async findAllCategories() {
    const result = await this.productsService.findAllCategories();
    return {
      success: true,
      message: 'Categories fetched successfully',
      data: result,
    };
  }

  @Get()
  async findAll(
    @Query(CategoryValidationPipe) filterDto: ProductFilterDto,
  ) {
    const result = await this.productsService.findAll(filterDto);
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
  @UseGuards(SellerGuard)
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const result = await this.productsService.create(createProductDto, user.id);
    return {
      success: true,
      message: 'Product created successfully',
      data: result,
    };
  }
  

  @Patch(':id')
  @UseGuards(SellerGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const result = await this.productsService.update(id, updateProductDto, user.id);
    return {
      success: true,
      message: 'Product updated successfully',
      data: result,
    };
  }


  @Delete(':id')
  @UseGuards(SellerGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const result = await this.productsService.remove(id, user.id);
    return {
      success: true,
      message: 'Product deleted successfully',
      data: result,
    };
  }


  @Post(':id/buy')
  async buyProduct(
    @Param('id') id: string,
    @Body() buyProductDto: BuyProductDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const result = await this.productsService.buyProduct(
      id,
      buyProductDto.quantity,
      user.id,
      user.role,
    );
    return {
      success: true,
      message: 'Product purchased successfully',
      data: result,
    };
  }
}