import { spawn } from 'node:child_process';
import process from 'node:process';

console.log('🚀 Starting Worker Wrapper...');

const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const worker = spawn(cmd, ['run', 'worker'], {
  stdio: 'inherit',
  shell: true,
  windowsHide: true
});

worker.on('error', (err) => {
  console.error('Failed to start worker:', err);
});

worker.on('close', (code) => {
  console.log(`Worker process exited with code ${code}`);
  process.exit(code);
});
