import type { SanityClientLike } from '@sanity/image-url/lib/types/types';
import type { ImageSource } from './index.js';
// @ts-ignore: missing type definitions
import { ImagePool } from '@squoosh/lib';
import { arToHeight } from './helpers.js';
import fetch from 'isomorphic-unfetch';
import imageUrlBuilder from '@sanity/image-url';

export default async function augment(
  source: ImageSource,
  aspects: (string | undefined)[],
) {
  const imagePool: ImagePool = new ImagePool();

  const entries = aspects.map(async (ar) => {
    return [ar, await getBase64(imagePool, source, ar)];
  });
  source.base64 = Object.fromEntries(await Promise.all(entries));

  await imagePool.close();
}

let sanityClient: SanityClientLike;

type SetConfigParams = {
  sanityClient: typeof sanityClient;
};

augment.setConfig = ({ sanityClient: newClient }: SetConfigParams) => {
  sanityClient = newClient;
};

export function getImageURL(source: ImageSource | string) {
  return imageUrlBuilder(sanityClient).image(source);
}

async function getBase64(
  imagePool: ImagePool,
  source: ImageSource,
  ar: string | undefined,
) {
  let builder = getImageURL(source).width(64);
  if (ar) builder = builder.height(arToHeight(ar, 64));
  const response = await fetch(builder.url());

  const image = imagePool.ingestImage(await response.arrayBuffer());
  await image.preprocess({ resize: { enabled: true, width: 16 } });
  await image.encode({ webp: {} });

  const result = await image.encodedWith.webp;
  const buffer = Buffer.from(result.binary);
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}
