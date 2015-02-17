import Application = require("./src/Application");

var config = {
    address   : process.env.OPENSHIFT_NODEJS_IP    || "0.0.0.0",
    port      : process.env.OPENSHIFT_NODEJS_PORT  || 8085,
    secure_key: process.env.OPENSHIFT_SECURE_KEY   || "abcdef1234"
};

var application = new Application.Application(config);
application.start();