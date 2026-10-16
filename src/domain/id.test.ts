import { afterEach, expect, test, vi } from 'vitest';
import { createId } from './id';
afterEach(()=>vi.unstubAllGlobals());
test('UUID v4 remains unique without randomUUID, using cryptographic bytes',()=>{
 const crypto = globalThis.crypto;
 vi.stubGlobal('crypto',{getRandomValues:crypto.getRandomValues.bind(crypto)});
 const ids=Array.from({length:100},()=>createId());
 expect(new Set(ids).size).toBe(ids.length);
 for(const id of ids)expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
