import { Controller, Get, Query, Post, UseGuards, HttpCode } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // Công khai: tìm kiếm sản phẩm đa tiêu chí
  @Get('products')
  async searchProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: 'price' | 'createdAt' | '_text_match',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search({
      q,
      category,
      language,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      sortOrder,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });
  }

  // Admin: đồng bộ lại toàn bộ index
  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(200)
  async sync() {
    await this.searchService.syncAll();
    return { ok: true, message: 'Đã đồng bộ MeiliSearch' };
  }
}
