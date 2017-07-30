const http = require("http"),

    httpProxy = require("http-proxy");

    util = require("./util");

const LOG = message => console.log(message);

module.exports = class Proxy {
    constructor(port, registry) {
        this.port = port;
        this.registry = registry;
    }
    start() {
        this.proxy = httpProxy.createProxyServer({});

        this.server = http.createServer((req, res) => {
            const path = util.splitPath(req.url);

            if(path.rest.length == "") {
                path.rest = path.route;
                path.route = "";
            }

            const route = this.registry.routes[path.route];

            if(!route) {
                res.writeHead(404);
                res.end("unknown route");
                return;
            }

            req.url = path.rest;

            LOG(`routing to ${route.id}`);

            //TODO: handle unresponsive targets better
            this.proxy.web(req, res, {
                target: `http://localhost:${route.port}`});

            this.proxy.on("error", e =>
                console.log(`Proxy error: ${e.message}`));
        }).listen(this.port, () =>
            LOG(`proxy listening on port ${this.port}`));
    }
};
