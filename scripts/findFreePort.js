const net = require('net');

/**
 * Find a free port starting from a given base port
 * @param {number} basePort - The preferred port to start searching from
 * @returns {Promise<number>} - The first available free port
 */
async function findFreePort(basePort = 8080) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(basePort, () => {
      const port = server.address().port;
      server.close();
      resolve(port);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        findFreePort(basePort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

module.exports = findFreePort;
