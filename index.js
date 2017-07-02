#!/usr/bin/env node

const
    nconf = require("nconf"),

    Registry = require("./registry"),
    Proxy = require("./proxy");

nconf.env().argv().defaults({
    proxyPort: 80,
    registryPort: 1999
});

const LOG = message => console.log(message);

const registry = new Registry(nconf.get("registryPort"));
const proxy = new Proxy(nconf.get("proxyPort"), registry);

registry.start();
proxy.start();
