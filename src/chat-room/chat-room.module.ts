import { Module } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { ChatRoomController } from './chat-room.controller';

@Module({
  providers: [ChatRoomService],
  controllers: [ChatRoomController]
})
export class ChatRoomModule {}
