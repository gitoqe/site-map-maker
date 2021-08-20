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
  const regexpCorrectUrl = /*  process.argv[3]
  ? process.argv[3]
  :  */ /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;

  if (regexpCorrectUrl.test(url)) {
    console.log(`[✔] Correct URL: ${url}`);
    return true;
  } else {
    console.log(`[✖] incorrect URL: ${url}`);
    console.log(`Mask is: https://ihateregex.io/expr/url/`);
    //console.log(`You can set your own regexp as second argument`);
    return false;
  }
}

/*
  https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
  https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
  @startuml
  Bob -> Alice : hello
  @enduml
  
  2. change type of operation from truncate & write to read & append
  TODO
  3. check if the current file is the first (base of webpage)
    + first? -> #1 & #2
    - not first -> add info to base file
      https://nodejs.org/api/fs.html#fs_file_system_flags 'a' flag
*/

/**
 *
 * @param {string} url
 * @param {number} depthOfParsing
 * @returns
 */
function main(url, depthOfParsing = 1) {
  // 1. check URL
  if (!isUrlCorrect(url)) return;

  // 2. Creating folder for results
  // Name contains: 
  // TODO cut URL by "/" -> разбивка URL по слешам -> сохранение папки с именем + время/дата обращения ?
  let today = new Date()
  let launchTime = 5;
   console.log(today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate())
  console.log(today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds())
  // TODO multiple calls for resource -> different directories?
  // TODO сохранение пути к файлам в отдельную переменную, передача при writeFile

  let options = {
    hostname: URL,
    path: "/",
    method: "GET",
  };

  /**
   * TODO
    1. check if folder of project exists
      + check name of folder
      + create new folder with name `hostname-1` like
        https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
      + store data here
      - create new folder with name `hostname-1` like
      - store data here
   */

  // https://flaviocopes.com/how-to-check-if-file-exists-node/

  try {
    if (fs.existsSync(`./parseResults/${options.hostname}`)) {
      console.log("[✔] Directory exists");
    } else {
      console.log(
        "[ ] Directory for files does not exists\n[ ] Creating directory"
      );
      //fs.mkdir(`./parsedResults/${options.hostname}`);

      fs.mkdir(`${__dirname}/parseResults/${options.hostname}`, (err) => {
        if (err) {
          return console.error(err);
        }
        console.log("[✔] Directory created successfully!");
      });
    }
  } catch (err) {
    console.error(err);
    console.log("error occured :Z");
  }

  // https://nodejs.dev/learn/making-http-requests-with-nodejs
  // options for request

  sendHttpRequest(options).then((result) => {
    // saving raw file
    writeFile(result, `${options.hostname}`, `raw`);

    // building links.json object
    let linksAsObj = parseLinks(options, result);

    // saving links.json file
    writeFile(JSON.stringify(linksAsObj), `${options.hostname}`, `links.json`);
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
 * @param {String} resourseName Name of file
 * @param {String} fileSubName Where to save
 */
function writeFile(data, resourseName, fileSubName) {
  let path = `${__dirname}/parseResults/${resourseName}/${resourseName}-${fileSubName}`;
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

  // erase duplicates
  list = list.filter(function (item, pos) {
    return list.indexOf(item) == pos;
  });

  return list;
}
