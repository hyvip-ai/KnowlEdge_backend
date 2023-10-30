import { Injectable } from '@nestjs/common';
import { CreateChatRoomDTO } from './dto';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatRoomService {
  constructor(private common: CommonService, private prisma: PrismaService) {}

  async createChatRoom(organizationId: string, data: CreateChatRoomDTO) {
    try {
      const chatRoom = await this.prisma.chatRoom.create({
        data: {
          name: data.name,
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
}
