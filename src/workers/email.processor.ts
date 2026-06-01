import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../common/services/email.service';
import { QUEUES } from '../common/constants/queue.constants';

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing email job: ${job.name}`);

    switch (job.name) {
      case 'send-purchase-email':
        await this.emailService.sendPurchaseConfirmation(
          job.data.toEmail,
          job.data.buyerName,
          job.data.productName,
          job.data.quantity,
          job.data.totalPrice,
        );
        break;

      case 'send-deal-notification':
        await this.emailService.sendDealActivationNotification(
          job.data.toEmail,
          job.data.buyerName,
          job.data.productName,
          job.data.discountPercentage,
          job.data.dealEndTime,
        );
        break;

      default:
        this.logger.warn(`Unknown email job: ${job.name}`);
    }
  }
}