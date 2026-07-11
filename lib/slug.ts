import { prisma } from '@/lib/prisma';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'store';
}

/** Ensure the store slug is unique by appending -2, -3, ... if taken. */
export async function uniqueStoreSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  // Loop is bounded in practice; slugs collide rarely.
  while (await prisma.store.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
