import { Body, Controller, Post } from '@nestjs/common';
import { ChatDTO } from './dto';
import { ChatService } from './chat.service';
import { Public } from 'src/guards';

@Controller('/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Public()
  @Post('/')
  chat(@Body() data: ChatDTO) {
    return this.chatService.chat(data);
  }
}
