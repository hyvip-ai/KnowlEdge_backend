import { IsArray, IsString } from 'class-validator';

interface ChatMessage {
  content: string;
  role: 'ai' | 'user';
  context: any[];
}

export class ChatDTO {
  @IsString()
  question: string;

  @IsArray()
  chatHistory: ChatMessage[];
}
