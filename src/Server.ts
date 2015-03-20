/// <reference path="../def/node/node.d.ts" />
/// <reference path="../def/socket.io/socket.io.d.ts" />

/// <reference path="./Contracts/AppConfig.ts" />
/// <reference path="./Contracts/Message.ts" />

import Http = require("http");
import Socket = require("socket.io");
import Url = require('url');

import Utils = require("./Utils");

export class Server {

    private config: AppConfig;
    private http  : Http.Server;
    private io    : SocketIO.Server;

    private components: IServerComponent[];

    private watchdogCount: number;

    public constructor(config: AppConfig) {
        this.config = config;

        this.http = Http.createServer(this.handleHttp);
        this.components = [];

        this.watchdogCount = 0;

        setInterval(this.handleWatchdog, 1000);
    }

    public start() {
        this.http.listen(this.config.port, this.config.address);
        this.io   = Socket.listen(this.http);

        this.io.on('connect', this.handleSocket);
        Utils.Observable.getInstance().dispatch("Debug", {err: "Listening on "+this.config.address+":"+this.config.port});
    }

    public stop() {
        Utils.Observable.getInstance().dispatch("Server_stop", null);

        this.http.close();
    }

    public addComponent(component: IServerComponent) {
        this.components.push(component);
    }

    public deleteComponent(component: IServerComponent) {
        var index = this.components.indexOf(component);
        if (index >= 0 && index < this.components.length) {
            this.components.splice(index, 1);
        }
    }

    handleHttp = (request: Http.ServerRequest, responce: Http.ServerResponse) => {
        try {
            var data = <Message<any>> Utils.Crypto.urldecrypt(request.url, this.config.secure_key);
        } catch (error) {
            Utils.Observable.getInstance().dispatch("RequestError", {err: error, req: request});
            return Utils.Http.write(responce, 400, JSON.stringify(error));
        }

        if (Object.keys(data).length != 0) {
            Utils.Observable.getInstance().dispatch("Debug", {err: data});
        }

        try {
            for (var i = 0; i < this.components.length; i++) {
                var component: IServerComponent = this.components[i];
                var newResponce = component.handleHttp(request, responce, data);

                //Component returned a customised responce
                if (responce === newResponce)
                {
                    return responce.end();
                }
                //Component returned a default responce
                else if (newResponce === true)
                {
                    return Utils.Http.write(responce, 200, "OK");
                }
            }

            Utils.Observable.getInstance().dispatch(
                "RequestError",
                {err: new Error("404 Wrong input"), req: request, data: data}
            );
            return Utils.Http.write(responce, 404, "No handler found");
        } catch (e) {
            var error = <any>request;
            error.decodedData = data;
            Utils.Observable.getInstance().dispatch(
                "RequestError",
                {err: new Error("400 Request error"), req: error, data: data}
            );
            return Utils.Http.write(responce, 400, "Request error");
        }
    }

    handleSocket = (socket: SocketIO.Socket) => {
        socket.on("message", (message: any) => {
            Utils.Observable.getInstance().dispatch("Debug", {err: message});
        });
        socket.on('error', (err) => {
            Utils.Observable.getInstance().dispatch("SocketError", {err: err, req: socket});
        });

        for (var i = 0; i < this.components.length; i++) {
            var component: IServerComponent = this.components[i];

            if (component.handleSocket(socket)) {
                return;
            }
        }
    }

    handleWatchdog = () => {
        this.watchdogCount++;

        for (var i = 0; i < this.components.length; i++) {
            var component: IServerComponent = this.components[i];
            component.handleWatchdog(this.watchdogCount);
        }
    }

}

interface IServerComponent {

    /**
     * Handle an http request
     * @param request
     * @param responce
     */
    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, data: Message<any>): any;

    /**
     * Handle a socket connection
     * @param socket
     */
    handleSocket(socket: SocketIO.Socket): void;

    /**
     * Handle a watchdog event (bookkeeping)
     * @param message
     */
    handleWatchdog(counter: number);

}

export class ServerComponent implements IServerComponent {
    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, data: Message<any>): any {
        return false;
    }
    handleSocket(socket:SocketIO.Socket): void {
    }
    handleWatchdog(counter: number) {
    }
}
