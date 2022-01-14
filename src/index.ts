import groq from 'groq';

export type ImageSource = {
  _id: string;
  altText: string;
  base64: Record<string, string>;
  hotspot: { x: number; y: number };
  width: number;
  height: number;
};

export const IMG_SOURCE = groq`
  hotspot,
  ...asset-> { _id, altText, ...metadata.dimensions { width, height } }
`;

import augment from './augment.js';
import handler from './handler.js';
export { augment, handler };
