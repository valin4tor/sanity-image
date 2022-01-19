export type ImageSource = {
  _id: string;
  altText: string;
  base64: Record<string, string>;
  hotspot?: { x: number; y: number };
  width: number;
  height: number;
};

export type SanityConfig = {
  projectId: string;
  dataset: string;
};

export type ImageFormat = 'jpg' | 'webp';
export type FocalPoint = [number, number];
