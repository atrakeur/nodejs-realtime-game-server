/// <reference path="./Contracts/AppConfig.ts" />
/// <reference path="./Contracts/Message.ts" />
/// <reference path="./Contracts/RoomConfig.ts" />

import Http    = require("http");
import App     = require("./Application");
import Server  = require("./Server");
import Players = require("./Players");
import Utils   = require("./Utils");

/**
 * Manages room list
 *
 * @event Room_created
 * @event Room_deleted
 */
export class RoomList extends Server.ServerComponent {

    private config: AppConfig;

    private rooms: Utils.Map<string, Room>;

    constructor(config: AppConfig) {
        super();

        this.config = config;

        this.rooms = new Utils.Map<string, Room>();

        Utils.Observable.getInstance().addListener("Player_connected", (player: Players.Player) => {
            this.joinPlayer(player.config.roomhash, player);
        });
        Utils.Observable.getInstance().addListener("Player_disconnected", (player: Players.Player) => {
            this.unjoinPlayer(player.config.roomhash, player);
        });
    }

    public createRoom(config: RoomConfig): Room {
        if (this.rooms.containsKey(config.roomhash)) {
            throw new Error("Room "+config.roomhash+" all ready exists");
        }

        var room = new Room(config);
        this.rooms.add(config.roomhash, room);
        room.onCreate();

        console.log("Created room " + config.roomhash)

        Utils.Observable.getInstance().dispatch("Room_created", room);

        return room;
    }

    public getRoom(hash: string): Room {
        return this.rooms.get(hash);
    }

    public deleteRoom(hash: string): void {
        var room = this.rooms.get(hash);

        if (room != null) {
            room.onDelete();

            Utils.Observable.getInstance().dispatch("Room_deleted", room);

            this.rooms.remove(hash);
        }
    }

    public joinPlayer(roomHash: string, player: Players.Player) {
        var room: Room = this.rooms.get(roomHash);

        if (room == null) {
            throw new Error("Can't find room "+roomHash);
        }

        room.players.add(player.getID(), player);

        Utils.Observable.getInstance().dispatch("Room_joined", {room: room, player: player});
    }

    public unjoinPlayer(roomHash: string, player: Players.Player) {
        var roomHash: string = player.getID();
        var room: Room = this.rooms.get(roomHash);

        if (room == null) {
            throw new Error("Can't find room "+roomHash);
        }

        room.players.remove(player.getID());

        Utils.Observable.getInstance().dispatch("Room_unjoined", {room: room, player: player});
    }

    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, message: Message<RoomConfig>): any {
        if (message.name == "Room_create") {
            this.createRoom(message.data);
            return true;
        }
        if (message.name == "Room_delete") {
            this.deleteRoom(message.data.roomhash);
            return true;
        }

        return false;
    }

    handleWatchdog(counter: number) {
    }

}

export class Room {

    public config: RoomConfig;
    public players: Utils.Map<string, Players.Player>;

    constructor(config: RoomConfig) {
        this.config = config;
        this.players = new Utils.Map<string, Players.Player>();
    }

    public onCreate() {
    }

    public onDelete() {
    }

    public getID(): string {
        return this.config.roomhash;
    }

    public isAlive(): boolean {
        return true;
    }

}