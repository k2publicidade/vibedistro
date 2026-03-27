import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
}
