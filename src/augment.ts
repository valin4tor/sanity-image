import type { SanityClientLike } from '@sanity/image-url/lib/types/types';
import type { ImageSource } from './index.js';
import { arToHeight } from './helpers.js';
import { getPlaiceholder } from 'plaiceholder';
import imageUrlBuilder from '@sanity/image-url';

export default async function augment(
  source: ImageSource,
  aspects: (string | undefined)[],
) {
  const entries = aspects.map(async (ar) => [ar, await getBase64(source, ar)]);
  source.base64 = Object.fromEntries(await Promise.all(entries));
}

let sanityClient: SanityClientLike;

augment.setClient = (newClient: SanityClientLike) => {
  sanityClient = newClient;
};

export function getImageURL(source: ImageSource | string) {
  return imageUrlBuilder(sanityClient).image(source);
}

async function getBase64(source: ImageSource, ar: string | undefined) {
  let builder = getImageURL(source).width(64);
  if (ar) builder = builder.height(arToHeight(ar, 64));
  return (await getPlaiceholder(builder.url(), { size: 16 })).base64;
}
