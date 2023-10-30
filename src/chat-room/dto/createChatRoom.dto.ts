import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatRoomDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;
}
