import type { ImageFormat, FocalPoint, SanityConfig } from './types.js';
import { arToHeight } from './helpers.js';
import imageUrlBuilder from '@sanity/image-url';

type FetchImageContext = {
  sanityConfig: SanityConfig;
};

export function _getImageUrl(
  this: FetchImageContext,
  imageID: string,
  params: URLSearchParams,
) {
  const { sanityConfig } = this;

  const w = params.get('w');
  const ar = params.get('ar');
  const fm = params.get('fm');
  const fp = params.get('fp');

  let width: number;
  if (w == null || !w.match(/^[0-9]+$/)) {
    throw TypeError('invalid width');
  } else {
    width = parseInt(w);
  }

  assertValidFormat(['jpg', 'webp'], fm);

  const focalPoint = getFocalPoint(fp);
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

  return builder.url();
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
