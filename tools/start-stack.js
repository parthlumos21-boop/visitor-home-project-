const { spawn } = require('child_process');
const http = require('http');
const os = require('os');

const API_PORT = 5001;
const EXPO_PORT = 8082;

const isPrivateLan = (address) =>
  address.startsWith('192.168.') ||
  address.startsWith('10.') ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);

const getLanIp = () => {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter(Boolean)
    .filter((net) => net.family === 'IPv4' && !net.internal)
    .map((net) => net.address)
    .filter((address) => !address.startsWith('169.254.') && !address.startsWith('100.'));

  return addresses.find(isPrivateLan) || addresses[0] || 'localhost';
};

const probeBackend = (host) =>
  new Promise((resolve) => {
    const req = http.get({ hostname: host, port: API_PORT, path: '/', timeout: 2000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode === 200 && body.includes('Visitor Gate API is running'),
          statusCode: res.statusCode,
          body,
        });
      });
    });

    req.on('error', () => {
      resolve({ ok: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false });
    });
  });

const waitForBackend = (host, attempts = 30) =>
  new Promise((resolve, reject) => {
    let count = 0;

    const check = () => {
      count += 1;
      const req = http.get({ hostname: host, port: API_PORT, path: '/', timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (count >= attempts) {
          reject(new Error(`Backend did not answer at http://${host}:${API_PORT}/`));
          return;
        }
        setTimeout(check, 1000);
      });

      req.on('timeout', () => {
        req.destroy();
      });
    };

    check();
  });

const run = (command, args, options = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
};

const main = async () => {
  const lanIp = getLanIp();
  const apiUrl = `http://${lanIp}:${API_PORT}/api`;

  console.log(`LAN IP: ${lanIp}`);
  console.log(`Mobile API: ${apiUrl}`);

  const existingBackend = await probeBackend(lanIp);
  let backend;

  if (existingBackend.ok) {
    console.log(`Backend already running: http://${lanIp}:${API_PORT}/`);
  } else {
    backend = run('npm', ['--workspace=backend', 'run', 'dev'], {
      env: { ...process.env, HOST: '0.0.0.0', PORT: String(API_PORT) },
    });
  }

  await waitForBackend(lanIp);
  console.log(`Backend ready: http://${lanIp}:${API_PORT}/`);

  const mobile = run('npm', ['--workspace=mobile', 'run', 'start', '--', '-c'], {
    env: {
      ...process.env,
      REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
      EXPO_PUBLIC_API_URL: apiUrl,
    },
  });

  const shutdown = () => {
    if (backend) {
      backend.kill();
    }
    mobile.kill();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
