/// <reference path="../def/node/node.d.ts" />
/// <reference path="../def/socket.io/socket.io.d.ts" />
/// <reference path="../def/request/request.d.ts" />

/// <reference path="./Contracts/AppConfig.ts" />
import Request = require("request");
import Server  = require("./Server");
import Rooms   = require("./Rooms");
import Players = require("./Players");
import Status = require("./Status");
import Utils   = require("./Utils");

export class Application {

    private server: Server.Server;
    private rooms : Rooms.RoomList;
    private players: Players.PlayerList;
    private status: Status.StatusComponent;

    private callback: CallbackHandler;

    private config: AppConfig;

    public constructor(config: AppConfig)
    {
        this.config = config;

        this.callback = new CallbackHandler(config);
        this.callback.attach(Utils.Observable.getInstance());

        this.server  = new Server.Server(config);
        this.rooms   = new Rooms.RoomList(config);
        this.players = new Players.PlayerList(config);
        this.status  = new Status.StatusComponent(config);

        this.server.addComponent(this.rooms);
        this.server.addComponent(this.players);
        this.server.addComponent(this.status);
    }

    public start(): void {
        this.server.start();

        var instance = this;
        process.on('SIGINT', function() {
            Utils.Observable.getInstance().dispatch("Server_stopping", null);

            Utils.Observable.getInstance().dispatch("Info", {err: "Server is going down..."});
            instance.stop();

            setInterval(() => {
                Utils.Observable.getInstance().dispatch("Info", {err: "Waiting for connections to clear up"});
                //TODO move this logic to respective objects
                if (instance.rooms.getCount() != 0 || instance.players.getCount() != 0) {
                    return;
                }

                Utils.Observable.getInstance().dispatch("Server_stopped", null);
                Utils.Observable.getInstance().dispatch("Info", {err: "Server is down"});
                process.exit();
            }, 1000);
        });
    }

    public stop(): void {
        this.server.stop();
    }

}

export class CallbackHandler {

    private static instance: CallbackHandler;

    private config: AppConfig;
    private events: Utils.Observable<any>;

    public static getInstance(): CallbackHandler {
        return CallbackHandler.instance;
    }

    public constructor(config: AppConfig) {
        CallbackHandler.instance = this;

        this.config = config;
    }

    public attach(observable: Utils.Observable<any>) {
        this.events = observable;

        this.events.addListener("Room_created", (room: Rooms.Room) => {
            this.sendCallback(room.config.callbackUrl, "Room_created", room.config);
        });
        this.events.addListener("Room_deleted", (room: Rooms.Room) => {
            this.sendCallback(room.config.callbackUrl, "Room_deleted", room.config);
        });
        this.events.addListener("Room_joined", (data: any) => {
            var room : Rooms.Room = data.room;
            var player : Players.Player = data.player;
            this.sendCallback(room.config.callbackUrl, "Room_joined", {room: room.getID(), player: player.getID()});
        });
        this.events.addListener("Room_unjoined", (data: any) => {
            var room : Rooms.Room = data.room;
            var player : Players.Player = data.player;
            this.sendCallback(room.config.callbackUrl, "Room_unjoined", {room: room.getID(), player: player.getID()});
        });
        this.events.addListener("Room_announce", (data: any) => {
            var room : Rooms.Room = data.room;
            this.sendCallback(room.config.callbackUrl, "Room_announce", {room: room.getID(), players: room.players});
        });
    }

    public sendCallback(url: string, name: string, data: any) {
        var payload = {
            name: name,
            data: data
        };

        var urlData = Utils.Crypto.urlencrypt(payload, this.config.secure_key);
        var fullUrl = url + '?' + urlData;

        if (this.config.callback_debug_key != "") {
            fullUrl = fullUrl + "&" + "XDEBUG_SESSION_START="+this.config.callback_debug_key;
        }

        Utils.Observable.getInstance().dispatch("Debug", {err: "Sending "+JSON.stringify(payload)+" to "+url+""});
        Request(fullUrl, function (error, response, body) {
            if (error || response.statusCode != 200) {
                Utils.Observable.getInstance().dispatch("Error", {err: new Error("Callback "+url+" error "+body)});
            } else {
                if (body.toLowerCase() != "ok") {
                    console.log(body);
                }
            }
        });
    }

}
