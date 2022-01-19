import type { ImageFormat, FocalPoint, SanityConfig } from './types.js';
import { arToHeight } from './helpers.js';
import imageUrlBuilder from '@sanity/image-url';

type FetchImageContext = {
  sanityConfig: SanityConfig;
  validAspects: (string | null)[];
};

export function _fetchImage(this: FetchImageContext, url: URL) {
  const { sanityConfig, validAspects } = this;
  const { pathname, searchParams } = url;
  const image = pathname.split('/').pop()!;

  const w = searchParams.get('w');
  const ar = searchParams.get('ar');
  const fm = searchParams.get('fm');
  const fp = searchParams.get('fp');

  let width: number;
  if (w == null || !w.match(/^[0-9]+$/)) {
    return new Response('invalid width', { status: 400 });
  } else {
    width = parseInt(w);
  }

  if (width > 6400) {
    return new Response('invalid width', { status: 400 });
  }

  if (!validAspects.includes(ar)) {
    return new Response('invalid aspect ratio', { status: 400 });
  }

  try {
    assertValidFormat(['jpg', 'webp'], fm);
  } catch (error) {
    return new Response(error as string, { status: 400 });
  }

  let focalPoint: FocalPoint;
  try {
    focalPoint = getFocalPoint(fp);
  } catch (error) {
    return new Response(error as string, { status: 400 });
  }

  let builder = imageUrlBuilder(sanityConfig)
    .image(image)
    .format(fm)
    .width(width)
    .fit('crop')
    .crop('focalpoint')
    .focalPoint(...focalPoint);

  if (ar) {
    builder = builder.height(arToHeight(ar, width));
  }

  return fetch(builder.url());
}

function assertValidFormat(
  validFormats: string[],
  fm: string | null,
): asserts fm is ImageFormat {
  if (!fm || !validFormats.includes(fm)) {
    throw 'invalid format';
  }
}

function getFocalPoint(fp: string | null): FocalPoint {
  if (!fp) return [0.5, 0.5];

  const validFP = /^0\.[0-9]+,0\.[0-9]+$/;
  if (!fp.match(validFP)) throw 'invalid focal point';

  const [fpX, fpY] = fp.split(',');
  return [parseFloat(fpX), parseFloat(fpY)];
}
