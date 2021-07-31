const http = require("http"); // requests
const fs = require("fs"); // filesystem
const DomParser = require("dom-parser");

let parser = new DomParser();
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
 * HTTP GET request
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

/**
 * Writes data into subDir folder wit name
 * @param {*} data What to write
 * @param {String} fileName Name of file
 * @param {String} subDir Where to save
 */
function writeToFile(data, fileName, subDir = "") {
  let path =
    subDir != ""
      ? `${__dirname}/${subDir}/${fileName}`
      : `${__dirname}/${fileName}`;
  fs.writeFile(path, data, (err) => {
    if (err) {
      return console.log(`[✖] error with save: ${err}`);
    } else {
      console.log(`[✔] File saved as: ${path}`);
    }
  });
}

/**
 * Make HTTP request
 * @param {*} requestOptions Options for request: hostname, path, method
 */
function makeRequest(requestOptions) {
  httpRequest(requestOptions).then((result) => {
    // saving raw file
    writeToFile(result, "raw", "parseResults");

    // building links.json object
    let linksJson = formJsonObj(requestOptions, result);

    // saving links.json file
    writeToFile(JSON.stringify(linksJson), "links.json", "parseResults");
  });
}

/**
 * Extract title from html text
 * @param {string} rawData html text
 * @returns 
 */
function getTitleFromRawHTMl(rawData) {
  let result = rawData.match(/<[titleTITLE]*>[\s\S]+<\/[titleTITLE]*>/);
  result = result[0].slice(7, -8);
  return result;
}

/**
 * Filter list of links
 * @param {*} listOfLinks List of <a> objects
 * @param {*} linksUrl Webpage url
 * @returns Filtered list
 */
function filterLinks(listOfLinks, linksUrl) {
  const regHTTP = /http[s]?:\/\/www.|http[s]?:\/\//;
  const regMailto = /mailto:/;
  const regSlash = /^\//m;
  const regLikeBasic = new RegExp(
    `^[a-zA-Z]{1,256}.${linksUrl}\/?|^${linksUrl}\/?`
  );
  const regNoslashNourl =
    /^[-a-zA-Z0-9@%_\+~#=]{1,256}\/|^[-a-zA-Z0-9@%_\+~#=]{1,256}.html/;

  for (let i = 0; i < listOfLinks.length; i++) {
    // extract href from <a>
    listOfLinks[i] = listOfLinks[i].getAttribute("href");

    // change / at the start to correct form with Url
    listOfLinks[i] = listOfLinks[i].replace(regSlash, `${linksUrl}/`);

    // correct all links starting with /
    if (listOfLinks[i].search(regNoslashNourl) != -1) {
      listOfLinks[i] = `${linksUrl}/` + listOfLinks[i];
    }

    // erase http(s):// and www.
    listOfLinks[i] = listOfLinks[i].replace(regHTTP, "");

    // delete links that looks not like original Url
    if (listOfLinks[i].search(regLikeBasic) == -1) {
      console.log(`Link deleted: ${listOfLinks[i]}`);
      delete listOfLinks[i];
      continue;
    }

    //delete mailto:
    if (listOfLinks[i].search(regMailto) != -1) {
      console.log(`Link deleted: ${listOfLinks[i]}`);
      delete listOfLinks[i];
      continue;
    }
  }
  return listOfLinks;
}

/**
 * Make JSON object
 * @param {*} options Request options
 * @param {*} data Request answer data
 * @returns {*} Object in JSON format
 */
function formJsonObj(options, data) {
  // forming object
  let linksJsonForm = {};
  let linksResourseUrl = options.hostname;

  let dom = parser.parseFromString(data);
  let links = dom.getElementsByTagName("a");
  // FIXME use this in function?
  let pageTitle = getTitleFromRawHTMl(data);
  linksJsonForm["baseUrl"] = linksResourseUrl;
  linksJsonForm[linksResourseUrl] = [];

  links = filterLinks(links, linksResourseUrl);

  // write to JSON
  links.forEach((el) => {
    linksJsonForm[linksResourseUrl].push({
      target: el,
    });
  });
  return linksJsonForm;
}

makeRequest(options);
