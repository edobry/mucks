const  parseUrl = require("url").parse;

const util = {};

const contentTypes = {
    text: "text/plain"
};
util.contentType = type => ({
    "Content-Type": contentTypes[type]
});

util.splitPath = url => {
    const path = parseUrl(url).pathname.split('/');

    return {
        route: path[1],
        rest: path.slice(2).join("/")
    };
};

module.exports = util;
