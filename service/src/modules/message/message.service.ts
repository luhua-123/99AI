import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { MarkReadDto } from './dto/markRead.dto';
import { PullMessageDto } from './dto/pullMessage.dto';
import { QueryMessageDto } from './dto/queryMessage.dto';
import { SendMessageDto } from './dto/sendMessage.dto';
import { MessageEntity } from './message.entity';
import { MessageRecipientEntity } from './messageRecipient.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntity: Repository<MessageEntity>,
    @InjectRepository(MessageRecipientEntity)
    private readonly messageRecipientEntity: Repository<MessageRecipientEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
  ) {}

  private mapRow(row: any) {
    return {
      recipientId: Number(row.recipientId),
      messageId: Number(row.messageId),
      title: row.title,
      content: row.content,
      createdAt: row.createdAt,
      senderName: row.senderName,
      isRead: Boolean(row.isRead),
      readAt: row.readAt,
    };
  }

  private async insertRecipients(messageId: number, userIds: number[]) {
    const batchSize = 1000;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize).map(userId => ({
        messageId,
        userId,
        isRead: false,
      }));
      await this.messageRecipientEntity.insert(batch);
    }
  }

  async sendMessage(body: SendMessageDto, req: Request) {
    const { title, content, sendType, userIds = [] } = body;
    const senderId = req.user?.id || null;
    const senderName = req.user?.username || '';

    const message = await this.messageEntity.save({
      title,
      content,
      sendType: Number(sendType),
      senderId,
      senderName,
    });

    let targetIds: number[] = [];

    if (Number(sendType) === 1) {
      const users = await this.userEntity.find({ select: ['id'] });
      targetIds = users.map(user => user.id);
    } else {
      const uniqueIds = Array.from(new Set(userIds.map(id => Number(id)))).filter(Boolean);
      if (!uniqueIds.length) {
        throw new HttpException('请选择要推送的用户', HttpStatus.BAD_REQUEST);
      }
      const users = await this.userEntity.find({
        where: { id: In(uniqueIds) },
        select: ['id'],
      });
      targetIds = users.map(user => user.id);
    }

    if (!targetIds.length) {
      throw new HttpException('未找到可推送的用户', HttpStatus.BAD_REQUEST);
    }

    await this.insertRecipients(message.id, targetIds);

    return {
      messageId: message.id,
      total: targetIds.length,
    };
  }

  async listUserMessages(req: Request, query: QueryMessageDto) {
    const { id: userId } = req.user;
    const page = Number(query.page || 1);
    const size = Number(query.size || 20);

    const qb = this.messageRecipientEntity
      .createQueryBuilder('mr')
      .leftJoin(MessageEntity, 'm', 'm.id = mr.messageId')
      .where('mr.userId = :userId', { userId })
      .select([
        'mr.id AS recipientId',
        'mr.isRead AS isRead',
        'mr.readAt AS readAt',
        'm.id AS messageId',
        'm.title AS title',
        'm.content AS content',
        'm.createdAt AS createdAt',
        'm.senderName AS senderName',
      ])
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const rows = await qb.getRawMany();
    const count = await this.messageRecipientEntity.count({ where: { userId } });

    return {
      rows: rows.map(row => this.mapRow(row)),
      count,
    };
  }

  async pullUserMessages(req: Request, query: PullMessageDto) {
    const { id: userId } = req.user;
    const afterId = Number(query.afterId || 0);
    const size = Number(query.size || 20);

    const qb = this.messageRecipientEntity
      .createQueryBuilder('mr')
      .leftJoin(MessageEntity, 'm', 'm.id = mr.messageId')
      .where('mr.userId = :userId', { userId })
      .andWhere('mr.id > :afterId', { afterId })
      .select([
        'mr.id AS recipientId',
        'mr.isRead AS isRead',
        'mr.readAt AS readAt',
        'm.id AS messageId',
        'm.title AS title',
        'm.content AS content',
        'm.createdAt AS createdAt',
        'm.senderName AS senderName',
      ])
      .orderBy('mr.id', 'ASC')
      .take(size);

    const rows = await qb.getRawMany();
    const unreadCount = await this.messageRecipientEntity.count({
      where: { userId, isRead: false },
    });

    const latestRecipientId = rows.length
      ? Number(rows[rows.length - 1].recipientId)
      : afterId;

    return {
      rows: rows.map(row => this.mapRow(row)),
      unreadCount,
      latestRecipientId,
    };
  }

  async getUnreadCount(req: Request) {
    const { id: userId } = req.user;
    const unreadCount = await this.messageRecipientEntity.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  async markRead(req: Request, body: MarkReadDto) {
    const { id: userId } = req.user;
    const { ids } = body;
    if (!ids || !ids.length) {
      throw new HttpException('请选择要更新的消息', HttpStatus.BAD_REQUEST);
    }
    const res = await this.messageRecipientEntity.update(
      { id: In(ids), userId },
      { isRead: true, readAt: new Date() },
    );
    if (!res.affected) {
      throw new HttpException('消息更新失败', HttpStatus.BAD_REQUEST);
    }
    return '已更新为已读';
  }
}
