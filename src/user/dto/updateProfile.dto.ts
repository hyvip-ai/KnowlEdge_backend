import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;
}
