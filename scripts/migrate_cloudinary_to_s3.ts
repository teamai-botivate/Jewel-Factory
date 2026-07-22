import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';

import { prisma } from '../lib/prisma';

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION ?? 'ap-south-1';
const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '');

if (!bucket || !publicBaseUrl) {
  throw new Error('AWS_S3_BUCKET and S3_PUBLIC_BASE_URL are required');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
};

const s3 = new S3Client({ region });

async function resources(): Promise<CloudinaryResource[]> {
  const all: CloudinaryResource[] = [];
  let nextCursor: string | undefined;
  do {
    const page = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'jewelfactory/',
      max_results: 500,
      next_cursor: nextCursor,
    });
    all.push(...(page.resources as CloudinaryResource[]));
    nextCursor = page.next_cursor as string | undefined;
  } while (nextCursor);
  return all;
}

async function migrate(resource: CloudinaryResource): Promise<void> {
  const response = await fetch(resource.secure_url);
  if (!response.ok) throw new Error(`Could not download ${resource.public_id}: ${response.status}`);

  const key = resource.public_id;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(await response.arrayBuffer()),
    ContentType: response.headers.get('content-type') ?? undefined,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const url = `${publicBaseUrl}/${key}`;
  await prisma.$transaction([
    prisma.manufacturerProductImage.updateMany({
      where: { cloudinaryPublicId: resource.public_id },
      data: { secureUrl: url },
    }),
    prisma.productImage.updateMany({
      where: { cloudinaryPublicId: resource.public_id },
      data: { url },
    }),
    prisma.tryonAsset.updateMany({
      where: { cloudinaryPublicId: resource.public_id },
      data: { assetUrl: url },
    }),
    prisma.store.updateMany({
      where: { logoUrl: resource.secure_url },
      data: { logoUrl: url },
    }),
    prisma.customDesignRequest.updateMany({
      where: {
        OR: [
          { referenceImagePublicId: resource.public_id },
          { referenceImageUrl: resource.secure_url },
        ],
      },
      data: { referenceImagePublicId: key, referenceImageUrl: url },
    }),
    prisma.customDesignOrder.updateMany({
      where: { referenceImageUrl: resource.secure_url },
      data: { referenceImageUrl: url },
    }),
  ]);
}

async function main() {
  const all = await resources();
  console.log(`[storage-migration] found ${all.length} Cloudinary assets`);
  for (const [index, resource] of all.entries()) {
    await migrate(resource);
    console.log(`[storage-migration] ${index + 1}/${all.length} ${resource.public_id}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
