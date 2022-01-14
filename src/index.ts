import groq from 'groq';

export const IMG_SOURCE = groq`
  hotspot,
  ...asset-> { _id, altText, ...metadata.dimensions { width, height } }
`;

import _augment from './augment.js';
import _handler from './handler.js';
export { _augment, _handler };
