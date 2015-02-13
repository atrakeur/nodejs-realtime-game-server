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

    public constructor(config: AppConfig) {
        this.config = config;

        this.http = Http.createServer(this.handleHttp);
        this.components = [];
    }

    public start() {
        this.http.listen(this.config.port, this.config.address);
        this.io   = Socket.listen(this.http);

        this.io.on('connect', this.handleConnect);
        console.log("Listening on "+this.config.address+":"+this.config.port);
    }

    public stop() {
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
        var data = Utils.Crypto.urldecrypt(request.url, this.config.secure_key);
        console.log(data);

        for (var i = 0; i < this.components.length; i++) {
            var component: IServerComponent = this.components[i];

            if (component.handleHttp(request, responce, data)) {
                return responce.end();
            }
        }

        responce.writeHead(404);
        responce.write("Not found");
        responce.end();
    }

    handleConnect = (socket: SocketIO.Socket) => {
        console.log("Connect " + socket.id);
        socket.on('message', this.handleMessage);
        socket.on('disconnect', () => {
            //Workaround to pass the correct socket to handleDisconnect
            this.handleDisconnect(socket);
        });

        for (var i = 0; i < this.components.length; i++) {
            var component: IServerComponent = this.components[i];

            if (component.handleConnect(socket)) {
                return;
            }
        }
    }

    handleDisconnect = (socket: SocketIO.Socket) => {
        console.log("Disconnect " + socket.id);

        for (var i = 0; i < this.components.length; i++) {
            var component: IServerComponent = this.components[i];

            if (component.handleDisconnect(socket)) {
                return;
            }
        }
    }

    handleMessage = (message: Message<any>) => {
        for (var i = 0; i < this.components.length; i++) {
            var component: IServerComponent = this.components[i];

            if (component.handleMessage(message)) {
                return;
            }
        }
    }

}

interface IServerComponent {

    /**
     * Handle an http request
     * @param request
     * @param responce
     */
    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, data: any): boolean;

    /**
     * Handle a socket connection
     * @param socket
     */
    handleConnect(socket: SocketIO.Socket): boolean;

    /**
     * Handle a socket disconnect
     * @param socket
     */
    handleDisconnect(socket: SocketIO.Socket): boolean;

    /**
     * Handle a socket message
     * @param message
     */
    handleMessage(message: any): boolean;

}

export class ServerComponent implements IServerComponent {
    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, data: any): boolean {
        return false;
    }
    handleConnect(socket:SocketIO.Socket):boolean {
        return false;
    }
    handleDisconnect(socket:SocketIO.Socket):boolean {
        return false;
    }
    handleMessage(message:any):boolean {
        return false;
    }
}
