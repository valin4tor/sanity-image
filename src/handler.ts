import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  ImageFormat,
  SanityClientLike,
} from '@sanity/image-url/lib/types/types';
import augment, { getImageURL } from './augment.js';
import { arToHeight } from './helpers.js';

type QueryParam = string | string[];
type FocalPoint = [number, number];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  let { id, w, ar, fpX, fpY, fm } = req.query;

  let width: number;
  if (typeof w !== 'string' || !w.match(/^[0-9]+$/)) {
    return res.status(400).send('invalid width');
  } else {
    width = parseInt(w);
  }

  try {
    assertValidAspect(ar);
  } catch (error) {
    return res.status(400).send((error as Error).message);
  }

  let focalPoint: FocalPoint;
  try {
    focalPoint = getFocalPoint(fpX, fpY);
  } catch (error) {
    return res.status(400).send((error as Error).message);
  }

  try {
    assertValidFormat(fm);
  } catch (error) {
    return res.status(400).send((error as Error).message);
  }

  if (typeof id !== 'string') {
    return res.status(400).send('invalid id');
  }

  let builder = getImageURL(id)
    .format(fm)
    .width(width)
    .fit('crop')
    .crop('focalpoint');

  if (ar) {
    builder = builder.height(arToHeight(ar, width));
  }

  if (fpX && fpY) {
    builder = builder.focalPoint(...focalPoint);
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

let validAspects: any[];
let validFormats: any[];

type SetConfigParams = {
  sanityClient: SanityClientLike;
  validAspects: typeof validAspects;
  validFormats: typeof validFormats;
};

handler.setConfig = ({
  sanityClient,
  validAspects: newValidAspects,
  validFormats: newValidFormats,
}: SetConfigParams) => {
  augment.setConfig({ sanityClient });
  validAspects = newValidAspects;
  validFormats = newValidFormats;
};

function assertValidAspect(ar: QueryParam): asserts ar is string {
  if (!validAspects.includes(ar)) throw new Error('invalid aspect ratio');
}

function assertValidFormat(fm: QueryParam): asserts fm is ImageFormat {
  if (!validFormats.includes(fm)) throw new Error('invalid format');
}

function getFocalPoint(fpX: QueryParam, fpY: QueryParam): FocalPoint {
  if (!fpX && !fpY) {
    return [0.5, 0.5];
  }

  const validFP = /^0\.[0-9]+$/;
  if (![fpX, fpY].every((fp) => typeof fp === 'string' && fp.match(validFP))) {
    throw new Error('invalid focal point');
  }

  return [parseFloat(fpX as string), parseFloat(fpY as string)];
}
