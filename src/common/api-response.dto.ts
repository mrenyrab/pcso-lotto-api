import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto {
  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: String, format: 'date-time' })
  action_at: Date;

  @ApiProperty({
    description: 'Endpoint-specific response payload.',
    oneOf: [
      { type: 'object', additionalProperties: true },
      {
        type: 'array',
        items: { type: 'object', additionalProperties: true },
      },
    ],
  })
  data: object | object[];
}
