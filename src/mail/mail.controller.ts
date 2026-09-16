import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
// import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
// import { UserRole } from 'src/user/dto/create-user.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // @Roles(UserRole.ADMIN)
  @Public()
  @Post('test')
  async sendTestEmail(
    @Body() body: { to: string; subject: string; message: string },
  ) {
    return await this.mailService.sendEmail(
      body.to,
      body.subject,
      body.message,
    );
  }
}
