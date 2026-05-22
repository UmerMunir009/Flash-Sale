import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { DealsModule } from './modules/deals/deals.module';
import { WorkersModule } from './workers/workers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';

import { AuthMiddleware } from './common/middleware/auth.middleware';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';

import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { QUEUES } from './common/constants/queue.constants';

import { RedisModule } from './common/services/redis.module';




@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get<number>('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
      }),
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),
    RedisModule,

    UsersModule,
    AuthModule,
    ProductsModule,
    DealsModule,
    WorkersModule,
    PurchasesModule,
    WishlistModule,

    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),

    BullBoardModule.forFeature({
      name: QUEUES.DEAL_ACTIVATION,
      adapter: BullMQAdapter,
    }),

    BullBoardModule.forFeature({
      name: QUEUES.DEAL_EXPIRY,
      adapter: BullMQAdapter,
    }),

  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}