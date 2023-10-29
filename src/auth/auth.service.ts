import { Injectable } from '@nestjs/common';
import { SigninDTO, SignupDTO } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private common: CommonService) {}

  async signUp(data: SignupDTO) {
    try {
      return {
        message: 'New user created successfully',
        statusCode: 201,
        data: {},
      };
    } catch (err) {
      this.common.generateErrorResponse(err, 'Member');
    }
  }

  async signIn(data: SigninDTO) {
    return null;
  }
}
