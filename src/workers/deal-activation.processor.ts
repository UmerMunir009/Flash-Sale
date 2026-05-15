import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Deal, DealStatus } from '../modules/deals/entities/deal.entity';
import { QUEUES } from '../common/constants/queue.constants';

@Processor(QUEUES.DEAL_ACTIVATION)
export class DealActivationProcessor extends WorkerHost {
  private readonly logger = new Logger(DealActivationProcessor.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { dealId } = job.data;
    this.logger.log(`Activating deal: ${dealId}`);

    const deal = await this.dealsRepository.findOne({ where: { id: dealId } });

    if (!deal) {
      this.logger.warn(`Deal ${dealId} not found`);
      return;
    }

    if (deal.status !== DealStatus.PENDING) {
      this.logger.warn(`Deal ${dealId} is not pending anymore`);
      return;
    }

    deal.status = DealStatus.ACTIVE;
    await this.dealsRepository.save(deal);
    this.logger.log(`Deal ${dealId} is now ACTIVE`);
  }
}