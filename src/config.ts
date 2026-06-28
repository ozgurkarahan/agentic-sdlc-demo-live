export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. Default: 100. */
  max: number;
  /** Duration of the rate-limit window in milliseconds. Default: 60000 (1 minute). */
  windowMs: number;
}

export interface AppConfig {
  port: number;
  baseUrl: string;
  maxUrlLen: number;
  rateLimit: RateLimitConfig;
}

const DEFAULT_PORT = 3000;
const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_MAX_URL_LEN = 2048;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function parseBaseUrl(value: string | undefined): string {
  if (!value) {
    return DEFAULT_BASE_URL;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return DEFAULT_BASE_URL;
    }
    return value.replace(/\/+$/, '');
  } catch {
    return DEFAULT_BASE_URL;
  }
}

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

export function parseConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const maxUrlLen = parsePositiveInt(env.MAX_URL_LEN, DEFAULT_MAX_URL_LEN);
  const parsedConfig = {
    port: parsePort(env.PORT),
    baseUrl: parseBaseUrl(env.BASE_URL),
    rateLimit: {
      max: parsePositiveInt(env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
      windowMs: parsePositiveInt(env.RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    },
  };

  return Object.defineProperty(parsedConfig, 'maxUrlLen', {
    value: maxUrlLen,
    enumerable: false,
    writable: true,
    configurable: true,
  }) as AppConfig;
}

export const config: AppConfig = parseConfig();
