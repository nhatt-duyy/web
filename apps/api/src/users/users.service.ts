import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách user: search email/name, lọc role + isActive, phân trang.
  // Dùng _count để lấy số đơn/license không gây N+1.
  async findAll(query: {
    email?: string;
    name?: string;
    role?: Role;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { email, name, role, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    // Chỉ lọc khi thực sự có từ khóa — tránh contains:'' khớp tất cả.
    if (email || name) {
      const or: Prisma.UserWhereInput[] = [];
      if (email) or.push({ email: { contains: email, mode: 'insensitive' } });
      if (name) or.push({ name: { contains: name, mode: 'insensitive' } });
      where.OR = or;
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          image: true,
          createdAt: true,
          _count: { select: { orders: true, licenses: true, reviews: true, tickets: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit };
  }

  // Chi tiết user kèm orders/licenses/tickets/reviews — include chọn lọc, chống N+1.
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        emailVerifiedAt: true,
        _count: { select: { orders: true, licenses: true, reviews: true, tickets: true } },
        orders: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, total: true, status: true, createdAt: true } },
        licenses: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, key: true, downloadCount: true, downloadLimit: true, product: { select: { title: true } } } },
        tickets: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, subject: true, status: true, priority: true, createdAt: true } },
        reviews: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, rating: true, comment: true, status: true, product: { select: { title: true } } } },
      },
    });

    if (!user) throw new NotFoundException(`Không tìm thấy user ${id}`);
    return user;
  }

  // Đổi vai trò — chỉ ADMIN. Không cho tự đổi vai trò của chính mình.
  async changeRole(id: string, role: Role, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('Bạn không thể tự đổi vai trò của chính mình');
    }
    const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) throw new NotFoundException(`Không tìm thấy user ${id}`);

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  // Khóa/mở tài khoản — chỉ ADMIN. Không cho tự khóa mình (tránh kẹt quyền).
  async setActive(id: string, isActive: boolean, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('Bạn không thể tự khóa/mở tài khoản của chính mình');
    }
    const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) throw new NotFoundException(`Không tìm thấy user ${id}`);

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, name: true, isActive: true },
    });
  }

  async findUserOrders(id: string) {
    return this.prisma.order.findMany({
      where: { userId: id },
      include: { items: { include: { product: { select: { title: true, thumbnail: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUserLicenses(id: string) {
    return this.prisma.license.findMany({
      where: { userId: id },
      include: { product: { select: { title: true } }, tier: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
