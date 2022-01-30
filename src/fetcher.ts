import type { ImageFormat, FocalPoint, SanityConfig } from './types.js';
import { arToHeight } from './helpers.js';
import imageUrlBuilder from '@sanity/image-url';

type FetchImageContext = {
  sanityConfig: SanityConfig;
  validAspects: (string | null)[];
};

export async function _fetchImage(
  this: FetchImageContext,
  imageID: string,
  params: URLSearchParams,
) {
  const { sanityConfig, validAspects } = this;

  const w = params.get('w');
  const ar = params.get('ar');
  const fm = params.get('fm');
  const fp = params.get('fp');

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
    .image(imageID)
    .format(fm)
    .width(width)
    .fit('crop')
    .crop('focalpoint')
    .focalPoint(...focalPoint);

  if (ar) {
    builder = builder.height(arToHeight(ar, width));
  }

  const response = await fetch(builder.url());
  const headers = [...response.headers.keys()];
  const allowedHeaders = ['content-type', 'cache-control'];

  for (const key of headers) {
    if (!allowedHeaders.includes(key)) {
      response.headers.delete(key);
    }
  }

  return response;
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
