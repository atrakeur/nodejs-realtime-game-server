/// <reference path="../def/node/node.d.ts" />
/// <reference path="../def/socket.io/socket.io.d.ts" />
/// <reference path="../def/request/request.d.ts" />
/// <reference path="./AppConfig.ts" />
import Request = require("request");
import Server = require("./Server");
import Rooms  = require("./Rooms");

export class Application {

    private server: Server.Server;
    private rooms : Rooms.RoomList;

    private config: AppConfig;

    public constructor(config: AppConfig)
    {
        this.config = config;

        this.server = new Server.Server(config);
        this.rooms = new Rooms.RoomList(config);
    }

    public start(): void {
        this.server.start();
    }

    public stop(): void {
        this.server.stop();
    }

}
