import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 lần/phút/IP — chặn brute-force
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.auth.login(dto, req.ip);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.auth.forgotPassword(email);
  }

  @Post('reset-password')
  resetPassword(@Body('token') token: string, @Body('password') password: string) {
    return this.auth.resetPassword(token, password);
  }

  @Post('send-verify')
  sendVerify(@Body('email') email: string) {
    return this.auth.sendVerifyEmail(email);
  }

  @Get('verify')
  verify(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }
}
