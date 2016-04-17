var http = require("http"),
    parseUrl = require("url").parse,
    httpProxy = require("http-proxy");

var LOG = message => console.log(message);

var proxyPort = 80;
var proxy = httpProxy.createProxyServer({});

var splitPath = url => {
    var path = parseUrl(url).pathname.split('/');

    return {
        route: path[1],
        rest: path.slice(2).join('/')
    };
};

var proxyServer = http.createServer((req, res) => {
    var path = splitPath(req.url);
    var route = routes[path.route];

    if(!route) {
        res.writeHead(404);
        res.end("unknown route");
        return;
    }

    req.url = path.rest;

    LOG(`routing to ${route.id}`);
    proxy.web(req, res, { target: `http://localhost:${route.port}`});
}).listen(proxyPort);
LOG(`proxy listening on port ${proxyPort}`);

var routes = {};
var ports = {};
var randomPort = () => 2000 + Math.floor(Math.random() * 1000);

var claimPort = (id, url) => {
    var port;

    //ensure no collisions
    do port = randomPort();
    while(ports[port])

    ports[port] = id;
    routes[url] = { id, port };

    return port;
};

var register = (id, url, res) => {
    if(routes[url]) {
        res.writeHead(409, { "Content-Type": "text/plain" });
        res.write("url already registered");
        res.end();

        LOG(`${id} tried to register claimed route ${url}`);
        return;
    }

    var port = claimPort(id, url);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write(port.toString());
    res.end();

    LOG(`registered ${url} to ${id} on port ${port}`);
};

var handleRouteTable = (req, res) => {
    if(req.url != "/routes")
        return false;

    LOG("sending route table");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(routes));

    return true;
};

var registryPort = 1999;
var registryServer = http.createServer((req, res) => {
    if(handleRouteTable(req, res)) return;

    var id = "";
    req.on("data", data => id += data)
       .on("end", () => register(id, splitPath(req.url).route, res));
}).listen(registryPort);
LOG(`registry listening on port ${registryPort}`);
