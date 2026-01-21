import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class MarkReadDto {
  @ApiProperty({ example: [1, 2, 3], description: '收件箱消息ID列表' })
  @IsArray({ message: 'ID列表必须是数组' })
  @ArrayMinSize(1, { message: '请选择至少一条消息' })
  @IsNumber({}, { each: true, message: 'ID必须是数字' })
  ids: number[];
}
