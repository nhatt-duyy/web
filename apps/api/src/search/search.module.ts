import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { meiliProvider } from './meili.provider';

// Global để ProductsService (và các module khác) inject SearchService không cần import lại
@Global()
@Module({
  imports: [ConfigModule],
  controllers: [SearchController],
  providers: [meiliProvider, SearchService],
  exports: [SearchService],
})
export class SearchModule implements OnModuleInit {
  constructor(private readonly searchService: SearchService) {}

  // Cấu hình index + đồng bộ dữ liệu từ DB khi app khởi động
  // (best-effort: nếu MeiliSearch lỗi sẽ warn, không block khởi động)
  async onModuleInit() {
    await this.searchService.initIndex();
    await this.searchService.syncAll();
  }
}
