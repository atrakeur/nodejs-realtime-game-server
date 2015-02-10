/// <reference path="../def/node/node.d.ts" />
/// <reference path="../def/socket.io/socket.io.d.ts" />

var config = {
    address: process.env.OPENSHIFT_NODEJS_IP   || "0.0.0.0",
    port   : process.env.OPENSHIFT_NODEJS_PORT || 8080
};

