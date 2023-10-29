import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SigninDTO {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
