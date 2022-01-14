export function arToHeight(ar: string, width: number) {
  const [w, h] = ar.split(':').map((n) => parseInt(n));
  return Math.round(width * (h / w));
}

export function devicePixelRatios(widths: number[]) {
  widths = widths
    .flatMap((w) => [w * 1, w * 1.5, w * 2, w * 3])
    .map((w) => Math.ceil(w)); // round up
  return [...new Set(widths)]; // unique
}

export function safeParams(params: Record<string, any>) {
  const newParams = Object.fromEntries(
    Object.entries(params).filter(([, val]) => val),
  );
  return new URLSearchParams(newParams);
}

export function formatSizes(
  sizes: string,
  breakpoints: Record<string, string>,
) {
  const formatted = sizes.split(' ').map((size) => {
    const [, key, val] = size.match(/(?:([a-z0-9]+):)?([0-9]+px)/)!;
    return key ? `(min-width: ${breakpoints[key]}) ${val}` : val;
  });
  return formatted.reverse().join(', ');
}
