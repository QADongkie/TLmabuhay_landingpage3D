export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

export const smoothstep = (
  start: number,
  end: number,
  value: number,
): number => {
  const x = clamp((value - start) / (end - start));
  return x * x * (3 - 2 * x);
};
