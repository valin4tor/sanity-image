import type { SanityClient } from './types.js';
import type { ImageSource } from './types.js';
import { arToHeight } from './helpers.js';
import fetch from 'isomorphic-unfetch';
import imageUrlBuilder from '@sanity/image-url';

type AugmentContext = {
  sanityClient: SanityClient;
};

export default async function augment(
  this: AugmentContext,
  source: ImageSource,
  aspects: (string | undefined)[],
) {
  const { sanityClient } = this;
  const entries = aspects.map(async (ar) => {
    return [ar, await getBase64(sanityClient, source, ar)];
  });
  source.base64 = Object.fromEntries(await Promise.all(entries));
}

export function getImageURL(
  sanityClient: SanityClient,
  source: ImageSource | string,
) {
  return imageUrlBuilder(sanityClient).image(source);
}

async function getBase64(
  sanityClient: SanityClient,
  source: ImageSource,
  ar: string | undefined,
) {
  let builder = getImageURL(sanityClient, source).width(16).format('webp');
  if (ar) builder = builder.height(arToHeight(ar, 16));

  const response = await fetch(builder.url());
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}
