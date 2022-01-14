export type ImageSource = {
  _id: string;
  altText: string;
  base64: Record<string, string>;
  hotspot: { x: number; y: number };
  width: number;
  height: number;
};

import augment from './augment.js';
import handler from './handler.js';
export { augment, handler };
