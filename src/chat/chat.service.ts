import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatDTO } from './dto';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private common: CommonService, private prisma: PrismaService) {}

  async startChat(chatRoomId: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatRoomId,
      },
      select: {
        id: true,
        organization: {
          select: {
            name: true,
            openAIApiKey: true,
          },
        },
      },
    });

    if (!chatRoom) throw new BadRequestException('Chat room not found');

    if (!chatRoom.organization.openAIApiKey)
      throw new BadRequestException("You haven't added your openai api key");

    try {
      await this.common.startChat(
        chatRoomId,
        chatRoom.organization.name,
        chatRoom.organization.openAIApiKey,
      );
      const res = await this.common.generateAIResponse({
        chatRoomId: chatRoom.id,
        openAIApiKey: chatRoom.organization.openAIApiKey,
        question:
          'Give me top 5 question that I can ask based on the files, also give a gist of the files',
      });
      return { data: res, statusCode: 200, message: 'SUCCESS' };
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.message);
    }
  }

  async chat(organizationId: string, chatRoomId: string, data: ChatDTO) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        openAIApiKey: true,
      },
    });

    if (!organization.openAIApiKey)
      throw new BadRequestException("You haven't added your openai api key");

    try {
      const res = await this.common.generateAIResponse({
        question: data.question,
        chatHistory: data.chatHistory,
        openAIApiKey: organization.openAIApiKey,
        chatRoomId,
      });
      return { data: res, message: 'SUCCESS', statusCode: 200 };
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.message);
    }
  }

  // async endChat(userId: string, chatroomId: string) {
  //   return null;
  // }
}
