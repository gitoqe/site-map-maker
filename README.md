# website map maker ?

### How:

`node main.js` _`URL`_ _`DEPTH`_

Example:

```shell
node main.js google.com 1
```

#### Steps:

0. get with cli: `URL` and `DEPTH` of parsing
1. check `URL`
   - is it correct?
   - is there any subpages/folders in `URL` like: `a.com/b/c/d`
1. create folder for results
   - no folder -> create
1. make request for `URL`
   - get raw html
   - save as file `URL-raw`
1. parse raw html, extract links into array
1. filter links
   - save as file `URL-links`
1. if `DEPTH` > 1
   - for each link in links
     - set `links[i]` as `URL*`
     - make request for this `URL*`
     - update array by adding subarray to `links[i]`
   - if `DEPTH` > 2
     - for ...
     - and so on

### for what?

- to make a "map" for links on old website
- practice

### techs:

- javascript/nodejs

### used links:

1. making request
   - https://nodejs.dev/learn/making-http-requests-with-nodejs
1. correct http request + promise
   - https://stackoverflow.com/questions/38533580/nodejs-how-to-promisify-http-request-reject-got-called-two-times
1. writing files
   - https://stackoverflow.com/questions/2496710/writing-files-in-node-js
1. promises
   - https://learn.javascript.ru/promise-chaining
1. regexp and replace
   - https://learn.javascript.ru/regexp-methods#str-replace-str-regexp-str-func
