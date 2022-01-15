export type ImageSource = {
  _id: string;
  altText: string;
  base64: Record<string, string>;
  hotspot: { x: number; y: number };
  width: number;
  height: number;
};

export type {
  ImageFormat,
  SanityClientLike as SanityClient,
} from '@sanity/image-url/lib/types/types';
