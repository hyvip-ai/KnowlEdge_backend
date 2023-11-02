import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChatRoomDTO } from './dto';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class ChatRoomService {
  constructor(private common: CommonService, private prisma: PrismaService) {}

  async createChatRoom(organizationId: string, data: CreateChatRoomDTO) {
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

  async loadFiles(chatroomId: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatroomId,
      },
      select: {
        id: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!chatRoom) throw new BadRequestException('Chat room not found');

    try {
      await this.common.loadPDFs(chatRoom.id, chatRoom.organization.name);
      await this.prisma.chatRoom.update({
        where: {
          id: chatroomId,
        },
        data: {
          status: Status.READY,
        },
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.message);
    }
  }
}
