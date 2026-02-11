#!/usr/bin/env node

const net = require('node:net');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const REDIS_URL = (process.env.REDIS_URL || 'redis://localhost:6379').trim();
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function parseRedisUrl(raw) {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
      throw new Error(`Unsupported protocol "${parsed.protocol}"`);
    }
    return parsed;
  } catch (error) {
    console.error(`[ensure:redis] Invalid REDIS_URL "${raw}": ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function canRun(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
    stdio: 'ignore'
  });
  return result.status === 0;
}

function pingRedis(host, port, timeoutMs = 700) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (value) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(value);
      }
    };

    socket.setTimeout(timeoutMs, () => finish(false));
    socket.on('error', () => finish(false));

    socket.on('connect', () => {
      socket.write('*1\r\n$4\r\nPING\r\n');
    });

    socket.on('data', (chunk) => {
      const output = chunk.toString('utf8');
      finish(output.includes('+PONG'));
    });
  });
}

async function waitUntilReady(host, port, maxAttempts = 15, delayMs = 300) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await pingRedis(host, port)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

async function main() {
  const parsed = parseRedisUrl(REDIS_URL);
  const protocol = parsed.protocol.replace(':', '');
  const host = parsed.hostname || 'localhost';
  const port = Number(parsed.port || '6379');

  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    console.error(`[ensure:redis] Invalid Redis port in REDIS_URL: ${parsed.port}`);
    process.exit(1);
  }

  if (protocol === 'rediss') {
    console.log('[ensure:redis] REDIS_URL uses rediss://; skipping local Redis auto-start.');
    process.exit(0);
  }

  if (!LOCAL_HOSTS.has(host)) {
    console.log(`[ensure:redis] REDIS_URL points to ${host}:${port}; skipping local Redis auto-start.`);
    process.exit(0);
  }

  if (await pingRedis(host, port)) {
    console.log(`[ensure:redis] Redis already running on ${host}:${port}`);
    process.exit(0);
  }

  if (!canRun('redis-server')) {
    console.error('[ensure:redis] redis-server is not installed. Install Redis or set REDIS_URL to a managed instance.');
    process.exit(1);
  }

  console.log(`[ensure:redis] Starting local Redis on ${host}:${port}...`);
  const started = spawnSync(
    'redis-server',
    ['--daemonize', 'yes', '--port', String(port)],
    { stdio: 'inherit' }
  );

  if (started.status !== 0) {
    console.error('[ensure:redis] Failed to start redis-server.');
    process.exit(1);
  }

  if (!(await waitUntilReady(host, port))) {
    console.error('[ensure:redis] Redis did not become ready in time.');
    process.exit(1);
  }

  console.log(`[ensure:redis] Redis started on ${host}:${port}`);
}

main().catch((error) => {
  console.error(`[ensure:redis] Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
