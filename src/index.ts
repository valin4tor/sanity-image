import groq from 'groq';

export const IMG_SOURCE = groq`
  hotspot,
  ...asset-> { _id, altText, ...metadata.dimensions { width, height } }
`;

export { _useImage } from './use-image.js';
export { _augment } from './augment.js';
export { _getImageUrl } from './fetcher.js';
export type { ImageSource, SanityConfig } from './types.js';
