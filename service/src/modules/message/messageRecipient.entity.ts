import { BaseEntity } from 'src/common/entity/baseEntity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'message_recipient' })
export class MessageRecipientEntity extends BaseEntity {
  @Column({ comment: '消息ID' })
  messageId: number;

  @Column({ comment: '用户ID' })
  userId: number;

  @Column({ comment: '是否已读', default: false })
  isRead: boolean;

  @Column({ comment: '已读时间', nullable: true, type: 'datetime' })
  readAt: Date;
}
