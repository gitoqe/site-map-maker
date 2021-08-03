const http = require("http"); // requests
const fs = require("fs"); // filesystem
const DomParser = require("dom-parser");
const parser = new DomParser();

const URL = process.argv[2].toLowerCase();

let regexpCorrectUrl = process.argv[3]
  ? process.argv[3]
  : /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

if (regexpCorrectUrl.test(URL)) {
  console.log(`[✔] Correct URL: ${URL}`);
} else {
  console.log(`[✖] incorrect URL: ${URL}`);
  console.log(`Mask is: HTTP(s)://abcd.efg.xyz/`);
  console.log(`You can set your own regexp as second argument`);
  return;
}

/*
    https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
    https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options

    TODO
    1. check if folder of project exists
      + check name of folder
      + create new folder with name `hostname-1` like
        https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
      + store data here
      - create new folder with name `hostname-1` like
      - store data here
    TODO  
    
    2. change type of operation from truncate & write to read & append
    TODO
    3. check if the current file is the first (base of webpage)
      + first? -> #1 & #2
      - not first -> add info to base file
        https://nodejs.org/api/fs.html#fs_file_system_flags 'a' flag
    */

main();

function main() {
  let numberOfRequests = 0;
  let depthOfParsing = 0;
  // https://nodejs.dev/learn/making-http-requests-with-nodejs
  // options for request

  let options = {
    hostname: URL,
    path: "/",
    method: "GET",
  };
  makeRequest(options);
}

/**
 * Make HTTP request
 * @param {*} options Options for request: hostname, path, method
 */
function makeRequest(options) {
  sendHttpRequest(options).then((result) => {
    // saving raw file
    writeFile(result, `${options.hostname}-raw`, "parseResults");

    // building links.json object
    let linksAsObj = parseLinks(options, result);

    // saving links.json file
    writeFile(
      JSON.stringify(linksAsObj),
      `${options.hostname}-links.json`,
      "parseResults"
    );
    // FIXME -> writeFile(JSON.stringify(linksAsObj), `${options.hostname}-links.json`, "parseResults");
  });
}

/**
 * HTTP GET request
 * @param {object} requestOptions Parameters for HTTP request
 * @returns Promise
 */
function sendHttpRequest(requestOptions) {
  return new Promise((resolve, reject) => {
    const request = http.request(requestOptions, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`Error status code: ${response.statusCode}`));
      }

      // saving data
      let rawData = "";
      response.on("data", (dataChunk) => {
        rawData += dataChunk;
      });

      // resolving on end
      response.on("end", () => {
        try {
          //rawData = JSON.parse(rawData.toString());
        } catch (error) {
          reject(error);
        }
        resolve(rawData);
      });
    });

    // if we have an error with request
    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });
}

/**
 * Writes data into subDir folder wit name
 * @param {*} data What to write
 * @param {String} fileName Name of file
 * @param {String} subDirectoryName Where to save
 */
function writeFile(data, fileName, subDirectoryName = "") {
  let path =
    subDirectoryName != ""
      ? `${__dirname}/${subDirectoryName}/${fileName}`
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
 * Make JSON object
 * @param {*} options Request options
 * @param {*} data Request answer data
 * @returns {*} Object in JSON format
 */
function parseLinks(options, data) {
  // forming object
  let linksObject = {};
  let resourseUrl = options.hostname;

  let parsedDom = parser.parseFromString(data);
  let listOfLinkNodes = parsedDom.getElementsByTagName("a");
  // FIXME use this in function?
  let pageTitle = getTitleFromRawHTMl(data);
  linksObject["baseUrl"] = resourseUrl;
  linksObject[resourseUrl] = [];

  listOfLinkNodes = filterLinks(listOfLinkNodes, resourseUrl);

  // write to JSON
  listOfLinkNodes.forEach((element) => {
    linksObject[resourseUrl].push({
      target: element,
    });
  });
  return linksObject;
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
 * @param {*} list List of <a> objects
 * @param {*} linksUrl Webpage url
 * @returns Filtered list
 */
function filterLinks(list, linksUrl) {
  const regexpHTTP = /http[s]?:\/\/www.|http[s]?:\/\//;
  const regexpMailto = /mailto:/;
  const regexpSlash = /^\//m;
  const regexpUrlLike = new RegExp(
    `^[a-zA-Z]{1,256}.${linksUrl}\/?|^${linksUrl}\/?`
  );
  const regNoslashNourl =
    /^[-a-zA-Z0-9@%_\+~#=]{1,256}\/|^[-a-zA-Z0-9@%_\+~#=]{1,256}.html/;

  for (let i = 0; i < list.length; i++) {
    // extract href from <a>
    list[i] = list[i].getAttribute("href");

    // change / at the start to correct form with Url
    list[i] = list[i].replace(regexpSlash, `${linksUrl}/`);

    // correct all links starting with /
    if (list[i].search(regNoslashNourl) != -1) {
      list[i] = `${linksUrl}/` + list[i];
    }

    // erase http(s):// and www.
    list[i] = list[i].replace(regexpHTTP, "");

    // delete links that looks not like original Url
    if (list[i].search(regexpUrlLike) == -1) {
      console.log(`Link deleted: ${list[i]}`);
      delete list[i];
      continue;
    }

    //delete mailto:
    if (list[i].search(regexpMailto) != -1) {
      console.log(`Link deleted: ${list[i]}`);
      delete list[i];
      continue;
    }
  }
  return list;
}
