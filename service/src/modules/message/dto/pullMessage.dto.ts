import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PullMessageDto {
  @ApiProperty({ example: 0, description: '上次拉取的收件箱消息ID', required: false })
  @IsOptional()
  afterId: number;

  @ApiProperty({ example: 20, description: '拉取数量', required: false })
  @IsOptional()
  size: number;
}
