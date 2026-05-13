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
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
    // return {
    //   success: true,
    //   message: 'Products Found',
    //   data: result,
    // };
  }

  // PUBLIC — anyone can view a single product
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // SELLER ONLY — create product
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can create products');
    }
    return this.productsService.create(createProductDto, user.id);
  }

  // SELLER ONLY — update own product
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can update products');
    }
    return this.productsService.update(id, updateProductDto, user.id);
  }

  // SELLER ONLY — delete own product
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can delete products');
    }
    return this.productsService.remove(id, user.id);
  }
}