import { afterEach, expect, test, vi } from 'vitest';
import { DEFAULT_MODEL } from 'cactus-needle/browser';
import { DEFAULT_NEEDLE_DEPTH, NEEDLE_DEPTHS, needleModel, savedNeedleDepth } from './models';
import { needleDepth, needleSource } from './model-artifacts';
afterEach(()=>vi.unstubAllGlobals());
test('fresh and invalid preferences choose 12 layers, while all four versions persist',()=>{
 expect(DEFAULT_NEEDLE_DEPTH).toBe(12);
 for(const value of [null,'','invalid','16','12x']){vi.stubGlobal('localStorage',{getItem:()=>value});expect(savedNeedleDepth()).toBe(12);}
 for(const depth of NEEDLE_DEPTHS){vi.stubGlobal('localStorage',{getItem:()=>String(depth)});expect(savedNeedleDepth()).toBe(depth);expect(needleDepth(depth)).toBe(depth);}
});
test('custom weights have distinct pinned URLs and checksums; 20 layers reuses the SDK default',()=>{
 vi.stubGlobal('location',{href:'https://example.test/app/#/ajustes'});
 expect(needleSource).toMatchObject({revision:DEFAULT_MODEL.revision,size:DEFAULT_MODEL.size,sha256:DEFAULT_MODEL.sha256,url:DEFAULT_MODEL.url});
 expect(needleModel(20)).toMatchObject({url:DEFAULT_MODEL.url,size:DEFAULT_MODEL.size,sha256:DEFAULT_MODEL.sha256});
 const models=NEEDLE_DEPTHS.map(needleModel);expect(new Set(models.map(m=>m.url)).size).toBe(4);
 for(const depth of [4,8,12] as const){const model=needleModel(depth);expect(model.url).toMatch(new RegExp(`^https://example.test/models/needle3-${depth}l-`));expect(model.sha256).toMatch(/^[a-f0-9]{64}$/);expect(model.size).toBeLessThan(DEFAULT_MODEL.size);}
});
