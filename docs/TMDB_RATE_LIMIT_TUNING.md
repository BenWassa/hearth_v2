# TMDB Rate Limit Tuning

## Purpose
This app applies a local token-bucket limiter before TMDB calls to smooth bursts and reduce avoidable `429` responses.

## Runtime Environment Variables
- `API_RATE_LIMIT_TOKENS_PER_SEC`: steady refill rate per client IP (default `30`)
- `API_RATE_LIMIT_BURST`: max burst capacity per client IP (default `45`)
- `API_RATE_LIMIT_SCOPE_WEIGHTS`: JSON map for endpoint costs
  - default:
  - `{"search":1,"media-details":1,"media-seasons":1,"media-episodes":2,"refresh":2}`

Legacy fallback remains supported:
- `API_RATE_LIMIT_WINDOW_MS`
- `API_RATE_LIMIT_MAX`

## Tuning Checklist
1. Start with defaults and deploy.
2. Observe:
   - local limiter rejects (`*.rate_limited` logs)
   - upstream TMDB rejects (`*.upstream_rate_limited` logs)
3. If local rejects are high but upstream rejects are low:
   - increase `API_RATE_LIMIT_TOKENS_PER_SEC` by 10-20%.
4. If upstream rejects are high:
   - reduce `API_RATE_LIMIT_TOKENS_PER_SEC` and/or increase episode weight.
5. Keep `media-episodes` weight higher than `search` to prevent deep hydration from starving core lookups.

## Header Signals
Rate-limited endpoints now emit:
- `X-RateLimit-Remaining`
- `X-RateLimit-Policy`
- `X-RateLimit-Scope`
- `Retry-After` (when blocked)
