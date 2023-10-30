import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatRoomDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}
