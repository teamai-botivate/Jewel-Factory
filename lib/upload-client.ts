'use client';

type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId?: string;
  signature: string;
  uploadUrl: string;
  allowedFormats: string[];
  maxBytes: number;
};

export type UploadResult = { secureUrl: string; publicId: string };

/**
 * Direct browser -> Cloudinary upload using server-signed params.
 * 1. GET signed params from `signPath`.
 * 2. POST the file straight to Cloudinary.
 */
export async function uploadToCloudinary(signPath: string, file: File): Promise<UploadResult> {
  const signRes = await fetch(signPath, { method: 'POST' });
  const signJson = (await signRes.json()) as { data?: SignedUpload; error?: { message: string } };
  if (!signRes.ok || !signJson.data) {
    throw new Error(signJson.error?.message ?? 'Could not start upload');
  }
  const s = signJson.data;

  if (file.size > s.maxBytes) {
    throw new Error(`File too large (max ${Math.round(s.maxBytes / 1024 / 1024)}MB).`);
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', s.apiKey);
  form.append('timestamp', String(s.timestamp));
  form.append('signature', s.signature);
  form.append('folder', s.folder);
  if (s.publicId) form.append('public_id', s.publicId);

  const res = await fetch(s.uploadUrl, { method: 'POST', body: form });
  const json = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message: string } };
  if (!res.ok || !json.secure_url || !json.public_id) {
    throw new Error(json.error?.message ?? 'Upload failed');
  }
  return { secureUrl: json.secure_url, publicId: json.public_id };
}
