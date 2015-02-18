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
            this.joinPlayer(player.config.room, player);
        });
        Utils.Observable.getInstance().addListener("Player_disconnected", (player: Players.Player) => {
            this.unjoinPlayer(player.config.room, player);
        });
    }

    public createRoom(config: RoomConfig): Room {
        if (this.rooms.containsKey(config.hash)) {
            throw new Error("Room "+config.hash+" all ready exists");
        }

        var room = new Room(config);
        this.rooms.add(config.hash, room);
        room.onCreate();

        console.log("Created room " + config.hash)

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
            this.deleteRoom(message.data.hash);
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
        return this.config.hash;
    }

    public isAlive(): boolean {
        return true;
    }

}