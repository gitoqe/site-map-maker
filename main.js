const http = require("http"); // requests
const fs = require("fs"); // filesystem
const DomParser = require("dom-parser");

let URL = process.argv[2].toLowerCase();
let patternRegExpURL = process.argv[3]
  ? process.argv[3]
  : /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

if (patternRegExpURL.test(URL)) {
  console.log(`[✔] Correct URL: ${URL}`);
} else {
  console.log(`[✖] incorrect URL: ${URL}`);
  console.log(`Mask is: HTTP(s)://abcd.efg.xyz/`);
  console.log(`You can set your own regexp as second argument`);
  return;
}

// https://nodejs.dev/learn/making-http-requests-with-nodejs
// options for request
const options = {
  hostname: URL,
  path: "/",
  method: "GET",
};

/**
 * Make HTTP request and get
 * @param {object} params Parameters for HTTP request
 * @returns Promise
 */
function httpRequest(params) {
  //console.log("]>>>> FUNCTION");

  return new Promise((resolve, reject) => {
    //console.log(">]>>> PROMISE");

    const req = http.request(params, (res) => {
      //console.log(">>]>> REQUEST");

      // check response code
      if (res.statusCode < 200 || res.statusCode >= 300) {
        // error code - reject promise
        return reject(new Error(`Error status code: ${res.statusCode}`));
      }

      // saving data
      let rawData = "";
      res.on("data", (dataChunk) => {
        //console.log(">>>]> DATA OBTAINING");

        rawData += dataChunk;
      });

      // resolving on end
      res.on("end", () => {
        try {
          //console.log(rawData);
          //rawData = JSON.parse(rawData.toString());
          //console.log(">>>>] DATA PARsING");
        } catch (error) {
          // error -> reject with error
          reject(error);
        }
        // parsed successfully -> return resolve
        resolve(rawData);
      });
    });

    // if we have an error with request
    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

let linksJsonFile = {};

httpRequest(options).then((result) => {
  //console.log(">>>>>]]]] FIN :O");

  // raw file
  // TODO rewrite as function
  fs.writeFile(`${__dirname}/parseResults/raw`, result, (err) => {
    if (err) {
      return console.log(`[✖] error with save: ${err}`);
    } else {
      console.log(`[✔] File saved as: ${__dirname}/parseResults/raw`);
    }
  });

  // TODO rewrite as function - form JSON object
  let linksResourseUrl = options.hostname // FIXME rewrite as function argument
  let parser = new DomParser();

  let dom = parser.parseFromString(result);
  //console.log(typeof dom);
  let links = dom.getElementsByTagName("a");
  let pageTitle = getTitleFromRawHTMl(result);

  // base element
  linksJsonFile['baseUrl'] = options.hostname
  linksJsonFile[linksResourseUrl] = [];
  //console.log(Object.keys(linksJsonFile))

  // TODO links filter

  links.forEach((el, index) => {
    linksJsonFile[linksResourseUrl].push({
      target: el.getAttribute("href"),
    });
  });

  // TODO same: rewrite as function
  fs.writeFile(
    `${__dirname}/parseResults/links.json`,
    JSON.stringify(linksJsonFile),
    (err) => {
      if (err) {
        return console.log(`[✖] error with save: ${err}`);
      } else {
        console.log(`[✔] File saved as: ${__dirname}/parseResults/links.json`);
      }
    }
  );
});

let getTitleFromRawHTMl = function (rawData) {
  let result = rawData.match(/<[titleTITLE]*>[\s\S]+<\/[titleTITLE]*>/);
  result = result[0].slice(7, -8);
  //console.log(result)
  return result;
};
