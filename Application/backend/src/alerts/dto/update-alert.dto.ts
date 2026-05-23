import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAlertDto {
  @IsOptional()
  @IsEnum(['pending', 'acknowledged', 'resolved'], {
    message: 'status must be pending, acknowledged, or resolved',
  })
  status?: 'pending' | 'acknowledged' | 'resolved';

  @IsOptional()
  @IsString()
  note?: string;
}
