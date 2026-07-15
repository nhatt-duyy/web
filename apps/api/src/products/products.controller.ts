import { Controller, Get, Post, Patch, Delete, Param, Body, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

interface ListQueryDto {
  category?: string;
  isPublished?: boolean;
  sortBy?: 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: 'price' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    // isPublished luôn = true ở tầng service (danh sách công khai)
    return this.productsService.findAll(
      { category },
      sortBy ?? 'createdAt',
      sortOrder ?? 'desc',
      page,
      limit,
    );
  }

  // Sản phẩm liên quan (cùng danh mục)
  @Get('related/:id')
  async findRelated(
    @Param('id') id: string,
    @Query('categoryId') categoryId: string,
    @Query('limit', new DefaultValuePipe(4), ParseIntPipe) limit: number = 4,
  ) {
    return this.productsService.getRelated(id, categoryId, limit);
  }

  // Danh sách ngôn ngữ đang có (cho bộ lọc tìm kiếm)
  @Get('languages')
  async findLanguages() {
    return this.productsService.findLanguages();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}