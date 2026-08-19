const http = require('http');

http.get('http://localhost:3001/uploads/payment_screenshot-1787131128435-577858483.png', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('BODY:', body.slice(0, 100)));
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
