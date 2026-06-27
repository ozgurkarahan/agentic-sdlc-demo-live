import type { Request, Response, NextFunction, RequestHandler } from 'express';

// FIXTURE (NEG-4): intentionally neutered limiter - a no-op passthrough that
// never counts requests and never returns 429. Models the "theater" case: the
// PR's own (weakened) unit tests pass, but the objective eval-rubric must still
// catch that nothing is actually being limited. Do NOT merge.
export function createRateLimiter(): RequestHandler {
  return (_request: Request, _response: Response, next: NextFunction): void => {
    next();
  };
}
