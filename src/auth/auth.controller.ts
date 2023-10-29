import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SigninDTO, SignupDTO } from './dto';
import { Public } from 'src/guards';

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
}
