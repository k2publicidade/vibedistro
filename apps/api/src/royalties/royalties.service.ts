import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
@Injectable()
export class RoyaltiesService {
  constructor(private readonly prisma: PrismaService) {}
}
