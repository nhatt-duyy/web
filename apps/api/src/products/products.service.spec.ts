import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';
import { SearchService } from '../search/search.service';
import { StorageService } from '../storage/storage.service';
import { EncryptionService } from '../common/encryption/encryption.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;
  let storage: StorageService;
  let encryption: EncryptionService;
  let search: any;

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
              findFirst: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            licenseTier: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
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
        {
          provide: StorageService,
          useValue: {
            getObjectBuffer: jest.fn(),
            putObjectBuffer: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService) as any;
    storage = module.get<StorageService>(StorageService);
    encryption = module.get<EncryptionService>(EncryptionService);
    search = module.get<SearchService>(SearchService) as any;
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

  describe('generateSlug (private)', () => {
    it('lowercase + dash, giữ nguyên ký tự không phải word', () => {
      expect((service as any).generateSlug('Hoc Lap Trinh Dep!')).toBe('hoc-lap-trinh-dep');
    });
    it('trim dash thừa', () => {
      expect((service as any).generateSlug('  Tieu De  ')).toBe('tieu-de');
    });
  });

  describe('findLanguages', () => {
    it('trả {value,label} đã sort, lọc null', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([
        { language: 'javascript' },
        { language: null },
        { language: 'react' },
      ] as any);
      const res = await service.findLanguages();
      expect(res).toEqual([
        { value: 'javascript', label: 'Javascript' },
        { value: 'react', label: 'React' },
      ]);
    });
  });

  describe('findOne', () => {
    it('findUnique kèm category + tiers + reviews', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({ id: 'p-1' } as any);
      await service.findOne('p-1');
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } }, reviews: true },
      });
    });
  });

  describe('findOneBySlug', () => {
    it('slug không tồn tại → NotFound', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(null);
      await expect(service.findOneBySlug('x')).rejects.toThrow(NotFoundException);
    });
    it('trả product publish + review APPROVED', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue({ id: 'p-1', slug: 'x' } as any);
      const res = await service.findOneBySlug('x');
      expect(res.id).toBe('p-1');
      const arg = prisma.product.findFirst.mock.calls[0][0];
      expect(arg.where).toEqual({ slug: 'x', isPublished: true });
      expect(arg.include.reviews.where).toEqual({ status: 'APPROVED' });
    });
  });

  describe('getRelated', () => {
    it('cùng category, loại trừ id hiện tại', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([{ id: 'p-2' }] as any);
      await service.getRelated('p-1', 'cat-1', 4);
      const arg = (prisma.product.findMany as jest.Mock).mock.calls[0][0];
      expect(arg.where).toEqual({ categoryId: 'cat-1', isPublished: true, NOT: { id: 'p-1' } });
      expect(arg.take).toBe(4);
    });
  });

  describe('update', () => {
    it('đổi slug khi có title mới', async () => {
      jest.spyOn(prisma.product, 'update').mockResolvedValue({ id: 'p-1' } as any);
      await service.update('p-1', { title: 'Tiêu đề mới' } as any);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: expect.objectContaining({ slug: 'tiu-mi' }),
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
      });
    });
    it('thay thế tiers (xóa hết + tạo mới) trong transaction', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue(undefined);
      jest.spyOn(prisma.product, 'update').mockResolvedValue({ id: 'p-1' } as any);
      await service.update('p-1', {
        tiers: [{ name: 'Extended', slug: 'extended', price: 99, sortOrder: 1 }],
      } as any);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
      const tx = prisma.$transaction.mock.calls[0][0] as any[];
      expect(tx).toHaveLength(2);
      expect(prisma.licenseTier.deleteMany).toHaveBeenCalledWith({ where: { productId: 'p-1' } });
      expect(prisma.licenseTier.createMany).toHaveBeenCalled();
      const created = prisma.licenseTier.createMany.mock.calls[0][0].data[0];
      expect(created.name).toBe('Extended');
    });
    it('lỗi P2025 → NotFound', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('nf', { code: 'P2025', clientVersion: '1' });
      jest.spyOn(prisma.product, 'update').mockRejectedValue(err);
      await expect(service.update('px', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('xóa + removeProduct khỏi search index', async () => {
      jest.spyOn(prisma.product, 'delete').mockResolvedValue({ id: 'p-1' } as any);
      await service.remove('p-1');
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
      expect((search as any).removeProduct).toHaveBeenCalledWith('p-1');
    });
    it('lỗi P2025 → NotFound', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('nf', { code: 'P2025', clientVersion: '1' });
      jest.spyOn(prisma.product, 'delete').mockRejectedValue(err);
      await expect(service.remove('px')).rejects.toThrow(NotFoundException);
    });
  });

  describe('encryptSource (Phase 5)', () => {
    it('throw NotFound nếu product không tồn tại', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null);
      await expect(service.encryptSource('p-x')).rejects.toThrow(NotFoundException);
    });

    it('throw NotFound nếu product không có fileKey', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({
        id: 'p-1',
        fileKey: null,
      } as any);
      await expect(service.encryptSource('p-1')).rejects.toThrow(NotFoundException);
    });

    it('idempotent: fileKey đã endsWith(".enc") → trả sớm, không gọi storage', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({
        id: 'p-1',
        fileKey: 'products/p-1/source.zip.enc',
      } as any);

      const result = await service.encryptSource('p-1');

      expect(result.encrypted).toBe(true);
      expect(storage.getObjectBuffer).not.toHaveBeenCalled();
      expect(encryption.encrypt).not.toHaveBeenCalled();
      expect(storage.putObjectBuffer).not.toHaveBeenCalled();
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('happy path: đọc buffer → encrypt → putObjectBuffer key+".enc" → update fileKey', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({
        id: 'p-1',
        fileKey: 'products/p-1/source.zip',
      } as any);
      const plain = Buffer.from('plain-source');
      const encrypted = Buffer.from('encrypted-source');
      jest.spyOn(storage, 'getObjectBuffer').mockResolvedValue(plain);
      jest.spyOn(encryption, 'encrypt').mockReturnValue(encrypted);
      jest.spyOn(storage, 'putObjectBuffer').mockResolvedValue(undefined);
      jest.spyOn(prisma.product, 'update').mockResolvedValue({
        id: 'p-1',
        fileKey: 'products/p-1/source.zip.enc',
      } as any);

      const result = await service.encryptSource('p-1');

      expect(storage.getObjectBuffer).toHaveBeenCalledWith('products/p-1/source.zip');
      expect(encryption.encrypt).toHaveBeenCalledWith(plain);
      expect(storage.putObjectBuffer).toHaveBeenCalledWith(
        'products/p-1/source.zip.enc',
        encrypted,
        'application/octet-stream',
      );
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: { fileKey: 'products/p-1/source.zip.enc' },
      });
      expect(result.fileKey).toBe('products/p-1/source.zip.enc');
      expect(result.encrypted).toBe(true);
    });
  });
});