import { IsString } from 'class-validator';

export class ChatDTO {
  @IsString()
  question: string;
}
