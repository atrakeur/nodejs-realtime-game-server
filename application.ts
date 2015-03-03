import Application = require("./src/Application");
import Utils = require("./src/Utils");

//Setup rollbar reporting
//Import it the old because there is no definition for this library
//TODO move it to a logging class?
var rollbar = require("rollbar");
rollbar.init(process.env.OPENSHIFT_ROLLBAR_KEY || "abcdef1234");
process.on('uncaughtException', (err) => {
    rollbar.handleError(err);
});
Utils.Observable.getInstance().addListener("Error", (data) => {
    rollbar.handleError(data.err);
});
Utils.Observable.getInstance().addListener("RequestError", (data) => {
    rollbar.handleError(data.err, data.req);
});
Utils.Observable.getInstance().addListener("Server_stopped", () => {
    rollbar.shutdown();
});

var config = {
    address   : process.env.OPENSHIFT_NODEJS_IP    || "0.0.0.0",
    port      : process.env.OPENSHIFT_NODEJS_PORT  || 8085,
    secure_key: process.env.OPENSHIFT_SECURE_KEY   || "abcdef1234"
};

var application = new Application.Application(config);
application.start();

