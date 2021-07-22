const http = require("http"); // requests

let URL = process.argv[2].toLowerCase();
let patternRegExpURL = process.argv[3]
  ? process.argv[3]
  : /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

if (patternRegExpURL.test(URL)) {
  console.log(`✔ correct URL: ${URL}`);
  //const targetURL = new URL(URL);
} else {
  console.log(`✖ incorrect URL: ${URL}`);
  console.log(`Mask is: HTTP(s)://abcd.efg.xyz/`);
  console.log(`You can set your own regexp as second argument`);
  return;
}

// https://nodejs.dev/learn/making-http-requests-with-nodejs
const options = {
  hostname: URL,
  path: '/',
  method: 'GET'
}

const req = http.request(options, res => {
  console.log(`status code: ${res.statusCode}`)

  res.on('data', d=> {
    process.stdout.write(d)
  })
})

req.on('error', er => {
  console.error(er)
})

req.end()
