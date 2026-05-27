const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const prismaClientDir = path.resolve(__dirname, '..', '..', 'node_modules', '.prisma', 'client');
const cleanOnly = process.argv.includes('--clean-only');
const maxAttempts = 15;

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function cleanup() {
  if (!fs.existsSync(prismaClientDir)) return;
  const files = fs.readdirSync(prismaClientDir);
  for (const file of files) {
    const lower = file.toLowerCase();
    if (!lower.includes('query_engine-windows.dll.node')) continue;
    try {
      const fullPath = path.join(prismaClientDir, file);
      fs.chmodSync(fullPath, 0o666);
      fs.rmSync(fullPath, { force: true });
    } catch {}
  }
}

cleanup();
if (cleanOnly) process.exit(0);

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  cleanup();

  const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'generate'], {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      PRISMA_SKIP_POSTINSTALL_GENERATE: '1'
    }
  });

  if (result.status === 0) process.exit(0);

  const waitMs = Math.min(15000, 500 * attempt);
  sleep(waitMs);
}

console.error('prisma generate failed after extended retries; likely active file lock by another process');
process.exit(1);