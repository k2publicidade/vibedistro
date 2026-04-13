'use client';

import { useState, useCallback } from 'react';
import { getToken } from './utils';

const API_BASE =
  typeof window === 'undefined'
    ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`
    : '/api/v1';

export interface UploadedAsset {
  id: string;
  assetType: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  processingStatus: string;
  createdAt: string;
}

export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  asset: UploadedAsset | null;
}

export function useUploadAsset() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    asset: null,
  });

  const upload = useCallback(
    async (
      file: File,
      assetType: 'AUDIO' | 'COVER_ART' | 'ARTIST_PHOTO' | 'DOCUMENT',
    ): Promise<UploadedAsset | null> => {
      setState({ uploading: true, progress: 0, error: null, asset: null });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const token = getToken();

        const res = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE}/assets/upload?assetType=${assetType}`);
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setState((s) => ({ ...s, progress: Math.round((e.loaded / e.total) * 100) }));
            }
          });

          xhr.addEventListener('load', () => {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
            }));
          });
          xhr.addEventListener('error', () => reject(new Error('Upload falhou')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')));

          xhr.send(formData);
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message ?? `HTTP ${res.status}`);
        }

        const asset: UploadedAsset = await res.json();
        setState({ uploading: false, progress: 100, error: null, asset });
        return asset;
      } catch (err: any) {
        const msg = err?.message ?? 'Erro no upload';
        setState({ uploading: false, progress: 0, error: msg, asset: null });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null, asset: null });
  }, []);

  return { ...state, upload, reset };
}
