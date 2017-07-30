const
    http = require("http"),
    fs = require("fs"),

    httpProxy = require("http-proxy");

    util = require("./util");

const LOG = message => console.log(message);

module.exports = class Proxy {
    constructor({ port, ssl }, registry) {
        this.port = port;
        this.registry = registry;

        if(ssl) {
            this.secure = true;

            console.log("reading SSL keys...");
            this.ssl = {
                key: fs.readFileSync(ssl.key, "utf8"),
                cert: fs.readFileSync(ssl.cert, "utf8")
            };
        }
    }
    start() {
        const options = {};

        if(this.secure) {
            console.log("proxy is using SSL");
            options.ssl = this.ssl;
        }

        this.proxy = httpProxy.createProxyServer(options);

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

            LOG(`routing to ${route.id} on port ${route.port}`);

            //TODO: handle unresponsive targets better
            this.proxy.web(req, res, {
                target: {
                    host: "localhost",
                    port: route.port
                }
            });

            this.proxy.on("error", e =>
                console.log(`Proxy error: ${e.message}`));
        }).listen(this.port, () =>
            LOG(`proxy listening on port ${this.port}`));
    }
};
