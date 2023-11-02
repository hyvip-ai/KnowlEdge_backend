import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
