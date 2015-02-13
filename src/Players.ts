/// <reference path="./Contracts/AppConfig.ts" />
/// <reference path="./Contracts/Message.ts" />

import Http = require("http");

import Server = require("./Server");

export class PlayerList extends Server.ServerComponent {

    private config: AppConfig;

    private players: Player[];

    constructor(config: AppConfig) {
        super();

        this.config = config;

        this.players = [];
    }

    public createPlayer(socket: SocketIO.Socket): Player {
        var player = new Player(socket);
        this.players[player.getID()] = player;
        return player;
    }

    public getPlayer(hash: string): Player {
        return this.players[hash];
    }

    public deletePlayer(hash: string): void {
        delete this.players[hash];
    }

    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, data: Message<any>): any {
        return false;
    }
    handleConnect(socket:SocketIO.Socket):boolean {
        return false;
    }
    handleDisconnect(socket:SocketIO.Socket):boolean {
        return false;
    }
    handleMessage(message: Message<any>):boolean {
        return false;
    }

}

export class Player {

    private socket: SocketIO.Socket;

    public constructor(socket: SocketIO.Socket) {
        this.socket = socket;
    }

    public getID(): string {
        return this.socket.id;
    }

}