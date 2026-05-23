import { spawn } from 'node:child_process';

const commands = [
  { name: 'frontend', args: ['run', 'dev', '--workspace', 'frontend'] },
  { name: 'backend', args: ['run', 'dev', '--workspace', 'backend'] },
];

const children = commands.map(({ name, args }) => {
  const child = spawn('npm', args, {
    shell: true,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} dev server exited with code ${code}`);
    }
  });

  return child;
});

const shutdown = () => {
  for (const child of children) {
    child.kill('SIGTERM');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
