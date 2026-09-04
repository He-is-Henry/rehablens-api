import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshDto,
  LogoutDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/create-auth.dto';
import {
  ClientData,
  type ISchemaClientData,
} from './decorators/client-info.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import type { Request } from 'express';
import { EditProfileDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(
    @Body() loginDto: LoginDto,
    @ClientData() clientData: ISchemaClientData,
  ) {
    return this.authService.login(loginDto, clientData);
  }

  @Get('profile')
  profile(@Req() req: Request) {
    return this.authService.getProfile(req.user!.id, req.user!.sessionId);
  }

  @Patch('profile')
  editProfile(@Req() req: Request, @Body() editProfileDto: EditProfileDto) {
    return this.authService.updateProfile(req.user!.id, editProfileDto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Public()
  @Post('logout')
  logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto.refreshToken);
  }

  @Delete('session/all')
  revokeAllSessions(@Req() req: Request) {
    return this.authService.revokeAllSessions(
      req.user!.id,
      req.user!.sessionId,
    );
  }

  @Delete('session/:sessionId')
  revokeSession(@Param('sessionId') sessionId: string, @Req() req: Request) {
    return this.authService.revokeSession(req.user!.id, sessionId);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
