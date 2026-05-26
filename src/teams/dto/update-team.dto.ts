import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên đội/trận đấu không được để trống' })
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Số trận thắng phải lớn hơn hoặc bằng 0' })
  wins?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Số trận thua phải lớn hơn hoặc bằng 0' })
  losses?: number;

  @IsOptional()
  @IsInt()
  goalsDifference?: number;
}
