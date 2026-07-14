import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call prisma.category.findMany with correct options', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Category 1',
          slug: 'cat-1',
          products: [{}, {}], // _count will be { products: 2 }
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category if found', async () => {
      const mockCategory = {
        id: '1',
        name: 'Category 1',
        slug: 'cat-1',
        products: [{}, {}],
      };

      jest.spyOn(prisma.category, 'findUnique').mockResolvedValue(mockCategory);

      const result = await service.findOne('cat-1');

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'cat-1' },
        include: { _count: { select: { products: true } } },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(prisma.category, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Không tìm thấy danh mục với slug "non-existent"',
      );
    });
  });
});