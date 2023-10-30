import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

    return { data: user, message: 'SUCCES', statusCode: 200 };
  }
}
