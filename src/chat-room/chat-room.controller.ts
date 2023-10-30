import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { CreateChatRoomDTO } from './dto';
import { Roles, User } from 'src/decorators';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/guards';

@Controller('/chat-room')
export class ChatRoomController {
  constructor(private chatRoomService: ChatRoomService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/')
  createChatRoom(
    @User('organizationId') organizationId: string,
    @Body() data: CreateChatRoomDTO,
  ) {
    return this.chatRoomService.createChatRoom(organizationId, data);
  }

  @Get('/')
  allChatRooms(@User('organizationId') organizationId: string) {
    return this.chatRoomService.allChatRooms(organizationId);
  }
}
