import { needleArtifacts, needleSource, needleDepth, type NeedleDepth } from './model-artifacts';
export { NEEDLE_DEPTHS, DEFAULT_NEEDLE_DEPTH, needleArtifacts, type NeedleDepth } from './model-artifacts';
export function savedNeedleDepth():NeedleDepth {
  try{return needleDepth(localStorage.getItem('handball-needle-depth'));}catch{return needleDepth(null);}
}
export function needleModel(depth:NeedleDepth) {
  const artifact=needleArtifacts[depth];
  const base=globalThis.location?.href??'http://localhost/';
  const url=artifact.file?new URL(`${import.meta.env.BASE_URL}models/${artifact.file}`,base).href:needleSource.url;
  return {...artifact,url};
}
