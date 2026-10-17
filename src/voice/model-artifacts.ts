import catalog from './model-artifacts.json';
// Pinned Needle weights. Smaller variants are lossless depth slices, never trained here.
export const NEEDLE_DEPTHS = [4, 8, 12, 20] as const;
export type NeedleDepth = (typeof NEEDLE_DEPTHS)[number];
export const DEFAULT_NEEDLE_DEPTH: NeedleDepth = 12;
export const needleSource = catalog.needleSource;
export const needleArtifacts: Record<
  NeedleDepth,
  { size: number; sha256: string; file: string | null }
> = catalog.needleArtifacts;
export function needleDepth(value: unknown): NeedleDepth {
  return NEEDLE_DEPTHS.includes(Number(value) as NeedleDepth)
    ? (Number(value) as NeedleDepth)
    : DEFAULT_NEEDLE_DEPTH;
}
