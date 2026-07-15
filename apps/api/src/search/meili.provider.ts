import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

// Token DI cho client MeiliSearch (singleton)
export const MEILI_CLIENT = 'MEILI_CLIENT';

// Tên index sản phẩm dùng chung toàn hệ thống
export const PRODUCT_INDEX = 'products';

// Provider tạo 1 client MeiliSearch duy nhất từ biến môi trường
export const meiliProvider: Provider = {
  provide: MEILI_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): MeiliSearch => {
    const host = config.get<string>('MEILI_HOST') ?? 'http://localhost:7700';
    const apiKey = config.get<string>('MEILI_MASTER_KEY');
    return new MeiliSearch({ host, apiKey });
  },
};
