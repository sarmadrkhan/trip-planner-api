const http = require('http');

const makeRequest = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/health', (res) => {
      resolve(res.statusCode);
    });

    req.on('error', (err) => {
      resolve(`ERROR: ${err.message}`);
    });

    req.end();
  });
};

const testRateLimit = async () => {
  console.log('Testing Rate Limiting...\n');
  console.log('Making 150 rapid requests to http://localhost:3000/health\n');

  const results = { 200: 0, 429: 0, other: 0 };

  // Make ALL requests in parallel
  const promises = [];
  for (let i = 1; i <= 150; i++) {
    promises.push(makeRequest());
  }

  const responses = await Promise.all(promises);

  // Count results
  responses.forEach((statusCode, i) => {
    if (statusCode === 200) {
      results[200]++;
      process.stdout.write('.');
    } else if (statusCode === 429) {
      results[429]++;
      process.stdout.write('X');
    } else {
      results.other++;
      process.stdout.write('?');
    }

    if ((i + 1) % 50 === 0) {
      console.log(` [${i + 1}/150]`);
    }
  });

  console.log('\n');
  console.log('Results:');
  console.log(`Success (200): ${results[200]}`);
  console.log(`Rate Limited (429): ${results[429]}`);
  console.log(`Other: ${results.other}`);
  console.log('\n');

  if (results[429] > 0) {
    console.log('Rate limiting is working!');
    console.log(`First ~100 requests succeeded, then got rate limited.\n`);
  } else {
    console.log('No rate limiting detected. This might mean:');
    console.log('1. The app is not running');
    console.log('2. Rate limit is higher than 150 requests');
    console.log('3. Rate limit window has reset');
    console.log('4. Throttler is not configured\n');
  }
};

// Run the test
testRateLimit().catch(console.error);