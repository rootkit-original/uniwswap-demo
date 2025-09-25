#!/usr/bin/env node

/**
 * Health check script for Docker and Fly.io
 * Tests if the application is responding correctly
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3331,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        if (response.status === 'healthy') {
          console.log('✅ Health check passed');
          process.exit(0);
        } else {
          console.log('❌ Health check failed: Invalid status');
          process.exit(1);
        }
      } catch (error) {
        console.log('❌ Health check failed: Invalid JSON response');
        process.exit(1);
      }
    } else {
      console.log(`❌ Health check failed: HTTP ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log(`❌ Health check failed: ${error.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Health check failed: Timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(3000);
req.end();