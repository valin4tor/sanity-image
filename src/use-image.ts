import type { ImageSource } from './types.js';
import { arToHeight } from './helpers.js';
import { useEffect, useRef } from 'react';

type UseImageContext = {
  endpoint: string;
  breakpoints: Record<string, string>;
};

type UseImageParams = {
  twSizes: string;
  source: ImageSource;
  ar?: string;
};

export function _useImage(
  this: UseImageContext,
  { source, twSizes, ar }: UseImageParams,
) {
  const { endpoint, breakpoints } = this;
  const { _id, altText: alt } = source;
  const base64 = source.base64[ar ?? 'null'];

  const { x: fpX, y: fpY } = source.hotspot ?? {};
  const fp = source.hotspot && `${fpX},${fpY}`;

  const baseWidths = twSizes
    .split(' ')
    .map((s) => s.match(/([0-9]+)px/)![1])
    .map((width) => parseInt(width));
  const defaultWidth = Math.max(...baseWidths);
  const widths = devicePixelRatios(baseWidths);

  const params = createParams({ w: defaultWidth, ar, fp, fm: 'jpg' });
  const baseSrc = `${endpoint}/${_id}`;
  const src = `${baseSrc}?${params}`;

  const jpegs = widths
    .map((width) => {
      const params = createParams({ w: width, ar, fp, fm: 'jpg' });
      return `${baseSrc}?${params} ${width}w`;
    })
    .join(', ');

  const webps = widths
    .map((width) => {
      const params = createParams({ w: width, ar, fp, fm: 'webp' });
      return `${baseSrc}?${params} ${width}w`;
    })
    .join(', ');

  const sizes = formatSizes(twSizes, breakpoints);
  const width = source.width;
  const height = ar ? arToHeight(ar, width) : source.height;

  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = ref.current!;
    if (image.complete) return; // skip loaded images

    image.style.opacity = '0';
    const listener = () => {
      image.style.opacity = '1';
    };

    // fade image in on load
    image.addEventListener('load', listener);
    image.addEventListener('error', listener);

    return () => {
      image.removeEventListener('load', listener);
      image.removeEventListener('error', listener);
    };
  }, []);

  return { base64, webps, jpegs, sizes, ref, src, alt, width, height };
}

type EndpointParams = {
  w: number;
  fm: string;
  ar?: string;
  fp?: string;
};

function createParams(params: EndpointParams) {
  const newParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, val]) => val)
      .map(([key, val]) => [key, val.toString()]),
  );
  return new URLSearchParams(newParams);
}

function devicePixelRatios(widths: number[]) {
  widths = widths
    .flatMap((w) => [w * 1, w * 1.5, w * 2, w * 3])
    .map((w) => Math.ceil(w)); // round up
  return [...new Set(widths)]; // unique
}

function formatSizes(sizes: string, breakpoints: Record<string, string>) {
  const formatted = sizes.split(' ').map((size) => {
    const [, key, val] = size.match(/(?:([a-z0-9]+):)?([0-9]+px)/)!;
    return key ? `(min-width: ${breakpoints[key]}) ${val}` : val;
  });
  return formatted.reverse().join(', ');
}
