import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SigninDTO, SignupDTO } from './dto';
import { Public } from 'src/guards';
import { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ description: 'User signup' })
  @Public()
  @Post('/signup')
  signUp(@Body() data: SignupDTO) {
    return this.authService.signUp(data);
  }

  @ApiOperation({ description: 'User signin' })
  @Public()
  @Post('/signin')
  signIn(@Body() data: SigninDTO, @Res({ passthrough: true }) res: Response) {
    return this.authService.signIn(data, res);
  }

  @ApiOperation({ description: 'Get new access token' })
  @Public()
  @Post('/refresh')
  refresh(@Req() request: Request) {
    const cookies = request.cookies;
    return this.authService.refreshToken(cookies.refreshToken);
  }

  // DONE
  @ApiOperation({ description: 'User signout' })
  @Post('/signout')
  signOut(@Req() request: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = request.cookies;
    return this.authService.signOut(cookies.refreshToken, res);
  }
}
