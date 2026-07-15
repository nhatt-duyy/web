import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, PostType, PostStatus } from '@prisma/client';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // PUBLIC: danh sách bài xuất bản (web /blog, /pages).
  @Get()
  findPublic(
    @Query('type') type?: PostType,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findPublic({
      type,
      category,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ADMIN: danh sách quản trị (mọi trạng thái).
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllAdmin(
    @Query('type') type?: PostType,
    @Query('status') status?: PostStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findAllAdmin({
      type,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ADMIN: chi tiết bài để sửa.
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOneAdmin(@Param('id') id: string) {
    return this.postsService.findOneAdmin(id);
  }

  // PUBLIC: chi tiết bài theo slug (tăng viewCount).
  @Get(':slug')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.postsService.findPublicBySlug(slug);
  }

  // ADMIN: tạo bài.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    const authorId = (req.user as { id: string }).id;
    return this.postsService.create(dto, authorId);
  }

  // ADMIN: cập nhật bài.
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  // ADMIN: xóa bài.
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
