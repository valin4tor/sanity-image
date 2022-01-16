import type { NextFetchEvent, NextRequest } from 'next/server';
import type { ImageFormat, FocalPoint, SanityConfig } from './types.js';
import { arToHeight } from './helpers.js';
import imageUrlBuilder from '@sanity/image-url';

import NextServer from 'next/server.js';
const { NextResponse } = NextServer;

type MiddlewareContext = {
  sanityConfig: SanityConfig;
  validAspects: (string | null)[];
};

export function _middleware(
  this: MiddlewareContext,
  req: NextRequest,
  ev: NextFetchEvent,
) {
  const { sanityConfig, validAspects } = this;
  const { pathname, searchParams } = req.nextUrl;

  const w = searchParams.get('w');
  const ar = searchParams.get('ar');
  const fm = searchParams.get('fm');
  const fpX = searchParams.get('fpX');
  const fpY = searchParams.get('fpY');

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
    focalPoint = getFocalPoint(fpX, fpY);
  } catch (error) {
    return new Response(error as string, { status: 400 });
  }

  let builder = imageUrlBuilder(sanityConfig)
    .image(pathname)
    .format(fm)
    .width(width)
    .fit('crop')
    .crop('focalpoint')
    .focalPoint(...focalPoint);

  if (ar) {
    builder = builder.height(arToHeight(ar, width));
  }

  return NextResponse.rewrite(builder.url());
}

function assertValidFormat(
  validFormats: string[],
  fm: string | null,
): asserts fm is ImageFormat {
  if (!fm || !validFormats.includes(fm)) {
    throw 'invalid format';
  }
}

function getFocalPoint(fpX: string | null, fpY: string | null): FocalPoint {
  if (!fpX && !fpY) {
    return [0.5, 0.5];
  }

  const validFP = /^0\.[0-9]+$/;
  if (![fpX, fpY].every((fp) => typeof fp === 'string' && fp.match(validFP))) {
    throw 'invalid focal point';
  }

  return [parseFloat(fpX as string), parseFloat(fpY as string)];
}
