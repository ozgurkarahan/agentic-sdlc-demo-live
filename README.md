# URL Shortener Sample App

Node 20 + TypeScript + Express REST API used as the demo system under test.

## API

- `GET /healthz` → `200 { "status": "ok" }`
- `POST /shorten` with `{ "url": "https://example.com" }` → `201 { "code": "abc123", "shortUrl": "http://localhost:3000/abc123" }`
- `GET /:code` for a known code → `302` redirect to the original URL and increments `hits`
- `GET /:code` for an unknown code → `404 { "error": string }`
- `GET /api/links` → `200` array of `{ "code": string, "url": string, "hits": number }`

## Configuration

- `PORT` defaults to `3000`
- `BASE_URL` defaults to `http://localhost:3000`

## Rate limiting

The API enforces **per-client** (IP-based) rate limiting on all routes.

### 429 response contract

Once a client exceeds the allowed number of requests within the configured window, every subsequent request in that window receives:

- **HTTP 429 Too Many Requests**
- `Retry-After: <seconds>` — a numeric value indicating how many seconds the client must wait before retrying
- `RateLimit-Limit: <max>` — the maximum number of requests allowed per window
- `RateLimit-Remaining: 0` — the number of requests still allowed in the current window

Requests made *within* the threshold receive a normal `2xx`/`3xx` response with `RateLimit-Remaining` counting down.

### Configuration

| Environment variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_MAX` | `100` | Maximum number of requests allowed per client per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Length of the sliding window in milliseconds (default: 1 minute) |

Example — tighten the limit to 10 requests per 30 seconds:

```sh
RATE_LIMIT_MAX=10 RATE_LIMIT_WINDOW_MS=30000 npm start
```

## Run locally

```powershell
npm install
npm run build
npm start
```

## Verify

```powershell
npm run lint
npm run build
npm test
```

<!-- ci: trigger check-run name registration (S2) -->

<!-- loop3-green-proof: a clean change that should pass Tests & Evals -->

