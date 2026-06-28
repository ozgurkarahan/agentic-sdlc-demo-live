import { describe, expect, it } from 'vitest';

const DEFAULT_RATE_LIMIT_MAX = 100;
const RATE_LIMIT_LIMIT_HEADER = 'RateLimit-Limit';
const RATE_LIMIT_REMAINING_HEADER = 'RateLimit-Remaining';
const RETRY_AFTER_HEADER = 'Retry-After';

function isLiveBaseUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getConfiguredBaseUrl(): string | undefined {
  return [process.env.TEST_BASE_URL, process.env.BASE_URL].find(isLiveBaseUrl);
}

const liveOnly = getConfiguredBaseUrl() ? it : it.skip;

function getRequiredBaseUrl(): string {
  const baseUrl = getConfiguredBaseUrl();

  if (!baseUrl) {
    throw new Error('TEST_BASE_URL or BASE_URL is required for live E2E rate-limit tests');
  }

  return baseUrl;
}

function parseRequiredNumber(value: string | null, headerName: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${headerName} must be numeric`);
  }

  return parsed;
}

async function getLinks(baseUrl: string): Promise<Response> {
  const response = await fetch(new URL('/api/links', baseUrl));

  await response.arrayBuffer();

  return response;
}

describe('live rate-limit acceptance', () => {
  liveOnly('returns 200 under the threshold and 429 once the threshold is exceeded', async () => {
    const baseUrl = getRequiredBaseUrl();
    const expectedLimit = Number(process.env.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX);

    const firstResponse = await getLinks(baseUrl);
    expect(firstResponse.status).toBe(200);

    const limit = parseRequiredNumber(
      firstResponse.headers.get(RATE_LIMIT_LIMIT_HEADER),
      RATE_LIMIT_LIMIT_HEADER,
    );
    const remaining = parseRequiredNumber(
      firstResponse.headers.get(RATE_LIMIT_REMAINING_HEADER),
      RATE_LIMIT_REMAINING_HEADER,
    );

    expect(limit).toBe(expectedLimit);
    expect(remaining).toBeGreaterThanOrEqual(0);

    for (let iteration = 0; iteration < remaining; iteration += 1) {
      const response = await getLinks(baseUrl);
      expect(response.status).toBe(200);
    }

    const limitedResponse = await getLinks(baseUrl);
    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.headers.get(RATE_LIMIT_LIMIT_HEADER)).toBe(String(limit));
    expect(limitedResponse.headers.get(RATE_LIMIT_REMAINING_HEADER)).toBe('0');

    const retryAfter = parseRequiredNumber(
      limitedResponse.headers.get(RETRY_AFTER_HEADER),
      RETRY_AFTER_HEADER,
    );
    expect(retryAfter).toBeGreaterThanOrEqual(0);
  });
});
