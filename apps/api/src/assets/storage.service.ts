import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface StoredFile {
  storageKey: string;
  storageBucket: string;
  storageProvider: string;
  fileSizeBytes: number;
  checksum: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly basePath: string;
  private readonly bucket = 'vibedistro-local';

  constructor() {
    this.basePath = path.resolve(process.cwd(), 'uploads');
    fs.mkdirSync(this.basePath, { recursive: true });
    this.logger.log(`Local storage at ${this.basePath}`);
  }

  async store(
    tenantId: string,
    assetType: string,
    file: Express.Multer.File,
  ): Promise<StoredFile> {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const key = `${tenantId}/${assetType}/${hash.slice(0, 8)}-${Date.now()}${ext}`;

    const fullPath = path.join(this.basePath, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.buffer);

    return {
      storageKey: key,
      storageBucket: this.bucket,
      storageProvider: 'local',
      fileSizeBytes: file.size,
      checksum: hash,
    };
  }

  async getStream(storageKey: string): Promise<fs.ReadStream> {
    const fullPath = path.join(this.basePath, storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${storageKey}`);
    }
    return fs.createReadStream(fullPath);
  }

  async delete(storageKey: string): Promise<void> {
    const fullPath = path.join(this.basePath, storageKey);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getFilePath(storageKey: string): string {
    return path.join(this.basePath, storageKey);
  }
}
