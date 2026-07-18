import { Test, TestingModule } from '@nestjs/testing';
import { SearchService, ProductDoc } from './search.service';
import { PrismaService } from '../database/prisma.service';
import { MEILI_CLIENT, PRODUCT_INDEX } from './meili.provider';
import { MeiliSearch } from 'meilisearch';

describe('SearchService', () => {
  let service: SearchService;
  let meili: any;
  let prisma: any;

  const mockIndex = () => ({
    getRawInfo: jest.fn().mockResolvedValue({ primaryKey: 'id' }),
    updateSettings: jest.fn().mockResolvedValue(undefined),
    addDocuments: jest.fn().mockResolvedValue(undefined),
    deleteDocument: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0 }),
  });

  beforeEach(async () => {
    const idx = mockIndex();
    meili = {
      index: jest.fn().mockReturnValue(idx),
      createIndex: jest.fn().mockResolvedValue(undefined),
      updateIndex: jest.fn().mockResolvedValue(undefined),
      _idx: idx,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: MEILI_CLIENT, useValue: meili },
        {
          provide: PrismaService,
          useValue: { product: { findMany: jest.fn() } },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initIndex', () => {
    it('không createIndex nếu info đã có primaryKey', async () => {
      await service.initIndex();
      expect(meili.createIndex).not.toHaveBeenCalled();
      expect(meili._idx.updateSettings).toHaveBeenCalled();
    });

    it('createIndex nếu getRawInfo trả null', async () => {
      meili._idx.getRawInfo.mockResolvedValueOnce(null);
      await service.initIndex();
      expect(meili.createIndex).toHaveBeenCalledWith(PRODUCT_INDEX, { primaryKey: 'id' });
    });
  });

  describe('toDoc', () => {
    it('chuyển product thành doc (epoch ms)', async () => {
      const product = {
        id: 'p1',
        title: 'A',
        slug: 'a',
        description: 'd',
        price: 100,
        thumbnail: 't',
        categoryId: 'c1',
        category: { name: 'Cat' },
        isPublished: true,
        language: 'vi',
        images: [],
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      const doc: ProductDoc = (service as any).toDoc(product);
      expect(doc.categoryName).toBe('Cat');
      expect(doc.createdAt).toBe(new Date('2026-01-01T00:00:00Z').getTime());
    });
  });

  describe('upsertProduct / removeProduct', () => {
    it('upsert gọi addDocuments', async () => {
      await service.upsertProduct({ id: 'p1', category: {} });
      expect(meili._idx.addDocuments).toHaveBeenCalled();
    });

    it('remove gọi deleteDocument', async () => {
      await service.removeProduct('p1');
      expect(meili._idx.deleteDocument).toHaveBeenCalledWith('p1');
    });
  });

  describe('syncAll', () => {
    it('skip nếu không có sản phẩm', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);
      await service.syncAll();
      expect(meili._idx.addDocuments).not.toHaveBeenCalled();
    });

    it('addDocuments cho mỗi sản phẩm', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([{ id: 'p1', category: {} }]);
      await service.syncAll();
      expect(meili._idx.addDocuments).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('build filter isPublished + category + price', async () => {
      await service.search({ q: 'a', category: 'c1', minPrice: 10, maxPrice: 100 });
      const args = meili._idx.search.mock.calls[0];
      expect(args[0]).toBe('a');
      expect(args[1].filter).toContain('isPublished = true');
      expect(args[1].filter).toContain('categoryId = "c1"');
      expect(args[1].filter).toContain('price >= 10');
      expect(args[1].filter).toContain('price <= 100');
    });

    it('sort mặc định createdAt:desc, offset = (page-1)*limit', async () => {
      await service.search({ page: 2, limit: 5 });
      const args = meili._idx.search.mock.calls[0];
      expect(args[1].sort).toEqual(['createdAt:desc']);
      expect(args[1].offset).toBe(5);
      expect(args[1].limit).toBe(5);
    });
  });
});
