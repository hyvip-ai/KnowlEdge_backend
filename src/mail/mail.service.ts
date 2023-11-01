import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async onBoardingEmail(name: string, email: string) {
    await this.mailerService.sendMail({
      to: email,
      from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
      subject: 'Welcome to KnowlEdge!!',
      html: `
        <h2>Welcome to KnowlEdge! We're very excited to have you on board.</h2>
        <div>To get started with KnowlEdge, please click here: <a href="${this.config.get(
          'CORE_FRONTEND_URL',
        )}/auth/signup">Sign In</a></div>
        <p>Need help, or have questions? Just reply to this email, we'd love to help</p>
        <p>Copyright © 2023 KnowlEdge. All rights reserved.</p>
      `,
    });
  }

  async invitationEmail(
    inviterName: string,
    organizationName: string,
    email: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
      subject: `${inviterName} invited you to join ${organizationName} on KnowlEdge`,
      html: `      
      <h2><b>${inviterName}</b> invited you to join <b>${organizationName}</b> organization on KnowlEdge</h2>
      <div>To get started with KnowlEdge, please click here: <a href="">Accept the Invite</a></div>
      <p>Need help, or have questions? Just reply to this email, we'd love to help</p>
      <p>Copyright © 2023 KnowlEdge. All rights reserved.</p>
      `,
    });
  }

  async forgotPasswordEmail(email: string) {
    await this.mailerService.sendMail({
      to: 'rajat.abcx@gmail.com',
      from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
      subject: 'Welcome to Nice App! Confirm your Email',
      html: `<p>Hey how are you doing on this lovely day</p>`,
    });
  }

  async resetPasswordEmail(email: string) {
    await this.mailerService.sendMail({
      to: 'rajat.abcx@gmail.com',
      from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
      subject: 'Welcome to Nice App! Confirm your Email',
      html: `<p>Hey how are you doing on this lovely day</p>`,
    });
  }
}
