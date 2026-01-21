import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: '系统通知', description: '消息标题' })
  @IsNotEmpty({ message: '消息标题不能为空' })
  title: string;

  @ApiProperty({ example: '内容详情', description: '消息内容' })
  @IsNotEmpty({ message: '消息内容不能为空' })
  content: string;

  @ApiProperty({ example: 1, description: '发送类型 1:全量 2:指定用户' })
  @IsIn([1, 2], { message: '发送类型错误' })
  sendType: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: '指定用户ID列表',
    required: false,
  })
  @IsOptional()
  @ValidateIf(o => Number(o.sendType) === 2)
  @IsArray({ message: '用户ID必须是数组' })
  @ArrayMinSize(1, { message: '请选择至少一个用户' })
  @IsNumber({}, { each: true, message: '用户ID必须是数字' })
  userIds?: number[];
}
