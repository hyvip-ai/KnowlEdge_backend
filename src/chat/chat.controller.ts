import { Body, Controller, Param, Post } from '@nestjs/common';
import { ChatDTO } from './dto';
import { ChatService } from './chat.service';
import { User } from 'src/decorators';

@Controller('/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('/:id')
  chat(
    @User('organizationId') organizationId: string,
    @Param('id') chatroomId: string,
    @Body() data: ChatDTO,
  ) {
    return this.chatService.chat(organizationId, chatroomId, data);
  }

  @Post('/:id/start')
  startChat(@Param('id') chatroomId: string) {
    return this.chatService.startChat(chatroomId);
  }
}
