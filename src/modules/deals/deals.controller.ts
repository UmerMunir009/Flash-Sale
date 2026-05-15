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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  async findActiveDeals(@Query() paginationDto: PaginationDto) {
    const result = await this.dealsService.findActiveDeals(paginationDto);
    return {
      success: true,
      message: 'Active deals fetched successfully',
      data: result,
    };
  }

  @Get('my')
  async findMyDeals(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can view their deals');
    }
    const result = await this.dealsService.findMyDeals(user.id, paginationDto);
    return {
      success: true,
      message: 'Your deals fetched successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.dealsService.findOne(id);
    return {
      success: true,
      message: 'Deal fetched successfully',
      data: result,
    };
  }

  @Post()
  async create(
    @Body() createDealDto: CreateDealDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can create deals');
    }
    const result = await this.dealsService.create(createDealDto, user.id);
    return {
      success: true,
      message: 'Deal created successfully',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can update deals');
    }
    const result = await this.dealsService.update(id, updateDealDto, user.id);
    return {
      success: true,
      message: 'Deal updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can delete deals');
    }
    const result = await this.dealsService.remove(id, user.id);
    return {
      success: true,
      message: 'Deal deleted successfully',
      data: result,
    };
  }
}