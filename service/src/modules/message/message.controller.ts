import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MarkReadDto } from './dto/markRead.dto';
import { PullMessageDto } from './dto/pullMessage.dto';
import { QueryMessageDto } from './dto/queryMessage.dto';
import { SendMessageDto } from './dto/sendMessage.dto';
import { MessageService } from './message.service';

@ApiTags('message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  @ApiOperation({ summary: '管理端推送站内信' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async sendMessage(@Body() body: SendMessageDto, @Req() req: Request) {
    return await this.messageService.sendMessage(body, req);
  }

  @Get('list')
  @ApiOperation({ summary: '用户收件箱列表' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async list(@Req() req: Request, @Query() query: QueryMessageDto) {
    return await this.messageService.listUserMessages(req, query);
  }

  @Get('pull')
  @ApiOperation({ summary: '用户收件箱增量拉取' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async pull(@Req() req: Request, @Query() query: PullMessageDto) {
    return await this.messageService.pullUserMessages(req, query);
  }

  @Get('unreadCount')
  @ApiOperation({ summary: '用户未读数量' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async unreadCount(@Req() req: Request) {
    return await this.messageService.getUnreadCount(req);
  }

  @Post('markRead')
  @ApiOperation({ summary: '标记站内信已读' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markRead(@Req() req: Request, @Body() body: MarkReadDto) {
    return await this.messageService.markRead(req, body);
  }
}
