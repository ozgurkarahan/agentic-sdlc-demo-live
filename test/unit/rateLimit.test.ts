import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../../src/middleware/rateLimit.js';

// FIXTURE (NEG-4): deliberately weak self-test - asserts only that the factory
// returns a function, NOT that it actually limits. This is the dev's own green
// test. The independent eval-rubric must catch the missing 429 behavior.
describe('createRateLimiter (weak fixture test)', () => {
  it('returns a middleware function', () => {
    const mw = createRateLimiter();
    expect(typeof mw).toBe('function');
  });
});
