/// <reference path="./Contracts/AppConfig.ts" />
/// <reference path="./Contracts/Message.ts" />
/// <reference path="./Contracts/PlayerConfig.ts" />

import Http = require("http");

import Server = require("./Server");
import Utils  = require("./Utils");

export class PlayerList extends Server.ServerComponent {

    private config: AppConfig;

    private players: Utils.Map<string, Player>;

    constructor(config: AppConfig) {
        super();

        this.config = config;

        this.players = new Utils.Map<string, Player>();
    }

    handleSocket(socket:SocketIO.Socket) {
        socket.on("message", (message: Message<PlayerConfig>) => {
            if (message.name == "Players_connect") {
                this.handleConnect(socket, message);
            }
        });
        socket.on("disconnect", (message: Message<PlayerConfig>) => {
            this.handleDisconnect(socket, message);
        });
    }

    handleConnect(socket: SocketIO.Socket, message: Message<PlayerConfig>) {
        var player = new Player(message.data, socket);
        this.players.add(player.getID(), player);
        player.onCreate();
    }

    handleDisconnect(socket: SocketIO.Socket, message: Message<PlayerConfig>) {

    }

}

export class Player {

    private config: PlayerConfig;
    private socket: SocketIO.Socket;

    public constructor(config: PlayerConfig, socket: SocketIO.Socket) {
        this.config = config;
        this.socket = socket;
    }

    public getID(): string {
        return this.config.hash;
    }

}