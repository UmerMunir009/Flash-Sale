import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const isPublic = this.isPublicRoute(req);
    if (isPublic) {
      next();
      return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
         
    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      req['user'] = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private isPublicRoute(req: Request): boolean {
    const publicRoutes = [
      { path: '/api/v1/auth/register', method: 'POST' },
      { path: '/api/v1/auth/login', method: 'POST' },
      { path: '/api/v1/products', method: 'GET' },
    ];

    return publicRoutes.some(
      (route) =>
        req.path === route.path && req.method === route.method,
    );
  }
}