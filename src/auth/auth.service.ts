import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ForgotPasswordDTO,
  ResetPasswordDTO,
  SigninDTO,
  SignupDTO,
} from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private common: CommonService,
    private config: ConfigService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signUp(data: SignupDTO) {
    try {
      const passwordHash = await this.common.hashData(data.password);

      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          organization: {
            create: {
              name: data.organizationName,
            },
          },
          password: passwordHash,
          role: Role.ADMIN,
        },
        select: {
          id: true,
          name: true,
          email: true,
          organization: { select: { name: true } },
        },
      });

      await this.mailService.onBoardingEmail(user.name, user.email);

      return {
        message: 'New user created successfully',
        statusCode: 201,
        data: user,
      };
    } catch (err) {
      this.common.generateErrorResponse(err, 'User');
    }
  }

  async signIn(data: SigninDTO, res: Response) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: data.email,
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        organizationId: true,
      },
    });

    if (!user) throw new BadRequestException('User not found');

    const pwMatches = await argon2.verify(user.password, data.password);

    if (!pwMatches) throw new ForbiddenException('Wrong credentials provided');

    try {
      // else Generate access and refresh token with required fields
      const { accessToken, refreshToken } = await this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.organizationId,
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 24 * 60 * 1000,
      });

      // Response
      res.json({
        message: 'Logged in successfully',
        statusCode: 200,
        data: {
          accessToken,
          id: user.id,
          role: user.role,
        },
      });
    } catch (err) {
      this.common.generateErrorResponse(err, 'User');
    }
  }

  async signOut(refreshToken: string, res: Response) {
    if (!refreshToken)
      throw new UnauthorizedException('No Refresh token provided');

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get('REFRESH_TOKEN_SECRET'),
      });
    } catch (err) {
      throw new UnauthorizedException('You are not authorized');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
      },
    });

    if (!user) throw new BadRequestException('User not found');

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    return { data: {}, statusCode: 200, message: 'Signed out successfully' };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('You are not authenticated');

    let data: JwtPayload;

    try {
      data = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get('REFRESH_TOKEN_SECRET'),
      });
    } catch (err) {
      throw new UnauthorizedException('You are not authorized');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        id: data.sub,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.organizationId,
    );
    return { data: { accessToken, role: user.role }, statusCode: 200 };
  }

  async forgotPassword(data: ForgotPasswordDTO) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: data.email,
      },
      select: {
        passwordToken: true,
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) throw new ForbiddenException('User not found');

    if (user.passwordToken) throw new BadRequestException('Emil already sent');

    const token = this.common.customToken();

    try {
      await this.prisma.user.update({
        where: { email: data.email },
        data: {
          passwordToken: token,
        },
        select: {
          passwordToken: true,
        },
      });
      await this.mailService.forgotPasswordEmail(
        user.email,
        user.name,
        encodeURIComponent(token),
      );
      return {
        data: {},
        message: 'Email sent successfully',
        statusCode: 200,
      };
    } catch (err) {
      this.common.generateErrorResponse(err, 'User');
    }
  }

  async resetPassword(data: ResetPasswordDTO) {
    if (data.password !== data.passwordConfirmation) {
      throw new BadRequestException(
        'Password and password confirmation must be same',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        passwordToken: data.token,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) throw new ForbiddenException('User not found');

    try {
      const hash = await this.common.hashData(data.password);

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordToken: null,
          password: hash,
        },
      });

      await this.mailService.resetPasswordEmail(user.email, user.name);

      return {
        data: {},
        statusCode: 200,
        message: 'password updated successfully',
      };
    } catch (err) {
      this.common.generateErrorResponse(err, 'User');
    }
  }

  async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const at = this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
        organizationId,
      },
      {
        expiresIn: 60 * 15,
        secret: this.config.get('ACCESS_TOKEN_SECRET'),
      },
    );

    const rt = this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
        organizationId,
      },
      {
        expiresIn: 60 * 60 * 24 * 365,
        secret: this.config.get('REFRESH_TOKEN_SECRET'),
      },
    );

    try {
      const [accessToken, refreshToken] = await Promise.all([at, rt]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (err) {
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateAccessToken(
    userId: string,
    email: string,
    role: string,
    organizationId: string,
  ) {
    const at = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
        organizationId,
      },
      {
        expiresIn: 60 * 15,
        secret: this.config.get('ACCESS_TOKEN_SECRET'),
      },
    );
    return at;
  }
}
