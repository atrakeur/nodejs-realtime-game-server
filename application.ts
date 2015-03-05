import Application = require("./src/Application");
import Utils = require("./src/Utils");

var config = {
    address    : process.env.OPENSHIFT_NODEJS_IP    || "0.0.0.0",
    port       : process.env.OPENSHIFT_NODEJS_PORT  || 8085,
    secure_key : process.env.OPENSHIFT_SECURE_KEY   || "abcdef1234",
    rollbar_key: process.env.OPENSHIFT_ROLLBAR_KEY   || ""
};

var application = new Application.Application(config);
application.start();

