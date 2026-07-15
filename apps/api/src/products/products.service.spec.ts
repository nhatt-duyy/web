import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';
import { SearchService } from '../search/search.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: SearchService,
          useValue: {
            upsertProduct: jest.fn(),
            removeProduct: jest.fn(),
            search: jest.fn(),
            syncAll: jest.fn(),
            initIndex: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with generated slug if not provided', async () => {
      const dto = {
        title: 'Test Product',
        description: 'Description',
        price: 10000,
        categoryId: 'cat-1',
      };
      const result = {
        id: '1',
        ...dto,
        slug: 'test-product',
        thumbnail: null,
        fileKey: null,
        isPublished: false,
        images: [],
        docs: null,
        changelog: null,
        demoUrl: null,
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prisma.product, 'create').mockResolvedValue(result);

      expect(await service.create(dto)).toBe(result);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...dto,
          slug: 'test-product',
          isPublished: false,
        }),
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    it('should create a product with provided slug', async () => {
      const dto = {
        title: 'Test Product',
        description: 'Description',
        price: 10000,
        categoryId: 'cat-1',
        slug: 'custom-slug',
        isPublished: true,
      };
      const result = {
        id: '1',
        ...dto,
        thumbnail: null,
        fileKey: null,
        images: [],
        docs: null,
        changelog: null,
        demoUrl: null,
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prisma.product, 'create').mockResolvedValue(result);

      expect(await service.create(dto)).toBe(result);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ...dto, isPublished: true }),
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  });

  describe('findAll', () => {
    it('should filter by category and isPublished, sort and paginate', async () => {
      const mockProducts = [
        {
          id: '1',
          title: 'Product 1',
          description: 'Description 1',
          price: 10000,
          thumbnail: null,
          fileKey: null,
          categoryId: 'cat-1',
          isPublished: true,
          images: [],
          docs: null,
          changelog: null,
          demoUrl: null,
          language: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          slug: 'product-1',
          category: {
            id: 'cat-1',
            name: 'Category 1',
            slug: 'cat-1',
          },
        },
      ];
      const mockCount = 1;

      jest.spyOn(prisma.product, 'findMany').mockResolvedValue(mockProducts);
      jest.spyOn(prisma.product, 'count').mockResolvedValue(mockCount);
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (arg: any) => {
          if (Array.isArray(arg)) {
            // Assume it's an array of promises
            const results = await Promise.all(arg);
            return results;
          } else {
            // Assume it's a callback function
            return arg(prisma as any);
          }
        });

      const result = await service.findAll(
        { category: 'cat-1', isPublished: true },
        'price',
        'asc',
        1,
        10,
      );

      expect(result).toEqual({ data: mockProducts, total: mockCount });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          category: { slug: 'cat-1' },
          isPublished: true,
        },
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
        orderBy: {
          price: 'asc',
        },
        skip: 0,
        take: 10,
      });
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: {
          category: { slug: 'cat-1' },
          isPublished: true,
        },
      });
    });
  });
});