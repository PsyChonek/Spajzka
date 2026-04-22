interface Bucket {
  tokens: number;
  lastRefill: number;
}

export function createRateLimiter(maxPerMinute: number) {
  const buckets = new Map<string, Bucket>();
  const refillPerMs = maxPerMinute / 60_000;

  return {
    consume(key: string): boolean {
      const now = Date.now();
      const bucket = buckets.get(key) ?? { tokens: maxPerMinute, lastRefill: now };
      const elapsed = now - bucket.lastRefill;
      bucket.tokens = Math.min(maxPerMinute, bucket.tokens + elapsed * refillPerMs);
      bucket.lastRefill = now;

      if (bucket.tokens < 1) {
        buckets.set(key, bucket);
        return false;
      }

      bucket.tokens -= 1;
      buckets.set(key, bucket);
      return true;
    }
  };
}
