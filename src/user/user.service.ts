import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDTO } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private common: CommonService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) throw new BadRequestException('User not found');

    return { data: user, message: 'SUCCESS', statusCode: 200 };
  }

  async updateProfile(userId: string, data: UpdateProfileDTO) {
    try {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: data.name,
        },
      });
    } catch (err) {
      this.common.generateErrorResponse(err, 'User');
    }
  }
}
