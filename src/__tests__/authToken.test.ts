import { describe, it, expect } from 'vitest';
import { decodeJwt, isExpired, secondsUntilExpiry } from '../../src/lib/authToken';

function makeToken(expOffsetSeconds: number) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const payload = btoa(JSON.stringify({ exp }));
  return `${header}.${payload}.sig`; // signature portion not validated by decode
}

describe('authToken utils', () => {
  it('decodes exp', () => {
    const token = makeToken(60);
    const decoded = decodeJwt(token);
    expect(decoded?.exp).toBeGreaterThan(Math.floor(Date.now()/1000));
  });
  it('isExpired false for future token', () => {
    const token = makeToken(60);
    expect(isExpired(token)).toBe(false);
  });
  it('isExpired true for past token', () => {
    const token = makeToken(-10);
    expect(isExpired(token)).toBe(true);
  });
  it('secondsUntilExpiry approx', () => {
    const token = makeToken(5);
    const secs = secondsUntilExpiry(token)!;
    expect(secs).toBeGreaterThan(0);
    expect(secs).toBeLessThanOrEqual(5);
  });
});
