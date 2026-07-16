import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../common/email/email.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ProjectStatus, MilestoneStatus, Role, ProjectFileKind } from '@prisma/client';

// Tỷ lệ milestone mặc định: Đặt cọc 30% / Giữa kỳ 40% / Bàn giao 30%
const DEFAULT_MILESTONES = [
  { name: 'Đặt cọc', percent: 30 },
  { name: 'Giữa kỳ', percent: 40 },
  { name: 'Bàn giao', percent: 30 },
];

@Injectable()
export class CustomProjectsService {
  private readonly logger = new Logger(CustomProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly emailService: EmailService,
  ) {}

  // ============ 1. YÊU CẦU BÁO GIÁ (public) ============

  /**
   * Tạo yêu cầu báo giá từ khách (không cần login).
   * Nếu khách đã login (userId truyền vào) thì gắn luôn, ngược lại lưu contactName/Email.
   */
  async createRequest(dto: CreateRequestDto, userId?: string) {
    const request = await this.prisma.customProjectRequest.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        budget: dto.budget ?? null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        userId: userId ?? null,
        contactName: userId ? null : dto.contactName ?? null,
        contactEmail: userId ? null : dto.contactEmail ?? null,
        status: ProjectStatus.NEW,
      },
    });

    // Gửi email notify cho admin (best-effort, không block)
    try {
      const to = (await this.getAdminNotifyEmail()) ?? 'admin@sourceban.com';
      await this.emailService.sendCustomRequestNotify(to, {
        title: request.title,
        type: request.type,
        budget: request.budget,
        contactName: request.contactName ?? 'Khách hàng',
        contactEmail: request.contactEmail ?? '',
      });
    } catch (err) {
      this.logger.error('Gửi email notify yêu cầu báo giá lỗi:', err);
    }

    return request;
  }

  // ============ 2. QUERY (admin/STAFF) ============

  /** List project để board Kanban (filter + trả đủ để FE group theo status). */
  async findAllForBoard(filter: {
    status?: ProjectStatus;
    assigneeId?: string;
    search?: string;
  }) {
    const where: Prisma.CustomProjectWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.assigneeId) where.assigneeId = filter.assigneeId;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { user: { email: { contains: filter.search, mode: 'insensitive' } } },
        { user: { name: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.customProject.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { messages: true, files: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Detail project (cho admin hoặc chủ dự án). */
  async findOne(id: string) {
    const project = await this.prisma.customProject.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        request: true,
        milestones: { orderBy: { sortOrder: 'asc' } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, email: true } } },
        },
        files: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    return project;
  }

  /** Danh sách dự án của 1 user (dashboard "Dự án của tôi"). */
  async findMyForBoard(userId: string) {
    return this.prisma.customProject.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        milestones: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, amount: true, percent: true, status: true, paidAt: true },
        },
        _count: { select: { messages: true, files: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ============ 3. PORTFOLIO (public) ============

  async findShowcase(filter: { type?: string; limit?: number }) {
    return this.prisma.customProject.findMany({
      where: {
        status: ProjectStatus.DELIVERED,
        isShowcase: true,
        ...(filter.type ? { request: { type: filter.type as any } } : {}),
      },
      include: {
        request: { select: { type: true } },
        user: { select: { name: true } },
        files: {
          where: { kind: ProjectFileKind.DELIVERABLE },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: filter.limit ?? 12,
    });
  }

  async findShowcaseDetail(slug: string) {
    const project = await this.prisma.customProject.findUnique({
      where: { slug },
      include: {
        request: { select: { type: true, description: true } },
        user: { select: { name: true } },
        files: { where: { kind: ProjectFileKind.DELIVERABLE }, orderBy: { version: 'desc' } },
        milestones: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!project || !project.isShowcase || project.status !== ProjectStatus.DELIVERED) {
      throw new NotFoundException('Không tìm thấy dự án');
    }
    return project;
  }

  // ============ 4. ADMIN QUẢN LÝ ============

  /** Tạo project từ 1 request (1-1). */
  async createFromRequest(requestId: string, userId: string) {
    const request = await this.prisma.customProjectRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu');
    const existingProject = await this.prisma.customProject.findUnique({
      where: { requestId },
    });
    if (existingProject) {
      throw new BadRequestException('Yêu cầu này đã có dự án');
    }
    return this.prisma.customProject.create({
      data: {
        requestId: request.id,
        userId: userId, // ưu tiên user đã login gửi request; nếu null thì lấy contact
        title: request.title,
        description: request.description,
        status: ProjectStatus.NEW,
      },
    });
  }

  /** Cập nhật assignee/deadline/priority/status (admin/STAFF). */
  async updateProject(id: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.customProject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy dự án');

    const data: Prisma.CustomProjectUpdateInput = {};
    if (dto.assigneeId !== undefined) data.assignee = { connect: { id: dto.assigneeId } };
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.customProject.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Nếu đổi status → trigger email + notification cho khách
    if (dto.status && dto.status !== existing.status) {
      await this.notifyStatusChange(updated, dto.status);
    }
    return updated;
  }

  // ============ 5. MILESTONE ============

  async addMilestone(projectId: string, dto: CreateMilestoneDto) {
    const project = await this.prisma.customProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    const max = await this.prisma.milestone.count({ where: { projectId } });
    const milestone = await this.prisma.milestone.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description ?? null,
        amount: dto.amount,
        percent: dto.percent ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        sortOrder: dto.sortOrder ?? max,
        status: MilestoneStatus.PENDING,
      },
    });
    return milestone;
  }

  /** Sinh 3 milestone mặc định 30/40/30 khi CONFIRMED. */
  async generateDefaultMilestones(projectId: string) {
    const project = await this.prisma.customProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    if (!project.quotedAmount) {
      throw new BadRequestException('Dự án chưa có giá báo (quotedAmount)');
    }

    // Xóa milestone cũ chưa thu (để regenerate sạch)
    await this.prisma.milestone.deleteMany({
      where: { projectId, status: MilestoneStatus.PENDING },
    });

    const created = await this.prisma.$transaction(
      DEFAULT_MILESTONES.map((m, i) =>
        this.prisma.milestone.create({
          data: {
            projectId,
            name: `${m.name} ${m.percent}%`,
            amount: Math.round((project.quotedAmount! * m.percent) / 100),
            percent: m.percent,
            sortOrder: i,
            status: MilestoneStatus.PENDING,
          },
        }),
      ),
    );
    return created;
  }

  async getMilestones(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: { payment: true },
    });
  }

  /** Tính công nợ: tổng milestone vs đã thu. */
  async getDebtSummary(projectId: string) {
    const milestones = await this.prisma.milestone.findMany({ where: { projectId } });
    const total = milestones.reduce((s, m) => s + m.amount, 0);
    const paid = milestones
      .filter((m) => m.status === MilestoneStatus.PAID)
      .reduce((s, m) => s + m.amount, 0);
    return {
      total,
      paid,
      remaining: total - paid,
      milestones: milestones.map((m) => ({
        id: m.id,
        name: m.name,
        amount: m.amount,
        status: m.status,
        paidAt: m.paidAt,
      })),
    };
  }

  /**
   * Tạo link thanh toán PayOS cho 1 milestone (tái dùng PaymentsService).
   * Lưu Payment + link vào Milestone.paymentId.
   */
  async createMilestonePayLink(
    projectId: string,
    milestoneId: string,
    user: { id: string; email: string },
  ) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });
    if (!milestone || milestone.projectId !== projectId) {
      throw new NotFoundException('Không tìm thấy milestone');
    }
    if (milestone.status === MilestoneStatus.PAID) {
      throw new BadRequestException('Milestone này đã thanh toán');
    }

    // Tạo Payment row (chưa thanh toán)
    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        provider: 'PAYOS' as any,
        amount: milestone.amount,
        status: 'PENDING',
        milestoneId,
        projectId,
      },
    });

    const { checkoutUrl, orderCode } = await this.paymentsService.createPaymentLink(
      {
        id: payment.id,
        total: milestone.amount,
        items: [{ productId: milestone.id, title: milestone.name, price: milestone.amount, qty: 1 }],
      },
      {
        description: `SourceBan - ${milestone.name} (Dự án ${milestone.project.title})`,
        returnUrl: (await this.getWebUrl()) + `/dashboard/projects/${projectId}?paid=${milestone.id}`,
        cancelUrl: (await this.getWebUrl()) + `/dashboard/projects/${projectId}`,
        isMilestone: true,
      },
    );

    // Lưu orderCode để webhook lookup + link payment vào milestone
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: String(orderCode) },
    });
    await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { paymentId: payment.id, status: MilestoneStatus.INVOICED },
    });

    return { checkoutUrl, paymentId: payment.id };
  }

  /** Webhook gọi: đánh dấu milestone đã thu. */
  async markMilestonePaid(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { milestone: { include: { project: { include: { user: true } } } } },
    });
    if (!payment || !payment.milestoneId) {
      throw new NotFoundException('Payment không liên kết milestone');
    }
    const milestone = payment.milestone!;
    if (milestone.status === MilestoneStatus.PAID) return milestone; // idempotent

    await this.prisma.$transaction([
      this.prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: MilestoneStatus.PAID, paidAt: new Date() },
      }),
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID' },
      }),
    ]);

    // Gửi email xác nhận thu tiền cho khách
    try {
      const email = milestone.project.user.email;
      if (email) {
        await this.emailService.sendMilestonePaidEmail(email, {
          projectTitle: milestone.project.title,
          milestoneName: milestone.name,
          amount: milestone.amount,
        });
      }
    } catch (err) {
      this.logger.error('Gửi email milestone paid lỗi:', err);
    }
    return milestone;
  }

  // ============ 6. MESSAGE ============

  async getMessages(projectId: string) {
    return this.prisma.projectMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
  }

  async sendMessage(
    projectId: string,
    senderId: string,
    isFromStaff: boolean,
    dto: SendMessageDto,
  ) {
    const project = await this.prisma.customProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    return this.prisma.projectMessage.create({
      data: {
        projectId,
        senderId,
        content: dto.content,
        isFromStaff,
      },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
  }

  // ============ 7. FILE ============

  async addFile(
    projectId: string,
    uploaderId: string,
    input: {
      name: string;
      fileKey: string;
      kind: ProjectFileKind;
      size?: number;
      mimeType?: string;
      version?: number;
    },
  ) {
    const project = await this.prisma.customProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    // Deliverable: auto-increment version nếu trùng tên
    let version = input.version ?? 1;
    if (input.kind === ProjectFileKind.DELIVERABLE) {
      const last = await this.prisma.projectFile.findFirst({
        where: { projectId, kind: ProjectFileKind.DELIVERABLE, name: input.name },
        orderBy: { version: 'desc' },
      });
      if (last) version = last.version + 1;
    }

    return this.prisma.projectFile.create({
      data: {
        projectId,
        uploaderId,
        name: input.name,
        fileKey: input.fileKey,
        kind: input.kind,
        size: input.size ?? null,
        mimeType: input.mimeType ?? null,
        version,
      },
    });
  }

  async getFiles(projectId: string) {
    return this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { id: true, name: true, email: true } } },
    });
  }

  // ============ HELPERS ============

  private async notifyStatusChange(project: any, status: ProjectStatus) {
    const email = project.user?.email;
    if (email) {
      try {
        await this.emailService.sendProjectUpdateEmail(email, {
          title: project.title,
          status,
        });
      } catch (err) {
        this.logger.error('Gửi email cập nhật dự án lỗi:', err);
      }
    }
  }

  private async getAdminNotifyEmail(): Promise<string | null> {
    const admin = await this.prisma.user.findFirst({
      where: { role: Role.ADMIN },
      select: { email: true },
    });
    return admin?.email ?? null;
  }

  private getWebUrl(): string {
    return process.env.WEB_URL || 'http://localhost:3000';
  }
}
