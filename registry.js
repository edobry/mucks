const http = require("http"),

    util = require("./util");

const LOG = message => console.log(message);

const handleRouteTable = (req, res) => {
    if(req.url != "/routes")
        return false;

    LOG("sending route table");

    res.writeHead(200, util.contentType("text"));
    res.end(JSON.stringify(routes));

    return true;
};

const randomPort = () =>
    2000 + Math.floor(Math.random() * 1000);

module.exports = class Registry {
    constructor(port) {
        this.port = port;

        this.routes = {};
        this.ports = {};
    }
    start() {
        this.server = http.createServer((req, res) => {
            if(handleRouteTable(req, res))
                return;

            var id = "";
            req
                .on("data", data => id += data)
                .on("end", () =>
                    this.register(id, util.splitPath(req.url).route, res));
        }).listen(this.port, () =>
            LOG(`registry listening on port ${this.port}`));
    }
    register(id, url, res) {
        const existingRegistration = this.routes[url];

        //TODO: implement heartbeat to release registrations on app death
        if(existingRegistration && existingRegistration.id != id) {
            res.writeHead(409, util.contentType("text"));
            res.write("url already registered");
            res.end();

            LOG(`${id} tried to register claimed route ${url}`);
            return;
        }

        const port = this.claimPort(id, url);

        res.writeHead(200, util.contentType("text"));
        res.write(port.toString());
        res.end();

        LOG(`registered ${url} to ${id} on port ${port}`);
    }
    claimPort(id, url) {
        var port;

        //ensure no collisions
        do port = randomPort();
        while(this.ports[port])

        this.ports[port] = id;
        this.routes[url] = { id, port };

        return port;
    };

};
