import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        socketTimeout: 5000,
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
