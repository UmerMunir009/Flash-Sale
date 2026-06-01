import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>('RESEND_API_KEY')!,
    );
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL')!;
  }

 async sendPurchaseConfirmation(
  toEmail: string,
  buyerName: string,
  productName: string,
  quantity: number,
  totalPrice: number,
): Promise<void> {
  await this.resend.emails.send({
    from: 'Flash Sale <onboarding@resend.dev>',
    to: toEmail,
    subject: `Purchase Confirmed : ${productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Purchase Confirmed! 🎉</h2>
        <p>Hi <strong>${buyerName}</strong>,</p>
        <p>Your purchase has been confirmed successfully.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Order Details</h3>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Total Price:</strong> ${totalPrice}</p>
        </div>
        <p>Thank you for shopping with Flash Sale!</p>
      </div>
    `,
  });
  this.logger.log(`Purchase confirmation sent to ${toEmail}`);
}

async sendDealActivationNotification(
  toEmail: string,
  buyerName: string,
  productName: string,
  discountPercentage: number,
  dealEndTime: Date,
): Promise<void> {
  await this.resend.emails.send({
    from: 'Flash Sale <onboarding@resend.dev>',
    to: toEmail,
    subject: `Flash Deal is Live on ${productName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Flash Deal Alert! 🔥</h2>
        <p>Hi <strong>${buyerName}</strong>,</p>
        <p>Great news! A product on your wishlist just went on sale.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0; color: #ef4444;">${productName}</h3>
          <p style="font-size: 24px; font-weight: bold; color: #ef4444;">
            ${discountPercentage}% OFF
          </p>
          <p><strong>Deal Expires:</strong> ${new Date(dealEndTime).toLocaleString()}</p>
        </div>
        <p>Hurry! This deal is time limited.</p>
      </div>
    `,
  });
  this.logger.log(`Deal notification sent to ${toEmail}`);
}
}