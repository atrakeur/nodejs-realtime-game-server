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
            try {
                this.joinPlayer(player.config.roomhash, player);
            } catch (err) {
                this.deleteRoom(player.config.roomhash);
                Utils.Observable.getInstance().dispatch("Error", {err: err});
            }
        });
        Utils.Observable.getInstance().addListener("Player_disconnected", (player: Players.Player) => {
            try {
                this.unjoinPlayer(player.config.roomhash, player);
            } catch (err) {
                this.deleteRoom(player.config.roomhash);
                Utils.Observable.getInstance().dispatch("Error", {err: err});
            }
        });

        Utils.Observable.getInstance().addListener("Server_stop", () => {
            var instance = this;
            this.rooms.foreachValue((key: string, room: Room) => {
                instance.deleteRoom(key);
            });
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

    public getCount() : number {
        return this.rooms.size();
    }

    public joinPlayer(roomHash: string, player: Players.Player) {
        var room: Room = this.rooms.get(roomHash);

        if (room == null) {
            throw new Error("Can't find room "+roomHash);
        }

        room.onJoin(player);
    }

    public unjoinPlayer(roomHash: string, player: Players.Player) {
        var room: Room = this.rooms.get(roomHash);

        if (room == null) {
            throw new Error("Can't find room "+roomHash);
        }

        room.onUnJoin(player);
    }

    public sendRoom(roomHash: string, message: any) {
        var room: Room = this.rooms.get(roomHash);

        if (room == null) {
            throw new Error("Can't find room "+roomHash);
        }

        room.send(message);
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
        if (message.name == "Room_send") {
            this.sendRoom(message.data.roomhash, message.data.message);
            return true;
        }


        return false;
    }

    handleWatchdog(counter: number) {
        this.rooms.foreachValue((key: string, room: Room) => {
            if (!room.isAlive()) {
                this.deleteRoom(key);
            }
            if (room.needAnnounce()) {
                room.onAnnounce();
            }
        });
    }

}

export class Room {

    public static ROOM_TIMEOUT = 10 * 1000;     //TIMEOUT to destroy room after last player leave
    public static ROOM_ANNOUNCE = 4 * 60 * 1000;//TIMEOUT to reannounce room

    public config: RoomConfig;
    public players: Utils.Map<string, Players.Player>;
    private lastActivity: number;
    private lastAnnounce: number;

    constructor(config: RoomConfig) {
        this.config = config;
        this.players = new Utils.Map<string, Players.Player>();
    }

    public onCreate() {
        this.lastActivity = Date.now();
        this.lastAnnounce = Date.now();
    }

    public onDelete() {
    }

    public onJoin(player: Players.Player) {
        this.lastActivity = Date.now();
        this.players.add(player.getID(), player);
        Utils.Observable.getInstance().dispatch("Room_joined", {room: this, player: player});
    }

    public onUnJoin(player: Players.Player) {
        this.lastActivity = Date.now();
        this.players.remove(player.getID());
        Utils.Observable.getInstance().dispatch("Room_unjoined", {room: this, player: player});
    }

    public onAnnounce() {
        this.lastAnnounce = Date.now();
        Utils.Observable.getInstance().dispatch("Room_announce", {room: this});
    }

    public getID(): string {
        return this.config.roomhash;
    }

    public needAnnounce(): boolean {
        return this.lastAnnounce + Room.ROOM_ANNOUNCE < Date.now();
    }

    public isAlive(): boolean {
        return this.players.size() > 0 || this.lastActivity + Room.ROOM_TIMEOUT > Date.now();
    }

    public send(message: any) {
        this.players.foreachValue((key: string, player: Players.Player) => {
            player.emit("message", message);
        });
    }

}