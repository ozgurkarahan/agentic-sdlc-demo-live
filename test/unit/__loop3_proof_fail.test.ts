import { describe, it, expect } from 'vitest';

// Loop-3 live proof: a DELIBERATELY failing unit test. The harness's Tests & Evals gate
// MUST conclude `failure`, which the orchestrator --watch then classifies as NO-GO and
// reports to the tracking issue. This file is throwaway proof scaffolding.
describe('loop3-proof deliberate failure', () => {
  it('fails on purpose so the run-status gate has a red run to catch', () => {
    expect(1).toBe(2);
  });
});
