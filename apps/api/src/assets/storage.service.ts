import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

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
  private readonly provider: 'local' | 's3' | 'r2';
  private readonly bucket: string;
  private readonly basePath: string;
  private readonly s3?: S3Client;
  private readonly publicUrl?: string;

  constructor() {
    this.provider = (process.env['STORAGE_PROVIDER'] ?? 'local') as 'local' | 's3' | 'r2';
    this.bucket = process.env['STORAGE_BUCKET'] ?? 'vibedistro-local';
    this.basePath = path.resolve(process.cwd(), 'uploads');
    this.publicUrl = process.env['STORAGE_PUBLIC_URL'];

    if (this.provider === 'local') {
      fs.mkdirSync(this.basePath, { recursive: true });
      this.logger.log(`Local storage at ${this.basePath}`);
    } else {
      const endpoint = process.env['STORAGE_ENDPOINT'];
      const region = process.env['STORAGE_REGION'] ?? 'auto';
      const accessKeyId = process.env['STORAGE_ACCESS_KEY_ID'];
      const secretAccessKey = process.env['STORAGE_SECRET_ACCESS_KEY'];
      if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error(`STORAGE_PROVIDER=${this.provider} requires STORAGE_ENDPOINT/ACCESS_KEY_ID/SECRET_ACCESS_KEY`);
      }
      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: this.provider === 'r2',
      });
      this.logger.log(`S3-compatible storage (${this.provider}) at ${endpoint}/${this.bucket}`);
    }
  }

  async store(
    tenantId: string,
    assetType: string,
    file: Express.Multer.File,
  ): Promise<StoredFile> {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const key = `${tenantId}/${assetType}/${hash.slice(0, 8)}-${Date.now()}${ext}`;

    if (this.provider === 'local') {
      const fullPath = path.join(this.basePath, key);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.buffer);
    } else {
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    }

    return {
      storageKey: key,
      storageBucket: this.bucket,
      storageProvider: this.provider,
      fileSizeBytes: file.size,
      checksum: hash,
    };
  }

  async getStream(storageKey: string): Promise<Readable> {
    if (this.provider === 'local') {
      const fullPath = path.join(this.basePath, storageKey);
      if (!fs.existsSync(fullPath)) throw new Error(`File not found: ${storageKey}`);
      return fs.createReadStream(fullPath);
    }
    const res = await this.s3!.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    return res.Body as Readable;
  }

  async delete(storageKey: string): Promise<void> {
    if (this.provider === 'local') {
      const fullPath = path.join(this.basePath, storageKey);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      return;
    }
    await this.s3!.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }

  getPublicUrl(storageKey: string): string | null {
    return this.publicUrl ? `${this.publicUrl.replace(/\/$/, '')}/${storageKey}` : null;
  }

  getFilePath(storageKey: string): string {
    return path.join(this.basePath, storageKey);
  }
}
