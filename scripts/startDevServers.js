#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const findFreePort = require('./findFreePort');

async function startDevServers() {
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const vitePackage = require.resolve('vite/package.json', { paths: [projectRoot] });
    const viteBin = path.join(path.dirname(vitePackage), 'bin', 'vite.js');

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
      cwd: projectRoot,
    });

    // Start frontend server directly so shutdown targets the real Vite process.
    const frontendEnv = { ...process.env, BACKEND_PORT: backendPort.toString() };
    const frontend = spawn(process.execPath, [viteBin, '--port', frontendPort.toString(), '--no-strict-port'], {
      env: frontendEnv,
      stdio: 'inherit',
      cwd: projectRoot,
    });

    let shuttingDown = false;
    function shutdown(exitCode = 0) {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      console.log('\n📌 Shutting down servers...');
      if (!backend.killed) {
        backend.kill('SIGTERM');
      }
      if (!frontend.killed) {
        frontend.kill('SIGTERM');
      }
      setTimeout(() => {
        if (backend.exitCode === null && !backend.killed) {
          backend.kill('SIGKILL');
        }
        if (frontend.exitCode === null && !frontend.killed) {
          frontend.kill('SIGKILL');
        }
      }, 1500).unref();
      process.exit(exitCode);
    }

    process.on('SIGINT', () => shutdown(0));
    process.on('SIGTERM', () => shutdown(0));
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      shutdown(1);
    });
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled rejection:', err);
      shutdown(1);
    });

    backend.on('error', (err) => {
      console.error('Backend error:', err);
      shutdown(1);
    });

    frontend.on('error', (err) => {
      console.error('Frontend error:', err);
      shutdown(1);
    });

    backend.on('exit', (code, signal) => {
      if (shuttingDown) {
        return;
      }
      console.error(`Backend exited unexpectedly (${signal || code}).`);
      shutdown(code || 1);
    });

    frontend.on('exit', (code, signal) => {
      if (shuttingDown) {
        return;
      }
      console.error(`Frontend exited unexpectedly (${signal || code}).`);
      shutdown(code || 1);
    });
  } catch (error) {
    console.error('Error starting dev servers:', error);
    process.exit(1);
  }
}

startDevServers();
