import { BaseEntity } from 'src/common/entity/baseEntity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'message' })
export class MessageEntity extends BaseEntity {
  @Column({ comment: '消息标题', length: 200 })
  title: string;

  @Column({ comment: '消息内容', type: 'mediumtext' })
  content: string;

  @Column({ comment: '发送人ID', nullable: true })
  senderId: number;

  @Column({ comment: '发送人名称', nullable: true, length: 64 })
  senderName: string;

  @Column({ comment: '发送类型 1:全量 2:指定用户', default: 1 })
  sendType: number;
}
