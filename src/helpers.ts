export function arToHeight(ar: string, width: number) {
  const [w, h] = ar.split(':').map((n) => parseInt(n));
  return Math.round(width * (h / w));
}
