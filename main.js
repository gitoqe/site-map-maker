const http = require("http"); // requests
const fs = require("fs"); // filesystem
const DomParser = require("dom-parser");
const parser = new DomParser();

const URL = process.argv[2].toLowerCase();
const DEPTH = process.argv[3];

main(URL, DEPTH);

/**
 * Check is URL correct or not?
 * @param {string} url
 * @returns {boolean}
 */
function isUrlCorrect(url) {
  const regexpCorrectUrl =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;

  if (regexpCorrectUrl.test(url)) {
    console.log(`[✔] Correct URL: ${url}`);
    return true;
  } else {
    console.log(`[✖] incorrect URL: ${url}`);
    console.log(`Used mask is: https://ihateregex.io/expr/url/`);
    //console.log(`You can set your own regexp as second argument`);
    return false;
  }
}

/**
 * Extract hostname and path from url
 * @param {String} url
 * @returns hostname, path
 */
function disassembleUrl(url) {
  url = url.replace(/http[s]?:\/\/www.|http[s]?:\/\//, "");
  let hostname = url.split("/")[0];
  let path = "/";
  if (url.indexOf("/") != -1) {
    path = url.slice(url.indexOf("/"));
  }
  return { hostname, path };
}

/**
 * Main function
 * @param {string} url
 * @param {number} depthOfParsing
 */
function main(url, depthOfParsing = 1) {
  //TODO use depth
  // 1. Check URL
  if (!isUrlCorrect(url)) return;

  // 2.1 Extract hostname and path from url
  const { hostname, path } = disassembleUrl(url);

  // 2.2 Add current time and date to directiry name
  let today = new Date();
  const directoryName =
    hostname +
    path.split("/").join("-") +
    "-" +
    today.getDate() +
    (today.getMonth() + 1) +
    today.getFullYear() +
    "." +
    today.getHours() +
    today.getMinutes() +
    today.getSeconds();

  let requestOptions = {
    hostname: hostname,
    path: path,
    method: "GET",
  };

  try {
    if (fs.existsSync(`./parseResults/${directoryName}`)) {
      console.log("[✔] Directory exists");
    } else {
      console.log(`[ ] Directory for files does not exists. Creating.`);
      fs.mkdir(`${__dirname}/parseResults/${directoryName}`, (err) => {
        if (err) {
          return console.error(err);
        }
        console.log(`[✔] Directory "${directoryName}" created successfully!`);
      });
    }
  } catch (err) {
    console.log("[✖] Error with directory creation:");
    console.error(err);
  }

  // https://nodejs.dev/learn/making-http-requests-with-nodejs
  // returns Promise
  let mainPageLinks = sendHttpRequest(requestOptions).then((result) => {
    // saving raw file
    writeFile(result, directoryName, hostname, `original-raw`).then(
      (successMessage) => {
        console.log(successMessage);
      }
    );

    // building links.json object
    let linksAsObject = parseLinks(requestOptions, result);

    // saving links.json file
    writeFile(
      JSON.stringify(linksAsObject),
      directoryName,
      hostname,
      `original-links.json`
    ).then((successMessage) => {
      console.log(successMessage);
    });
    return linksAsObject;
  });

  mainPageLinks.then((list) => {
    console.log(list);
  });

  // TODO check promises
  // TODO recursive work with links, using DEPTH
  //console.log(linksAsObject);

  /*
  TODO parse from JSON to UML
  https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
  https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
  @startuml
  Bob -> Alice : hello
  @enduml
*/
}

/**
 * HTTP GET request
 * @param {object} requestOptions Parameters for HTTP request
 * @returns Promise
 */
function sendHttpRequest(requestOptions) {
  // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise
  return new Promise((resolve, reject) => {
    const request = http.request(requestOptions, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        // return ?
        reject(new Error(`Error status code: ${response.statusCode}`));
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
 * @param {String} directoryName Name of directory
 * @param {String} fileName Name of file
 * @param {String} fileSubName What is inside
 */
function writeFile(data, directoryName, fileName, fileSubName) {
  // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise
  return new Promise((resolve, reject) => {
    let path = `${__dirname}/parseResults/${directoryName}/${fileName}-${fileSubName}`;
    fs.writeFile(path, data, (err) => {
      if (err) {
        reject(`[✖] Error with file saving: ${err}`);
      } else {
        resolve(`[✔] File saved as: ${path}`);
      }
    });
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
  //linksObject["baseUrl"] = resourseUrl;
  linksObject[resourseUrl] = [];

  listOfLinkNodes = filterLinks(listOfLinkNodes, resourseUrl);

  // write to JSON
  listOfLinkNodes.forEach((element) => {
    let temp = {};
    temp[element] = [];
    linksObject[resourseUrl].push(temp);
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
      console.log(`Link deleted: ${list[i]}. Case: not like original url`);
      delete list[i];
      continue;
    }

    // delete mailto:
    if (list[i].search(regexpMailto) != -1) {
      console.log(`Link deleted: ${list[i]}. Case: mailto`);
      delete list[i];
      continue;
    }

    // delete same self-link
    if (list[i] == linksUrl) {
      console.log(`Link deleted: ${list[i]}. Case: recursive`);
      delete list[i];
      continue;
    }
  }

  // erase duplicates
  list = list.filter(function (item, pos) {
    return list.indexOf(item) == pos;
  });

  return list;
}
