import { Inject, Injectable, Logger } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';
import { PrismaService } from '../database/prisma.service';
import { MEILI_CLIENT, PRODUCT_INDEX } from './meili.provider';

// Document sản phẩm lưu trong MeiliSearch
export interface ProductDoc {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail: string | null;
  categoryId: string;
  categoryName: string;
  isPublished: boolean;
  language: string | null;
  images: string[];
  createdAt: number; // epoch ms để sortable
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(MEILI_CLIENT) private readonly meili: MeiliSearch,
    private readonly prisma: PrismaService,
  ) {}

  private get index() {
    return this.meili.index<ProductDoc>(PRODUCT_INDEX);
  }

  // Cấu hình index một lần (searchable / filterable / sortable)
  async initIndex() {
    try {
      const index = this.meili.index<ProductDoc>(PRODUCT_INDEX);
      // MeiliSearch không tự suy luận primary key khi có nhiều trường kết thúc bằng "id"
      // (vd: id + categoryId) → chỉ định tường minh primaryKey = 'id'.
      const info = await index.getRawInfo().catch(() => null);
      if (!info) {
        await this.meili.createIndex(PRODUCT_INDEX, { primaryKey: 'id' });
      } else if (!info.primaryKey) {
        await this.meili.updateIndex(PRODUCT_INDEX, { primaryKey: 'id' });
      }

      await index.updateSettings({
        searchableAttributes: ['title', 'description', 'categoryName'],
        filterableAttributes: ['categoryId', 'price', 'isPublished', 'language'],
        sortableAttributes: ['price', 'createdAt'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      });
      this.logger.log('Đã cấu hình index MeiliSearch "products"');
    } catch (error: any) {
      this.logger.warn(`Không thể cấu hình MeiliSearch: ${error?.message ?? error}`);
    }
  }

  // Chuyển Product (kèm category) thành document
  private toDoc(product: any): ProductDoc {
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      thumbnail: product.thumbnail ?? null,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? '',
      isPublished: product.isPublished,
      language: product.language ?? null,
      images: product.images ?? [],
      createdAt: product.createdAt ? new Date(product.createdAt).getTime() : Date.now(),
    };
  }

  // Thêm / cập nhật 1 document (best-effort: không block CRUD nếu search lỗi)
  async upsertProduct(product: any) {
    try {
      await this.index.addDocuments([this.toDoc(product)]);
    } catch (error: any) {
      this.logger.warn(`Upsert MeiliSearch thất bại (${product?.id}): ${error?.message ?? error}`);
    }
  }

  // Xoá 1 document
  async removeProduct(id: string) {
    try {
      await this.index.deleteDocument(id);
    } catch (error: any) {
      this.logger.warn(`Xoá MeiliSearch thất bại (${id}): ${error?.message ?? error}`);
    }
  }

  // Đồng bộ toàn bộ sản phẩm từ DB (chạy sau deploy / seed)
  async syncAll() {
    const products = await this.prisma.product.findMany({ include: { category: true } });
    if (!products.length) return;
    try {
      await this.index.addDocuments(products.map((p) => this.toDoc(p)));
      this.logger.log(`Đồng bộ ${products.length} sản phẩm vào MeiliSearch`);
    } catch (error: any) {
      this.logger.warn(`Sync MeiliSearch thất bại: ${error?.message ?? error}`);
    }
  }

  // Tìm kiếm đa tiêu chí
  async search(params: {
    q?: string;
    category?: string;
    language?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'createdAt' | '_text_match';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      q = '',
      category,
      language,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = params;

    // Chỉ tìm sản phẩm đã publish
    const filter: string[] = ['isPublished = true'];
    if (category) filter.push(`categoryId = "${category}"`);
    if (language) filter.push(`language = "${language}"`);
    if (typeof minPrice === 'number') filter.push(`price >= ${minPrice}`);
    if (typeof maxPrice === 'number') filter.push(`price <= ${maxPrice}`);

    const sort = sortBy === '_text_match' ? undefined : `${sortBy}:${sortOrder}`;

    const res = await this.index.search(q, {
      filter,
      sort: sort ? [sort] : undefined,
      offset: (page - 1) * limit,
      limit,
    });

    return {
      data: res.hits,
      total: res.estimatedTotalHits,
      page,
      limit,
    };
  }
}
