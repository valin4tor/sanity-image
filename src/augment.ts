import type { SanityClient } from './types.js';
import type { ImageSource } from './types.js';
// @ts-ignore: missing type definitions
import { ImagePool } from '@squoosh/lib';
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
  const imagePool: ImagePool = new ImagePool();

  const entries = aspects.map(async (ar) => {
    return [ar, await getBase64(sanityClient, imagePool, source, ar)];
  });
  source.base64 = Object.fromEntries(await Promise.all(entries));

  await imagePool.close();
}

export function getImageURL(
  sanityClient: SanityClient,
  source: ImageSource | string,
) {
  return imageUrlBuilder(sanityClient).image(source);
}

async function getBase64(
  sanityClient: SanityClient,
  imagePool: ImagePool,
  source: ImageSource,
  ar: string | undefined,
) {
  let builder = getImageURL(sanityClient, source).width(64);
  if (ar) builder = builder.height(arToHeight(ar, 64));
  const response = await fetch(builder.url());

  const image = imagePool.ingestImage(await response.arrayBuffer());
  await image.preprocess({ resize: { enabled: true, width: 16 } });
  await image.encode({ webp: {} });

  const result = await image.encodedWith.webp;
  const buffer = Buffer.from(result.binary);
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}
