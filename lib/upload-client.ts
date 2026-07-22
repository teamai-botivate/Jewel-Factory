'use client';

type SignedUpload = {
  uploadUrl: string;
  publicId: string;
  secureUrl: string;
  allowedFormats: string[];
  maxBytes: number;
};

export type UploadResult = { secureUrl: string; publicId: string };

/**
 * Direct browser -> private S3 upload using a server-signed PUT URL.
 * 1. GET signed params from `signPath`.
 * 2. POST the file straight to Cloudinary.
 */
export async function uploadToObjectStorage(signPath: string, file: File): Promise<UploadResult> {
  const signRes = await fetch(signPath, { method: 'POST' });
  const signJson = (await signRes.json()) as { data?: SignedUpload; error?: { message: string } };
  if (!signRes.ok || !signJson.data) {
    throw new Error(signJson.error?.message ?? 'Could not start upload');
  }
  const s = signJson.data;

  if (file.size > s.maxBytes) {
    throw new Error(`File too large (max ${Math.round(s.maxBytes / 1024 / 1024)}MB).`);
  }

  const res = await fetch(s.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return { secureUrl: s.secureUrl, publicId: s.publicId };
}
