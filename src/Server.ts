/// <reference path="../def/node/node.d.ts" />
/// <reference path="../def/socket.io/socket.io.d.ts" />
/// <reference path="./AppConfig.ts" />

import Http = require("http");
import Socket = require("socket.io");

export class Server {

    private config: AppConfig;
    private http  : Http.Server;
    private io    : SocketIO.Server;

    public constructor(config: AppConfig)
    {
        this.config = config;

        this.http = Http.createServer(this.handleHttp);
        console.log("Server created");
    }

    public start()
    {
        this.http.listen(this.config.port, this.config.address);
        this.io   = Socket.listen(this.http);

        console.log("Listening on "+this.config.address+":"+this.config.port);
    }

    public stop()
    {
        this.http.close();
    }

    public handleHttp = (request: Http.ServerRequest, responce: Http.ServerResponse) => {
        //TODO decode request, executeAction, and respond

        responce.write("Welcome!");
        responce.end();
    }

}
