/// <reference path="../def/node/node.d.ts" />
/// <reference path="../def/socket.io/socket.io.d.ts" />
/// <reference path="../def/request/request.d.ts" />

/// <reference path="./Contracts/AppConfig.ts" />
import Request = require("request");
import Server  = require("./Server");
import Rooms   = require("./Rooms");
import Players = require("./Players");
import Utils   = require("./Utils");

export class Application {

    private server: Server.Server;
    private rooms : Rooms.RoomList;
    private players: Players.PlayerList;

    private config: AppConfig;

    public constructor(config: AppConfig)
    {
        this.config = config;

        new Utils.CallbackHandler(config);

        this.server  = new Server.Server(config);
        this.rooms   = new Rooms.RoomList(config);
        this.players = new Players.PlayerList(config);

        this.server.addComponent(this.rooms);
        this.server.addComponent(this.players);
    }

    public start(): void {
        this.server.start();
    }

    public stop(): void {
        this.server.stop();
    }

}
