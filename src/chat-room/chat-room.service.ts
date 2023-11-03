import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChatRoomDTO } from './dto';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatRoomService {
  constructor(private common: CommonService, private prisma: PrismaService) {}

  async createChatRoom(organizationId: string, data: CreateChatRoomDTO) {
    const allChatRooms = await this.allChatRooms(organizationId);
    if (allChatRooms.data.length === 2) {
      throw new BadRequestException(
        "Can't create more than 2 chat rooms with SOLO plan",
      );
    }
    try {
      const chatRoom = await this.prisma.chatRoom.create({
        data: {
          name: data.name,
          description: data.description || '',
          organizationId,
        },
        select: {
          id: true,
          name: true,
        },
      });
      return { data: chatRoom, message: 'SUCCESS', statusCode: 201 };
    } catch (err) {
      this.common.generateErrorResponse(err, 'Chat room');
    }
  }

  async allChatRooms(organizationId: string) {
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
      },
    });

    const modifiedChatRoom = chatRooms.map((chatRoom) => ({
      ...chatRoom,
    }));

    return { data: modifiedChatRoom, message: 'SUCCESS', statusCode: 200 };
  }

  async chatRoomDetails(chatRoomId: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatRoomId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
      },
    });
    return { data: chatRoom, message: 'SUCCESS', statusCode: 200 };
  }

  async editChatRoomDetails(chatRoomId: string, data: CreateChatRoomDTO) {
    try {
      await this.prisma.chatRoom.update({
        where: {
          id: chatRoomId,
        },
        data: {
          name: data.name,
          description: data.description,
        },
      });
    } catch (err) {
      this.common.generateErrorResponse(err, 'Chat Room');
    }
  }
}
