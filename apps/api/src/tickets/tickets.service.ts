import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}
}
