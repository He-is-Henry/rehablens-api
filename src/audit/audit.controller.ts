import { Body, Controller, Get, Patch, Query, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import type { Request } from 'express';

@Controller('activity')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getActivity(
    @Req() req: Request,
    @Query('unseenOnly') unseenOnly: string,
    @Query('limit') limit: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.auditService.findForUser(
      req.user!.id,
      unseenOnly === 'true',
      limit ? Number(limit) : 30,
      cursor,
    );
  }

  @Get('unseen-count')
  getUnseenCount(@Req() req: Request) {
    return this.auditService.countUnseen(req.user!.id);
  }

  @Patch('mark-seen')
  markSeen(@Body('logIds') logIds: string[], @Req() req: Request) {
    return this.auditService.markSeen(req.user!.id, logIds);
  }
}
