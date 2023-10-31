import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { decode } from 'base64-arraybuffer';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService, private common: CommonService) {}

  async uploadFile(chatRoomId: string, file: Express.Multer.File) {
    console.log(file);

    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatRoomId,
      },
      select: {
        id: true,
        name: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!chatRoom) throw new BadRequestException('No chat room found');

    const supabaseClient = this.common.getSupabaseClient();

    const fileName = `${new Date().getTime()}_${file.originalname
      .split(' ')
      .join('_')}`;

    const { data, error } = await supabaseClient.storage
      .from('KnowlEdge')
      .upload(
        `${chatRoom.organization.name}/chat_room_${chatRoom.id}/${fileName}`,
        decode(file.buffer.toString('base64')),
        {
          contentType: file.mimetype,
        },
      );

    if (error) {
      throw new HttpException(
        {
          message: error.message,
          error: (error as any).error,
          statusCode: (error as any).statusCode,
        },
        (error as any).statusCode,
      );
    }
    if (data) {
      return { data: {}, message: 'SUCCESS', statusCode: 201 };
    }
  }

  async filesByChatRoom(chatRoomId: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatRoomId,
      },
      select: {
        organization: {
          select: {
            name: true,
          },
        },
        id: true,
      },
    });

    const supabaseClient = this.common.getSupabaseClient();

    const { data, error } = await supabaseClient.storage
      .from('KnowlEdge')
      .list(`${chatRoom.organization.name}/chat_room_${chatRoom.id}`, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      throw new HttpException(
        {
          message: error.message,
          error: (error as any).error,
          statusCode: (error as any).statusCode,
        },
        (error as any).statusCode,
      );
    }
    if (data) {
      return { data, message: 'SUCCESS', statusCode: 201 };
    }
  }

  async signedUrl(chatRoomId: string, fileName: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatRoomId,
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

    const supabaseClient = this.common.getSupabaseClient();

    const { data, error } = await supabaseClient.storage
      .from('KnowlEdge')
      .createSignedUrl(
        `${chatRoom.organization.name}/chat_room_${chatRoom.id}/${fileName}`,
        300,
      );

    if (error) {
      throw new HttpException(
        {
          message: error.message,
          error: (error as any).error,
          statusCode: (error as any).statusCode,
        },
        (error as any).statusCode,
      );
    }
    if (data) {
      return { data, message: 'SUCCESS', statusCode: 201 };
    }

    return null;
  }

  async deleteFile(chatRoomId: string, fileName: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        id: chatRoomId,
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

    const supabaseClient = this.common.getSupabaseClient();

    const { data, error } = await supabaseClient.storage
      .from('KnowlEdge')
      .remove([
        `${chatRoom.organization.name}/chat_room_${chatRoom.id}/${fileName}`,
      ]);

    if (error) {
      throw new HttpException(
        {
          message: error.message,
          error: (error as any).error,
          statusCode: (error as any).statusCode,
        },
        (error as any).statusCode,
      );
    }
    if (data) {
      return { data: {}, message: 'SUCCESS', statusCode: 201 };
    }

    return null;
  }
}
