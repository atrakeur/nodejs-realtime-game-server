/// <reference path="./Contracts/AppConfig.ts" />
/// <reference path="./Contracts/Message.ts" />
/// <reference path="./Contracts/RoomConfig.ts" />

import Http   = require("http");
import Server = require("./Server");
import Utils  = require("./Utils");

export class RoomList extends Server.ServerComponent {

    private config: AppConfig;

    private rooms: Utils.Map<string, Room>;

    constructor(config: AppConfig) {
        super();

        this.config = config;

        this.rooms = new Utils.Map<string, Room>();
    }

    public createRoom(config: RoomConfig): Room {
        if (this.rooms.containsKey(config.hash)) {
            throw new Error("Room "+config.hash+" all ready exists");
        }

        var room = new Room(config);
        this.rooms.add(config.hash, room);
        room.onCreate();

        return room;
    }

    public getRoom(hash: string): Room {
        return this.rooms.get(hash);
    }

    public deleteRoom(hash: string): void {
        var room = this.rooms.get(hash);

        if (room != null) {
            room.onDelete();
            this.rooms.remove(hash);
        }

        return room;
    }

    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, message: Message<RoomConfig>): any {
        if (message.name == "Room_create") {
            this.createRoom(message.data);
            return true;
        }

        return false;
    }
    handleSocket(socket:SocketIO.Socket):boolean {
        return false;
    }
    handleWatchdog(counter: number) {
    }

}

export class Room {

    private config: RoomConfig;

    constructor(config: RoomConfig) {
        this.config = config;
    }

    public onCreate() {
        Utils.CallbackHandler.getInstance().sendCallback(this.config.callbackUrl, "Room_created", this);
    }

    public onDelete() {
        Utils.CallbackHandler.getInstance().sendCallback(this.config.callbackUrl, "Room_deleted", this);
    }

}