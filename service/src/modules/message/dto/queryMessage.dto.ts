import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QueryMessageDto {
  @ApiProperty({ example: 1, description: '页码', required: false })
  @IsOptional()
  page: number;

  @ApiProperty({ example: 20, description: '每页数量', required: false })
  @IsOptional()
  size: number;
}
