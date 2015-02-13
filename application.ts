import Application = require("./src/Application");

var config = {
    address   : process.env.OPENSHIFT_NODEJS_IP    || "0.0.0.0",
    port      : process.env.OPENSHIFT_NODEJS_PORT  || 8085,
    secure_key: "abcdef1234",
    config_url: "http://www.battleflight.com/game/internal/config"
};

var application = new Application.Application(config);
application.start();