import type { NextApiRequest, NextApiResponse } from 'next';
import type { ImageFormat, SanityClient } from './types.js';
import { getImageURL } from './augment.js';
import { arToHeight } from './helpers.js';

type QueryParam = string | string[];
type FocalPoint = [number, number];

type HandlerContext = {
  sanityClient: SanityClient;
  validAspects: any[];
  validFormats: any[];
};

export default function handler(
  this: HandlerContext,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { sanityClient } = this;
  let { id, w, ar, fpX, fpY, fm } = req.query;

  let width: number;
  if (typeof w !== 'string' || !w.match(/^[0-9]+$/)) {
    return res.status(400).send('invalid width');
  } else {
    width = parseInt(w);
  }

  try {
    assertValidAspect(this.validAspects, ar);
  } catch (error) {
    return res.status(400).send(error as string);
  }

  let focalPoint: FocalPoint;
  try {
    focalPoint = getFocalPoint(fpX, fpY);
  } catch (error) {
    return res.status(400).send(error as string);
  }

  try {
    assertValidFormat(this.validFormats, fm);
  } catch (error) {
    return res.status(400).send(error as string);
  }

  if (typeof id !== 'string') {
    return res.status(400).send('invalid id');
  }

  let builder = getImageURL(sanityClient, id)
    .format(fm)
    .width(width)
    .fit('crop')
    .crop('focalpoint')
    .focalPoint(...focalPoint);

  if (ar) {
    builder = builder.height(arToHeight(ar, width));
  }

  return fetch(builder.url()).then((image) => {
    for (const [key, val] of image.headers.entries()) {
      const desiredHeaders = ['content-type', 'cache-control'];
      if (desiredHeaders.includes(key)) res.setHeader(key, val);
    }
    res.status(image.status);
    res.send(image.body);
  });
}

function assertValidAspect(
  validAspects: any[],
  ar: QueryParam,
): asserts ar is string {
  if (!validAspects.includes(ar)) throw 'invalid aspect ratio';
}

function assertValidFormat(
  validFormats: any[],
  fm: QueryParam,
): asserts fm is ImageFormat {
  if (!validFormats.includes(fm)) throw 'invalid format';
}

function getFocalPoint(fpX: QueryParam, fpY: QueryParam): FocalPoint {
  if (!fpX && !fpY) {
    return [0.5, 0.5];
  }

  const validFP = /^0\.[0-9]+$/;
  if (![fpX, fpY].every((fp) => typeof fp === 'string' && fp.match(validFP))) {
    throw 'invalid focal point';
  }

  return [parseFloat(fpX as string), parseFloat(fpY as string)];
}
