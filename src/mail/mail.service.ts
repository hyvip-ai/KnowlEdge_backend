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
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
        subject: 'Welcome to KnowlEdge!!',
        html: `
        <h2>${name} welcome to KnowlEdge! We're very excited to have you on board.</h2>
        <div>To get started with KnowlEdge, please click here: <a href="${this.config.get(
          'CORE_FRONTEND_URL',
        )}/auth/signup">Sign In</a></div>
        <p>Need help, or have questions? Just reply to this email, we'd love to help</p>
        <p>Copyright © 2023 KnowlEdge. All rights reserved.</p>
      `,
      });
    } catch (err) {
      console.log(err.message);
      console.log(`Onboarding email sending error for ${email}`);
    }
  }

  async invitationEmail(
    inviterName: string,
    organizationName: string,
    token: string,
    email: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
        subject: `${inviterName} invited you to join ${organizationName} on KnowlEdge`,
        html: `      
      <h2><b>${inviterName}</b> invited you to join <b>${organizationName}</b> organization on KnowlEdge</h2>
      <div>To get started with KnowlEdge, please click here: <a href="${this.config.get(
        'CORE_FRONTEND_URL',
      )}/auth/accept-invite?token=${encodeURIComponent(
          token,
        )}">Accept the Invite</a></div>
      <p>Need help, or have questions? Just reply to this email, we'd love to help</p>
      <p>Copyright © 2023 KnowlEdge. All rights reserved.</p>
      `,
      });
    } catch (err) {
      console.log(err.message);
      console.log(`Invitation email sending error for ${email}`);
    }
  }

  async forgotPasswordEmail(email: string, name: string, token) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
        subject: `Reset your password for KnowlEdge`,
        html: `      
      <h2>Hi <b>${name}</b>, here is a link to reset your password</h2>
      <div><a href="${this.config.get(
        'CORE_FRONTEND_URL',
      )}/auth/reset-password?token=${token}">Reset Password</a></div>
      <p>Need help, or have questions? Just reply to this email, we'd love to help</p>
      <p>Copyright © 2023 KnowlEdge. All rights reserved.</p>
      `,
      });
    } catch (err) {
      console.log(err.message);
      console.log(`Forgot password email sending error for ${email}`);
    }
  }

  async resetPasswordEmail(email: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `Rajat Mondal <${this.config.get('GMAIL_USER')}>`,
        subject: 'Reset password successfully',
        html: `    
        <h2>Hi <b>${name}</b></h2>
        <div>Your password reset was successful, signin from here: <a href="${this.config.get(
          'CORE_FRONTEND_URL',
        )}/auth/signin">Signin</a></div>
        <p>Need help, or have questions? Just reply to this email, we'd love to help</p>
        <p>Copyright © 2023 KnowlEdge. All rights reserved.</p>
        `,
      });
    } catch (err) {
      console.log(err.message);
      console.log(`Reset password email sending error for ${email}`);
    }
  }
}
