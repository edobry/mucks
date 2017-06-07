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
        this.server = http.createServer(this.handle.bind(this))
            .listen(this.port, () =>
                LOG(`registry listening on port ${this.port}`));
    }
    handle(req, res) {
        if(handleRouteTable(req, res))
            return;

        var body = "";
        req
            .on("data", data => body += data)
            .on("end", () =>
                this.register(JSON.parse(body), util.splitPath(req.url).route, res));
    }
    register({ id, port }, route, res) {
        const existingRegistration = this.routes[route];

        //TODO: implement heartbeat to release registrations on`` app death
        if(existingRegistration && existingRegistration.id != id) {
            res.writeHead(409, util.contentType("text"));
            res.end("route already registered");

            LOG(`${id} tried to register claimed route ${route}`);
            return;
        }

        const claimedPort = this.claimPort(res, id, route, port);

        res.writeHead(200, util.contentType("text"));
        res.end(claimedPort.toString());

        LOG(`registered ${route} to ${id} on port ${claimedPort}`);
    }
    claimPort(res, id, url, port) {
        if(this.ports[port]) {
            res.writeHead(409, util.contentType("text"));
            res.end("port already claimed");

            LOG(`${id} tried to claim occupied port ${port}`);
            return;
        }

        if(!port) {
            //ensure no collisions
            do port = randomPort();
            while(this.ports[port])
        }

        this.ports[port] = id;
        this.routes[url] = { id, port };

        return port;
    };
};
