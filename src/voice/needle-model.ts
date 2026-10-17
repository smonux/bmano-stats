import { DEFAULT_MODEL } from 'cactus-needle/browser';
import { needleArtifacts, type NeedleDepth } from './model-artifacts';

/** Identical URLs and hashes are used for preparation and the SDK's offline cache. */
export function needleModel(depth: NeedleDepth) {
  const artifact = needleArtifacts[depth];
  return {
    url: artifact.file
      ? new URL(
          `${import.meta.env.BASE_URL}models/${artifact.file}`,
          globalThis.location?.origin ?? 'http://localhost',
        ).href
      : DEFAULT_MODEL.url,
    sha256: artifact.sha256,
    size: artifact.size,
  };
}
