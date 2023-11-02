import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InviteUserDTO, SetBasicDTO, UpdateProfileDTO } from './dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private common: CommonService,
    private mailService: MailService,
  ) {}

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

  async allUsers(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return { data: users, message: 'SUCCESS', statusCode: 200 };
  }

  async inviteUsers(
    userId: string,
    organizationId: string,
    data: InviteUserDTO,
  ) {
    const inviter = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!inviter) throw new BadRequestException('Inviter not found');

    try {
      const userPromises = [];
      const mailPromises = [];
      for (const email of data.emails) {
        const token = this.common.customToken();
        const prismaPromise = this.prisma.user.create({
          data: {
            email,
            passwordToken: token,
            invitedById: userId,
            organizationId,
          },
        });
        userPromises.push(prismaPromise);
        const mailPromise = this.mailService.invitationEmail(
          inviter.name,
          inviter.organization.name,
          token,
          email,
        );
        mailPromises.push(mailPromise);
      }
      await Promise.all(userPromises);
      await Promise.all(mailPromises);
      return {
        data: {},
        message: 'Invitation sent successfully',
        statusCode: '',
      };
    } catch (err) {
      this.common.generateErrorResponse(err, 'User');
    }
  }

  async setBasic(data: SetBasicDTO) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordToken: data.token,
      },
      select: {
        id: true,
      },
    });

    if (!user) throw new BadRequestException('User not found');

    try {
      const hashedPassword = await this.common.hashData(data.password);
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: data.name,
          password: hashedPassword,
          passwordToken: null,
        },
      });
    } catch (err) {
      this.common.generateErrorResponse(err, 'User');
    }
  }
}
