const MIN_SLOTS = 4;

export function toFormImages(
  images: string[] | null | undefined,
  imageUrl: string | null | undefined,
): string[] {
  const base = images?.length ? [...images] : imageUrl ? [imageUrl] : [];
  while (base.length < MIN_SLOTS) base.push('');
  return base;
}

export function toDbImages(formImages: string[]) {
  const images = formImages.map((u) => u.trim()).filter(Boolean);
  return { images, image_url: images[0] ?? null };
}
