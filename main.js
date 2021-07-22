let enterArgs = process.argv[2].toLowerCase();
let patternRegExpURL = (process.argv[3]) ? process.argv[3] : /http[s]{0,1}:\/\/[a-z0-9]*.[a-z0-9]*.[a-z]{2,3}\//;

if (patternRegExpURL.test(enterArgs)) {
  console.log(`✔ correct URL: ${enterArgs}`);
  //const targetURL = new URL(enterArgs);
} else {
  console.log(`✖ incorrect URL: ${enterArgs}`);
  console.log(`mask is: HTTP(s)://abcd.efg.xyz/`)
  return;
}
console.log(enterArgs);
