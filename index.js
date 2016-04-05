var http = require("http"),
    httpProxy = require("http-proxy");

var LOG = message => console.log(message);

var proxyPort = 80;
var proxy = httpProxy.createProxyServer({});

var proxyServer = http.createServer((req, res) => {
    var route = routes[req.url];
    req.url = "";

    LOG(`routing to ${route.id}`);
    proxy.web(req, res, { target: `http://localhost:${route.port}`});
}).listen(proxyPort);
LOG(`proxy listening on port ${proxyPort}`);

var routes = {};

var randomPort = () => 2000 + Math.floor(Math.random() * 1000);

var claimPort = (id, url) => {
    var port = randomPort();
    routes[url] = { id, port };
    return port;
};

var register = (id, url, res) => {
    var port = claimPort(id, url);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write(port.toString());
    res.end();

    LOG(`registered ${url} to ${id} on port ${port}`);
};

var handleRouteTable = (req, res) => {
    if(req.url == "/routes") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(routes));
        return;
    }
}

var registryPort = 1999;
var registryServer = http.createServer((req, res) => {
    handleRouteTable(req, res);

    var id = "";
    req.on("data", data => { id += data; })
       .on("end", () => register(id, req.url, res));
}).listen(registryPort);

LOG(`registry listening on port ${registryPort}`);
