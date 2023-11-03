import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Status } from '@prisma/client';
import { decode } from 'base64-arraybuffer';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FileService {
  constructor(
    private prisma: PrismaService,
    private common: CommonService,
    private config: ConfigService,
  ) {}

  async uploadFile(chatRoomId: string, file: Express.Multer.File) {
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
        status: true,
      },
    });

    if (!chatRoom) throw new BadRequestException('No chat room found');

    const files = await this.filesByChatRoom(chatRoomId);

    if (files.data.length === 2)
      throw new BadRequestException(
        'You can only upload maximum 2 files in a chatroom with SOLO plan',
      );

    const supabaseClient = this.common.getSupabaseClient();

    const fileName = `${new Date().getTime()}_${file.originalname
      .split(' ')
      .join('_')}`;

    const { data, error } = await supabaseClient.storage
      .from(this.config.get('SUPABASE_BUCKET_NAME'))
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

    try {
      if (chatRoom.status === Status.PENDING) {
        await this.common.updateChatRoomStatus(chatRoomId, Status.READY);
      }
    } catch (err) {
      this.common.generateErrorResponse(err, 'Chat room');
    }

    return { data: data.path, message: 'SUCCESS', statusCode: 201 };
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
      .from(this.config.get('SUPABASE_BUCKET_NAME'))
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

    const files = data.filter(
      (file) => file.name !== '.emptyFolderPlaceholder',
    );

    return { data: files, message: 'SUCCESS', statusCode: 201 };
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
      .from(this.config.get('SUPABASE_BUCKET_NAME'))
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

    const { error } = await supabaseClient.storage
      .from(this.config.get('SUPABASE_BUCKET_NAME'))
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

    const files = await this.filesByChatRoom(chatRoomId);

    try {
      if (!files.data.length) {
        await this.common.updateChatRoomStatus(chatRoomId, Status.PENDING);
      }
    } catch (err) {
      this.common.generateErrorResponse(err, 'Chat room');
    }

    return { data: {}, message: 'SUCCESS', statusCode: 201 };
  }
}
