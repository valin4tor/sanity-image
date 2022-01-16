import type { SanityConfig } from './types.js';
import type { ImageSource } from './types.js';
import { arToHeight } from './helpers.js';
import fetch from 'isomorphic-unfetch';
import imageUrlBuilder from '@sanity/image-url';

type AugmentContext = {
  sanityConfig: SanityConfig;
};

export async function _augment(
  this: AugmentContext,
  source: ImageSource,
  aspects: (string | null)[],
) {
  const { sanityConfig } = this;
  const entries = aspects.map(async (ar) => {
    return [ar, await getBase64(sanityConfig, source, ar)];
  });
  source.base64 = Object.fromEntries(await Promise.all(entries));
}

async function getBase64(
  sanityConfig: SanityConfig,
  source: ImageSource,
  ar: string | null,
) {
  let builder = imageUrlBuilder(sanityConfig)
    .image(source)
    .width(16)
    .format('webp');

  if (ar) {
    builder = builder.height(arToHeight(ar, 16));
  }

  const response = await fetch(builder.url());
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}
