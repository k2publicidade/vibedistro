import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Readable } from 'stream';

interface BufferEntry {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory buffer store for wizard preview of uploaded assets.
 *
 * VibeDistro is pass-through to Revelator: files are streamed to Revelator
 * immediately on upload and the returned fileId is persisted. But Revelator
 * does not publicly document a GET endpoint for retrieving files back, so
 * we hold the buffer locally for a short window to serve preview/thumbnail
 * during the release wizard. After TTL expires, entries are evicted and
 * preview falls back to a placeholder (release should already be submitted).
 *
 * Single-instance only. Scaling horizontally requires Redis.
 */
@Injectable()
export class MemoryBufferService implements OnModuleDestroy {
  private readonly logger = new Logger(MemoryBufferService.name);
  private readonly store = new Map<string, BufferEntry>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
    this.store.clear();
  }

  set(
    key: string,
    buffer: Buffer,
    mimeType: string,
    filename: string,
    ttlMs: number = DEFAULT_TTL_MS,
  ): void {
    this.store.set(key, {
      buffer,
      mimeType,
      filename,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(key: string): BufferEntry | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  getStream(key: string): { stream: Readable; mimeType: string; filename: string } | null {
    const entry = this.get(key);
    if (!entry) return null;
    return {
      stream: Readable.from(entry.buffer),
      mimeType: entry.mimeType,
      filename: entry.filename,
    };
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    let evicted = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
        evicted++;
      }
    }
    if (evicted > 0) {
      this.logger.log(`Evicted ${evicted} expired buffer(s). Remaining: ${this.store.size}`);
    }
  }
}
