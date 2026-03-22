#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const findFreePort = require('./findFreePort');

async function startDevServers() {
  try {
    // Find free ports for backend and frontend
    const backendPort = await findFreePort(8080);
    const frontendPort = await findFreePort(5174);

    console.log(`🚀 Starting development servers...`);
    console.log(`   Backend will use port ${backendPort}`);
    console.log(`   Frontend will use port ${frontendPort}`);
    console.log('');

    // Start backend server
    const backend = spawn('node', ['server/index.js'], {
      env: { ...process.env, PORT: backendPort },
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    // Start frontend server (Vite) without strict port so it can fallback
    const frontend = spawn('npx', ['vite', '--port', frontendPort.toString(), '--no-strict-port'], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n📌 Shutting down servers...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

    backend.on('error', (err) => {
      console.error('Backend error:', err);
      process.exit(1);
    });

    frontend.on('error', (err) => {
      console.error('Frontend error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Error starting dev servers:', error);
    process.exit(1);
  }
}

startDevServers();
