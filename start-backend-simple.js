#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Flâneur Backend Server...\n');

// Start the backend server
const backend = spawn('bun', ['run', 'backend/server.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: { ...process.env }
});

backend.on('error', (error) => {
  console.error('❌ Failed to start backend server:', error.message);
  process.exit(1);
});

backend.on('close', (code) => {
  if (code && code !== 0) {
    console.error(`❌ Backend server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down backend server...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down backend server...');
  backend.kill('SIGTERM');
  process.exit(0);
});