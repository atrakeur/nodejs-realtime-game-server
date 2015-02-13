/// <reference path="./Contracts/AppConfig.ts" />
/// <reference path="./Contracts/Message.ts" />

import Http = require("http");

import Server = require("./Server");

export class RoomList extends Server.ServerComponent {

    private config: AppConfig;

    private rooms: Room[];

    constructor(config: AppConfig) {
        super();

        this.config = config;

        this.rooms = [];
    }

    public createRoom(hash: string): Room {
        var room = new Room(hash);
        this.rooms[hash] = room;
        return room;
    }

    public getRoom(hash: string): Room {
        return this.rooms[hash];
    }

    public deleteRoom(hash: string): void {
        delete this.rooms[hash];
    }

    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse): boolean {
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

export class Room {

    private hash: string;

    constructor(hash: string) {
        this.hash = hash;
    }

}