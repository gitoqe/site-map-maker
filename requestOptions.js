/**
 * Class for request options
 */
class RequestOptions {
    /**
     * Create options object
     * @param {string} hostname
     * @param {string} path
     */
    constructor(hostname, path) {
        this.hostname = hostname;
        this.path = path;
        this.method = "GET";
    }
}

module.exports = {
    RequestOptions
}
