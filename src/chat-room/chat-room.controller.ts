import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { CreateChatRoomDTO } from './dto';
import { Roles, User } from 'src/decorators';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/guards';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Chat Room')
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

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('/:id')
  chatRoomDetails(@Param('id') chatRoomId: string) {
    return this.chatRoomService.chatRoomDetails(chatRoomId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('/:id')
  editChatRoomDetails(
    @Param('id') chatRoomId: string,
    @Body() data: CreateChatRoomDTO,
  ) {
    return this.chatRoomService.editChatRoomDetails(chatRoomId, data);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/:id/load')
  loadFiles(@Param('id') chatroomId: string) {
    return this.chatRoomService.loadFiles(chatroomId);
  }
}
