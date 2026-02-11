import { env } from '../../config/env';
import { ExternalServiceError } from '../../utils/errors';
import { logger } from '../../utils/logger';

const context = 'HttpClient';

class HttpResponseError extends Error {
  readonly status: number;
  readonly retryAfterMs: number | null;

  constructor(status: number, message: string, retryAfterMs: number | null) {
    super(message);
    this.name = 'HttpResponseError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.floor(seconds * 1000);
  }

  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) {
    const diffMs = asDate - Date.now();
    return diffMs > 0 ? diffMs : 0;
  }

  return null;
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function shouldRetryError(error: unknown): boolean {
  if (error instanceof HttpResponseError) {
    return shouldRetryStatus(error.status);
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return true;
    }
    if (error.message.toLowerCase().includes('network')) {
      return true;
    }
  }

  return false;
}

function computeRetryDelayMs(attempt: number, error: unknown): number {
  if (error instanceof HttpResponseError && error.retryAfterMs !== null) {
    return Math.max(error.retryAfterMs, env.API_RETRY_DELAY_MS);
  }

  const backoff = env.API_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * Math.max(1, Math.floor(backoff * 0.25)));
  return backoff + jitter;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.API_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestJson<T>(
  url: string,
  serviceName: string,
  init: RequestInit
): Promise<T> {
  for (let attempt = 1; attempt <= env.API_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init);

      if (!response.ok) {
        throw new HttpResponseError(
          response.status,
          `${serviceName}: HTTP ${response.status}`,
          parseRetryAfterMs(response.headers.get('retry-after'))
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (!shouldRetryError(error)) {
        throw new ExternalServiceError(serviceName, 'Request failed', {
          url,
          method: init.method ?? 'GET',
          attempt,
          error: error instanceof Error ? error.message : error
        });
      }

      if (attempt >= env.API_MAX_RETRIES) {
        throw new ExternalServiceError(serviceName, 'Request failed after retries', {
          url,
          method: init.method ?? 'GET',
          attempt,
          error: error instanceof Error ? error.message : error
        });
      }

      const delayMs = computeRetryDelayMs(attempt, error);
      logger.warn(context, 'Retrying request', {
        serviceName,
        url,
        attempt,
        delayMs,
        error: error instanceof Error ? error.message : error
      });
      await sleep(delayMs);
    }
  }

  throw new ExternalServiceError(serviceName, 'Request unexpectedly exhausted retries', { url });
}

export async function getJson<T>(url: string, serviceName: string): Promise<T> {
  return requestJson<T>(url, serviceName, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });
}

export async function postJson<T>(
  url: string,
  payload: string,
  serviceName: string,
  headers?: Record<string, string>
): Promise<T> {
  return requestJson<T>(url, serviceName, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...headers
    },
    body: payload
  });
}
